var express = require( 'express' );
var app = express();
var serialPort = require( 'serialport' );
var SerialPort = serialPort.SerialPort;
var GPSParser = require( './lib/gps-parser' );
var TLEStore = require( './lib/tle-store' );
var SocketIO = require( 'socket.io' );

var socketIO = false;

app.use( express.static( 'public' ) );

// Bootstrap TLE service

console.log( '*** Bootstrapping TLE service ***' );

var tleStoreNOAA = new TLEStore( 'noaa.txt' );
var tleStoreAmateur = new TLEStore( 'amateur.txt' );

function getAggregateTLE() {
	var amateurTLE = tleStoreAmateur.getTLE();
	var noaaTLE = tleStoreNOAA.getTLE();

	var combinedTLE = amateurTLE.concat( noaaTLE );

	var oldest = ( tleStoreNOAA < tleStoreAmateur ) ? tleStoreNOAA : tleStoreAmateur;

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
// TODO : use gpsd instead

console.log( '*** Bootstrapping GPS service ***' );

/*
serialPort.list( function ( err, ports ) {
	ports.forEach( function( port ) {
	console.log( "comName: ", port.comName );
	} );
} );

var usbModem = new SerialPort( '/dev/cu.usbmodem14211',
	{
		baudrate: 115200,
		parser: serialPort.parsers.readline( '\n' )
	}
);

usbModem.on( 'open', function() {
	console.log( 'open' );
	usbModem.on( 'data', function( data ) {
		// console.log( 'data received: ' + data );
		if ( GPSParser.parse( data ) && socketIO ) {
			var state = GPSParser.getState();
			socketIO.emit( 'gps-data', state );
			console.log( state );
		}
	} );
} );
*/

// Start serving sockets

console.log( '*** Listening for clients ***' );

var server = app.listen( 8080, function() {

	var host = server.address().address;
	var port = server.address().port;
	socketIO = SocketIO.listen( server );

	socketIO.on( 'connection', function( socket ) {
		// if we have any poo, fling it now
		if ( tleStoreAmateur.isTLEAvailable() ) {
			socket.emit( 'tle-data', getAggregateTLE() );
		}
	} );

} );

