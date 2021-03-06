"use strict";


class VarStack {
	
	constructor ( app ) {
		this._app = app;
		this._levels = [];
		this._vars = [];
	}

	getApp () {
		return this._app;
	}

	duplicate () {
		var ret = new VarStack();
		ret._app = this._app;
		ret._levels = this._levels.duplicate();
		ret._vars = this._vars.duplicate();
		return ret;
	}

	print () {
		var vars = this._vars;
		console.info( 'Vars:', '\n-----' )
		for ( var i = this._levels.last || 0, iend = vars.length; i < iend; ++i ) {
			var v = vars[ i ];
			if ( v.value instanceof Object ) {
				console.info( v.name, '= >', '\n', v.value, '\n', this.render( yaml( v.value, this ) ), '\n^^^' );
			}
			else {
				console.info( v.name, '=', this.render( yaml( v.value, this ) ) );
			}
		}
		console.info( '^^^^^\n' );
	}

	push ( name ) {
		this._levels.push( this._vars.length );
	}

	pop () {
		this._vars.length = this._levels.pop();
	}

	get ( name ) {
		var vars = this._vars;
		for ( var i = vars.length - 1; i >= 0; --i ) {
			var v = vars[ i ];
			if ( v.name === name ) {
				return v.value;
			}
		}
		return undefined;
	}

	set ( name, value ) {
		var vars = this._vars;
		for ( var i = vars.length - 1; i >= this._levels.last; --i ) {
			var v = vars[ i ];
			if ( v.name === name ) {
				return v.value = value;
			}
		}
		return this._vars.push( { name: name, value: value } );
	}

	render ( str ) {

		if ( !String.isString( str ) ) {
			return str;
		}

		var _this = this;
		return str.replace( /\$?\{([^}]+)\}/g, function ( match, name ) {
			var val = _this.get( name ) || match;
			if ( val === undefined ) {
				throw new Error( 'Error resolving variable ' + match );
				return val;
			}
			if ( val instanceof Function ) {
				val = val( global, require, _this );
			}
			else if ( val instanceof Object ) {
				val = val.toString( _this );
			}
			if ( String.isString( val ) && val != match ) {
				val = _this.render( val );
			}
			return val;
		} );
	}

}

module.exports = VarStack;