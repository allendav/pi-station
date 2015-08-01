/**
 * Fetch and cache and JSONify TLE
 */

var fs = require( 'fs' );
var util = require( 'util' );
var EventEmitter = require( 'events' ).EventEmitter;


var store = {
	lastModified: false,
	tle: []
};

function TLEStore () {
	EventEmitter.call( this );
	this.loadCachedTLE();
};

util.inherits( TLEStore, EventEmitter );

TLEStore.prototype.loadCachedTLE = function() {
	console.log( 'in loadCachedTLE' );

	fs.readFile( 'cache/tle.txt', 'utf8', function( error, data ) {
		if ( error ) {
			this.requestTLE();
		} else {
			this.processTLE( data );
			setTimeout( this.requestTLE, this.tleRequestInterval );
		}
	}.bind( this ) );
};

TLEStore.prototype.processTLE = function( data ) {
	data = String( data );
	data = data.replace( /[\r]/g, '' );

	var lines = data.split( '\n' );
	var lineCount = lines.length;
	var idx = 0;

	var satName, tleLine1, tleLine2;

	store.tle = [];

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

			console.log( entry );

			store.tle.push( entry );
		}
		idx += 3;
	} while ( idx + 2 < lineCount );

	this.emit( "change", store ); 
};

TLEStore.prototype.requestTLE = function() {
	console.log( 'in requestTLE' );
	// GNDN
};

TLEStore.prototype.isTLEAvailable = function() {
	return ( 0 !== store.tle.length );
}

TLEStore.prototype.getTLE = function() {
	return store.tle;
}

module.exports = TLEStore;
