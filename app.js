var express = require( 'express' );
var app = express();
var serialPort = require( 'serialport' );
var SerialPort = serialPort.SerialPort;
var GPSParser = require( './lib/gpsparser' );
var SocketIO = require( 'socket.io' );

var socketIO = false;

app.use( express.static( 'public' ) );

var server = app.listen( 8080, function() {
	var host = server.address().address;
	var port = server.address().port;
	socketIO = SocketIO.listen( server );
	console.log( 'Listening at http://%s:%s', host, port );
} );

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
		console.log( 'data received: ' + data );
		if ( GPSParser.parse( data ) ) {
			var state = GPSParser.getState();
			socketIO.emit( 'statechange', state );
			console.log( state );
		}
	} );
} );
