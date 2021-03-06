"use strict";

var ChildProcess = require( 'child_process' );
var Fs = require( 'fs' );

class Docker {

	constructor ( project, data ) {
		this._project = project;
		this._data = data;
		this._image = null;
		this._path = null;
		this._file = null;
	}

	Build () {
		var argv = this._project.getApp().getArgv();
		var isLocal = Fs.existsSync( this._path );
		var options = { stdio: 'inherit' };
		if ( isLocal ) {
			options.cwd = this._path;
			console.info( 'Local build directory is', this._path );
		}
		var args = [ 'build', '--force-rm=true', '-t', this._image ];
		if ( this._file ) {
			args.push( '-f', this._file );
		}
		if ( argv[ 'no-cache' ] ) {
			args.push( '--no-cache' );
		}
		if ( argv[ 'pull' ] ) {
			args.push( '--pull' );
		}
		if ( isLocal ) {
			args.push( '.' );
		}
		else {
			args.push( this._path );
		}
		var ret = Docker._spawn( 'docker', args, options );
		return ret.status === 0;
	}

	Push () {
		var options = { stdio: 'inherit' };
		var args = [ 'push', this._image ];
		var ret = Docker._spawn( 'docker', args, options );
		return ret.status === 0;
	}

	Clean () {
		var argv = this._project.getApp().getArgv();
		var options = { stdio: 'inherit' };
		var args = [ 'rmi' ];
		if ( argv.force ) {
			args.push( '-f' )
		}
		args.push( this._image );
		var ret = Docker._spawn( 'docker', args, options );
		return ret.status === 0;
	}

	enter () {

		var vars = this._project.getVars();
		this._image = vars.render( yaml( this._data.image, vars ) );
		this._path = vars.render( yaml( this._data.path, vars ) );
		if ( this._data.file ) {
			this._file = vars.render( yaml( this._data.file, vars ) );
		}

	}

	exit () {
	}

	static _spawn ( cmd, args, options ) {
		// docker has animated output
		console.cli( cmd, args.join( ' ' ) );
		return ChildProcess.spawnSync( cmd, args, options );
	}

}

module.exports = Docker;