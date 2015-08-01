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

var tleStore = new TLEStore();

tleStore.on( 'change', function( store ) {
	console.log( 'received tle change notification' );
	if ( socketIO ) {
		// update connected clients
		socketIO.emit( 'tle-data', tleStore.getTLE() );
	}
} );

// Bootstrap GPS service

console.log( '*** Bootstrapping GPS service ***' );

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
			// console.log( state );
		}
	} );
} );

// Start serving sockets

console.log( '*** Listening for clients ***' );

var server = app.listen( 8080, function() {

	var host = server.address().address;
	var port = server.address().port;
	socketIO = SocketIO.listen( server );
	console.log( 'Listening at http://%s:%s', host, port );

	socketIO.on( 'connection', function( socket ) {
		console.log( 'we have a new connection' );
		// if we have any poo, fling it now
		if ( tleStore.isTLEAvailable() ) {
			console.log( 'sending them tle-data' );
			socket.emit( 'tle-data', tleStore.getTLE() );
		} else {
			console.log( 'nothing available to send them yet' );
		}
	} );

} );

