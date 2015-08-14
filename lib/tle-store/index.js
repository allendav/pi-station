/**
 * Fetch and cache and JSONify TLE
 */

var fs = require( 'fs' );
var http = require( 'http' );
var util = require( 'util' );
var EventEmitter = require( 'events' ).EventEmitter;

var HOURINMILLISECONDS = 3600000;
var DAYINMILLISECONDS = 86400000;

function TLEStore ( scope ) {

	this.store = {
		scope: scope,
		lastModified: false,  // the datatime of the TLE set in the cache, if any
		tle: []
	};

	EventEmitter.call( this );

	var now = new Date();

	this.store.lastModified = false;

	console.log( now, 'TLEStore - checking cache - ', this.store.scope );

	fs.stat( 'cache/' + this.store.scope, function( error, stat ) {
		if ( ! error ) {
			fs.readFile( 'cache/' + this.store.scope, 'utf8', function( error, data ) {
				if ( ! error ) {
					this.store.lastModified = stat.mtime;
					this.processTLE( data );
					if ( now - stat.mtime > DAYINMILLISECONDS ) {
						console.log( now, 'TLEStore - cached TLE is > 1 day old.  fetching fresh now.' );
						setTimeout( this.fetchTLE.bind( this ), 0 );
					} else {
						console.log( now, 'TLEStore - cached TLE is < 1 day old.  will check again in 1 day' );
						setTimeout( this.fetchTLE.bind( this ), DAYINMILLISECONDS );
					}
				} else {
					setTimeout( this.fetchTLE.bind( this ), 0 );
				}
			}.bind( this ) );
		} else {
			setTimeout( this.fetchTLE.bind( this ), 0 );
		}
	}.bind( this ) );

};

util.inherits( TLEStore, EventEmitter );

/**
 * Takes TLE as an array of lines (file contents) and converts
 * it into an array of TLE
 */

TLEStore.prototype.processTLE = function( data ) {
	data = String( data );
	data = data.replace( /[\r]/g, '' );

	var lines = data.split( '\n' );
	var lineCount = lines.length;
	var idx = 0;

	var satName, tleLine1, tleLine2;

	this.store.tle = [];

	do {
		if ( idx + 2 < lineCount ) {

			satName = lines[ idx ].trim();
			tleLine1 = lines[ idx + 1 ].trim();
			id = parseInt( tleLine1.substr( 2, 5 ) );
			tleLine2 = lines[ idx + 2].trim();

			entry = {
				id: id,
				satName:  satName,
				tleLine1: tleLine1,
				tleLine2: tleLine2
			};

			this.store.tle.push( entry );
		}
		idx += 3;
	} while ( idx + 2 < lineCount );

	this.emit( "change", this.store );
};


TLEStore.prototype.fetchTLE = function() {

	var now = new Date();
	console.log( now, 'fetchTLE - fetching celestrak TLE - ', this.store.scope );

	var data = '';

	http.get( 'http://www.celestrak.com/NORAD/elements/' + this.store.scope, function( res ) {
		res.on( 'data', function( chunk ) {
			data += chunk;
		} ).on( 'end', function() {
			fs.writeFile( 'cache/' + this.store.scope, data, function( error ) {} );
			this.store.lastModified = new Date();
			this.processTLE( data );
			setTimeout( this.fetchTLE.bind( this ), DAYINMILLISECONDS );
		}.bind( this ) ).on ( 'error', function() {
			setTimeout( this.fetchTLE.bind( this ), HOURINMILLISECONDS );
		}.bind( this ) );

	}.bind( this ) );
};

TLEStore.prototype.isTLEAvailable = function() {
	return ( 0 !== this.store.tle.length );
}

TLEStore.prototype.getTLE = function() {
	return this.store.tle;
}

TLEStore.prototype.getLastModified = function() {
	return this.store.lastModified;
}

module.exports = TLEStore;
