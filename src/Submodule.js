"use strict";

var Git = require( './Git' );

class Submodule {
	
	constructor ( repo, data ) {
		this._repo = repo;
		this._data = data;
		this._remote = null;
		this._local = null;
	}

	Sync ( argv ) {
		var vars = this._repo.getProject().getVars();
		var git = new Git( vars, vars.render( this._remote ), vars.render( this._local ) );

		if ( argv.clean && !git.clean() ) {
			return false;
		}

		if ( !git.sync() ) {
			return false;
		}

		return true;
	}

	Clean ( argv ) {
		var vars = this._repo.getProject().getVars();
		var git = new Git( vars, vars.render( this._remote ), vars.render( this._local ) );

		return git.clean();
	}

	enter () {
		var vars = this._repo.getProject().getVars();

		this._remote = vars.render( yaml( this._data.remote, vars ) );
		this._local = vars.render( yaml( this._data.local, vars ) );
	}

	exit () {

	}

	isUsingRepo ( repo ) {
		
		var src = Git.getFullRemote( this._remote );
		var dest = Git.getFullRemote( repo );

		return src.repo == dest.repo && src.branch == dest.branch;
	}

}

module.exports = Submodule;