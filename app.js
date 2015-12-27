var express = require( 'express' );
var app = express();
var config = require( 'config' );
var GPSParser = require( './lib/gps-parser' );
var Prowl = require( 'node-prowl' );
var TLEStore = require( './lib/tle-store' );
var SocketIO = require( 'socket.io' );

var socketIO = false;

app.use( express.static( 'public' ) );

// Bootstrap TLE service
console.log( '*** Bootstrapping TLE service ***' );

var tleStoreNOAA = new TLEStore( 'noaa.txt' );
var tleStoreAmateur = new TLEStore( 'amateur.txt' );
var tleStoreUser = new TLEStore( 'user.txt', false );

function getAggregateTLE() {
	var amateurTLE = tleStoreAmateur.getTLE();
	var noaaTLE = tleStoreNOAA.getTLE();
	var userTLE = tleStoreUser.getTLE();
	var combinedTLE = amateurTLE.concat( noaaTLE );
	combinedTLE = combinedTLE.concat( userTLE );

	var amateurLastModified = tleStoreAmateur.getLastModified();
	var noaaLastModified = tleStoreNOAA.getLastModified();

	var oldest = ( amateurLastModified < noaaLastModified ) ? amateurLastModified : noaaLastModified;

	// TODO - store TLEStores in an iterable array
	// TOOD - remove any duplicates
	// TODO - return the oldest of the lastmodified
	// TODO - mark each TLE separately with a lastModified?

	return ( {
		tle: combinedTLE,
		lastModified: oldest
	} );
}

tleStoreAmateur.on( 'change', function( store ) {
	if ( socketIO ) {
		// update connected clients
		socketIO.emit( 'tle-data', getAggregateTLE() );
	}
} );

// Bootstrap GPS service
// console.log( '*** Bootstrapping GPS service ***' );
// TODO : use gpsd

var prowl = false;
if ( config.has( 'prowl-key' ) ) {
	prowl = new Prowl( config.get( 'prowl-key' ) );
	prowl.push( 'pi-station has started', 'pi-station', function( err, remaining ) {
		if ( err ) {
			console.log( err );
		}
		console.log( 'I have ' + remaining + ' calls to the API remaining during the current hour ');
	} );
}

// Start serving sockets
console.log( '*** Listening for clients ***' );

var server = app.listen( 8080, function() {

	var host = server.address().address;
	var port = server.address().port;
	socketIO = SocketIO.listen( server );

	socketIO.on( 'connection', function( socket ) {
		// send location from config/default.json
		// TODO: use gpsd location instead
		socket.emit( 'location', config.get( 'location' ) );

		// if we have any poo, fling it now
		if ( tleStoreAmateur.isTLEAvailable() ) {
			socket.emit( 'tle-data', getAggregateTLE() );
		}
	} );

} );

