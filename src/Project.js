"use strict";

var RockerCompose = require( './RockerCompose' );
var Docker = require( './Docker' );
var Repo = require( './Repo' );

class Project {

	constructor ( app, vars, data ) {

		this._app = app;
		this._vars = vars;

		while ( yaml( data.extends, vars ) ) {
			var tmpl = app.getTemplate( data.extends );
			delete data.extends;
			data = tmpl.mergeDeep( data );
		}
		this._data = data;
		this._name = data.name;
		this._repo = null;
		this._docker = null;
		this._rockerCompose = null;
		this._branches = null;

	}

	Sync ( argv ) {
		if ( this._repo === null ) {
			throw new Error( 'Can not sync a project (' + this._name + ') without git "repo" configuration.' );
		}
		this._repo.enter();
		var ret = this._repo.Sync( argv );
		this._repo.exit();
		return ret;
	}

	Clean ( argv ) {
		if ( this._repo === null ) {
			throw new Error( 'Can not sync a project (' + this._name + ') without git "repo" configuration.' );
		}
		this._repo.enter();
		var ret = this._repo.Clean( argv );
		this._repo.exit();
		return ret;
	}

	Build ( argv ) {
		if ( this._docker === null ) {
			throw new Error( 'Can not build a project (' + this._name + ') without "docker" configuration.' );
		}
		var ret = false;
		var dockers = this._docker;
		for ( var i = 0, iend = dockers.length; i < iend; ++i ) {
			var docker = dockers[ i ];
			docker.enter();
			ret = docker.Build( argv );
			docker.exit();
			if ( !ret ) {
				return ret;
			}
		}
		return ret;
	}

	Push ( argv ) {
		if ( this._docker === null ) {
			throw new Error( 'Can not push a project (' + this._name + ') without "docker" configuration.' );
		}
		var ret = false;
		var dockers = this._docker;
		for ( var i = 0, iend = dockers.length; i < iend; ++i ) {
			var docker = dockers[ i ];
			docker.enter();
			ret = docker.push( argv );
			docker.exit();
			if ( !ret ) {
				return ret;
			}
		}
		return ret;
	}

	Run ( argv ) {
		if ( this._rockerCompose === null ) {
			throw new Error( 'Can not run a project (' + this._name + ') without "pod" configuration.' );
		}
		this._rockerCompose.enter();
		var ret = this._rockerCompose.Run( argv );
		this._rockerCompose.exit();
		return ret;
	}

	Stop ( argv ) {
		if ( this._rockerCompose === null ) {
			throw new Error( 'Can not stop a project (' + this._name + ') without "pod" configuration.' );
		}
		this._rockerCompose.enter();
		var ret = this._rockerCompose.Stop( argv );
		this._rockerCompose.exit();
		return ret;
	}

	enter ( branch ) {
		var vars = this._vars;
		
		vars.push();

		vars.set( 'project', this._name );
		vars.set( 'branch', branch );
		vars.set( 'branch.tag', branch === 'master' ? 'latest' : branch );
		vars.set( 'branch.flat', branch.replace( /[^\d\w]/g, '' ) );

		var locals = this._data.vars;
		if ( locals instanceof Object ) {
			for ( var name in locals ) {
				vars.set( 'project.' + name, vars.render( yaml( locals[ name ], vars ) ) );
			}
		}

		
		this._branches = [];
		var branches = yaml( this._data.branches, vars );
		if ( branches instanceof Array ) {
			for ( var i = 0, iend = branches.length; i < iend; ++i ) {
				this._branches.push( vars.render( yaml( branches[ i ], vars ) ) );
			}
		}
		else if ( branches !== undefined ) {
			this._branches.push( vars.render( branches ) );
		}
		else {
			this._branches.push( '*' );
		}


		if ( this._data.repo ) {
			this._repo = new Repo( this, yaml( this._data.repo, vars ) );
		}

		if ( this._data.docker ) {
			var docker = yaml( this._data.docker, vars );
			if ( docker instanceof Array ) {
				this._docker = [];
				for ( var i = 0, iend = docker.length; i < iend; ++i ) {
					this._docker.push( new Docker( this, yaml( docker[ i ], vars ) ) );
				}
			}
			else {
				this._docker = [ new Docker( this, docker ) ];
			}
		}
		
		if ( this._data.pod ) {
			this._rockerCompose = new RockerCompose( this, yaml( this._data.pod, vars ) );
		}
	}

	exit () {
		this._vars.pop();
	}

	isBranchAllowed ( branch ) {
		var branch = this._vars.get( 'branch' );
		var branches = this._branches;
		for ( var i = 0, iend = branches.length; i < iend; ++i ) {
			var branch2 = branches[ i ];
			if ( Number.isNumber( branch2 ) ) {
				branch2 = branch2.toString();
			}
			if ( String.isString( branch2 ) && (branch == branch2 || branch2 == '*') ) {
				return true;
			}
			else if ( branch2 instanceof RegExp && branch.match( branch2 ) ) {
				return true;
			}
		}

		return false;
	}

	isUsingRepo ( repo ) {
		if ( this._repo === null ) {
			return false;
		}
		this._repo.enter();
		var ret = this._repo.isUsingRepo( repo );
		this._repo.exit();
		return ret;
	}

	getRepo () {
		return this._repo;
	}

	getApp () {
		return this._app;
	}

	getVars () {
		return this._vars;
	}

	getName () {
		return this._name;
	}
}

module.exports = Project;