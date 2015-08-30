/**
 * Client script for satellite tracking
 *
 */

// TODO - move these vars and the graph drawing to a component
var paper;
var polarGraphSize;
var fullRadius;
var cx;
var cy;

var coreStore = {
	tles: [],
	lastModified: false,
	passes: [],
	favoriteIDs: [
		7530,  // AMSAT OSCAR 7
		24278, // FO-29 / JAS 2
		25338, // NOAA-15
		25544, // ISS
		27607, // SAUDISAT 50
		27844, // CUTE 1
		28654, // NOAA-18
		32789, // Delfi-C3
		33591, // NOAA-19
		36122, // HOPE-1 aka HO-68
		39444, // Funcube 1 aka AO-73
		39770  // Sprout
	],
	notes: [
		{
			id: 7530,
			text: 'TLM Beacon: Downlink 145.9775 MHz CW; Uplink: 432.1250 – 432.1750 MHz SSB/CW; Downlink 145.9750 – 145.9250 MHz SSB/CW',
		},
		{
			id: 24278,
			text: 'Downlink 435.8000 – 435.9000 MHz SSB/CW'
		},
		{
			id: 25338,
			text: 'APT Downlink 137.620 MHz'
		},
		{
			id: 25544,
			text: 'Packet Downlink 145.825 MHz'
		},
		{
			id: 27607,
			text: 'Uplink: 145.850 MHz (67.0 Hz PL Tone) SO-50 also has a 10 minute timer that must be armed before use. Transmit a 2 second carrier with a PL tone of 74.4 to arm the timer.; Downlink: 436.800 MHz'
		},
		{
			id: 27844,
			text: 'Downlinks on CW Beacon 436.8375, packet 437.470'
		},
		{
			id: 28654,
			text: 'APT Downlink 137.9125 MHz'
		},
		{
			id: 32789,
			text: 'Downlink: 145.870 MHz, 1200 Baud, BPSK, AX.25, 100mW operational in Sun'
		},
		{
			id: 33591,
			text: 'APT Downlink 137.100 MHz'
		},
		{
			id: 36122,
			text: 'Downlink 435.7900 MHz CW Beacon; 435.6750 MHz FM Voice repeater; 435.7650 – 435.7150 MHz SSB/CW Linear transponder (inverted); 435.6750 MHz 1k2 AFSK FM'
		},
		{
			id: 39444,
			text: '145.935 MHz BPSK Telemetry; Transponder (eclipse only): 435.150 – 435.130 MHz Uplink; – 145.950 – 145.970 MHz Downlink'
		},
		{
			id: 39770,
			text: '437.525 MHz FM 1k2 AFSK AX.25, CW, SSTV Downlink'
		},
	]
};

function convertAzElToXY( azdeg, eldeg ) {
	var radius = fullRadius * ( 90.0 - eldeg ) / 90.0;
	azdeg = azdeg - 90; // (so N (0) is up)
	var x = cx + radius * Math.cos( Math.PI * azdeg / 180.0 );
	var y = cy + radius * Math.sin( Math.PI * azdeg / 180.0 );
	return { "x" : x, "y" : y };
}

function numberToHex( number ) {
	var hex = number.toString( 16 );

	while ( hex.length < 2 ) {
		hex = "0" + hex;
	}

	return hex;
}

function drawPolarGraph() {
	var color = "#444";

	// Clear it all (eventually use layers instead)
	paper.clear();

	// Create polar grid
	for ( var azi = 0; azi < 16; azi++ ) {
		var x2 = cx + fullRadius * Math.cos( 2.0 * Math.PI * azi / 16.0 );
		var y2 = cy + fullRadius * Math.sin( 2.0 * Math.PI * azi / 16.0 );
		var path = paper.path( "M" + cx + "," + cy + "L" + x2 + "," + y2 );
		color = "#444";
		if ( 0 === azi % 2 ) {
			color = "#666";
		}
		if ( 0 === azi % 4 ) {
			color = "#888";
		}
		path.attr( "stroke", color );
	}

	for ( var eli = 1; eli <= 9; eli++ ) {
		var circle = paper.circle( cx, cy, fullRadius * eli / 9.0 );
		color = "#444";
		if ( 0 === eli % 3 ) {
			color = "#666";
		}
		circle.attr( "stroke", color );
	}
}

// TODO: Make more generic, or split GPS satellite plotting out separately
function plotSatellites( satellites ) {

	// Plot each satellite
	satellites.forEach( function( satellite, index, array ) {
		if ( null !== satellite.azimuth && null !== satellite.elevation ) {
			var satCenter = convertAzElToXY( satellite.azimuth, satellite.elevation );
			var satSprite = paper.circle( satCenter.x, satCenter.y, 10 );
			satSprite.attr( "stroke", "#aaaa00" );
			satSprite.attr( "fill", "#aaaa00" );

			var satLabel = paper.text( satCenter.x, satCenter.y - 20, satellite.prn );
			satLabel.attr( "font-size", "14" );
			satLabel.attr( "stroke", "#ccc" );
			satLabel.attr( "fill", "#ccc" );
		}
	} );
}

function renderInViewList() {
	// Iterate over the passes list, rendering satellites currently in-view

	var html = '';
	var now = new Date();
	var nowTime = now.getTime();

	drawPolarGraph();

	coreStore.passes.forEach( function( pass ) {
		if ( nowTime >= pass.startTime && nowTime <= pass.endTime ) {

			var position = findPositionOfSatellite( pass.id, now );
			var tle = _.findWhere( coreStore.tles, { id: pass.id } );

			// Plot passes

			// So, this doesn't work - for passes already in progress, startAz doesn't have an El of 0.0
			// also probably need some more points for the spline

			// var p1 = convertAzElToXY( pass.startAz, 0 );
			// var p2 = convertAzElToXY( pass.maxElAz, pass.maxEl );
			// var p3 = convertAzElToXY( pass.endAz, 0 );

			// var track = paper.path( "M" + p1.x + "," + p1.y + " R" + p2.x + "," + p2.y + " " + p3.x + "," + p3.y );
			// track.attr( "stroke", "#0a0" );

			var satCenter = convertAzElToXY( position.azimuth, position.elevation );
			var satSprite = paper.circle( satCenter.x, satCenter.y, 10 );
			satSprite.attr( "stroke", "#ffff00" );
			satSprite.attr( "fill", "#ffff00" );

			var satLabel = paper.text( satCenter.x, satCenter.y - 20, tle.satName );
			satLabel.attr( "font-size", "14" );
			satLabel.attr( "stroke", "#ccc" );
			satLabel.attr( "fill", "#ccc" );

		}
	} );

	var m = moment( coreStore.lastModified );

	var html = "<h2>System Status</h2>";
	html += "<div class='inner-status'";
	html += "<p>Current Time: " + now.toString() + "</p>";
	html += "<p>Two Line Elements were updated " + m.fromNow() + "</p>";
	html += "</div>";

	jQuery( "#system-status" ).html( html );
}

// TODO - move this to the server side
function findPassesOfFavorites() {

	coreStore.passes = [];

	var now = new Date();
	var nowTime = now.getTime();
	var then = new Date();
	var thenTime = then.getTime();

	coreStore.favoriteIDs.forEach( function( favoriteID ) {
		var favoriteTLE = _.findWhere( coreStore.tles, { id: favoriteID } );

		var inPass = false;
		var position;

		var startTime, startAz, maxEl, maxElTime, maxElAz, endTime, endAz;

		if ( favoriteTLE ) {

			maxEl = -1.0;

			for ( var minutes = 0; minutes < 1440; minutes++ ) {

				thenTime = nowTime + minutes * 60000;
				then.setTime( thenTime );

				position = findPositionOfSatellite( favoriteID, then );
				if ( null !== position.elevation ) {
					if ( ! inPass && position.elevation >= 0.0 ) {
						inPass = true;
						startTime = thenTime;
						startAz = position.azimuth;
					} else if ( inPass && position.elevation < 0.0 ) {
						inPass = false;

						// save the record if Elevation got to at least 15 degrees
						if ( maxEl >= 15.0 ) {
							coreStore.passes.push( {
								id : favoriteID,
								startTime: startTime,
								startAz: startAz,
								maxEl: maxEl,
								maxElAz: maxElAz,
								maxElTime: maxElTime,
								endTime: thenTime,
								endAz: position.azimuth
							} );
						}

						// Reset maxEl for next pass
						maxEl = -1.0;
					}

					if ( inPass && position.elevation > maxEl ) {
						maxEl = position.elevation;
						maxElAz = position.azimuth;
						maxElTime = thenTime;
					}

				}

			}
		}

	} );

	coreStore.passes = coreStore.passes.sort( function( a, b ) {

		if ( a.startTime < b.startTime ) {
			return -1;
		}

		if ( a.startTime > b.startTime ) {
			return 1;
		}

		return 0;
	} );

}

function findPositionOfSatellite( satelliteID, dateTime ) {

	var azimuth = null;
	var elevation = null;
	var satelliteTLE = _.findWhere( coreStore.tles, { id: satelliteID } );

	if ( satelliteTLE ) {
		var satrec = satellite.twoline2satrec( satelliteTLE.tleLine1, satelliteTLE.tleLine2 );

		var positionAndVelocity = satellite.propagate(
			satrec,
			dateTime.getUTCFullYear(),
			dateTime.getUTCMonth() + 1, // Note, this function requires months in range 1-12.
			dateTime.getUTCDate(),
			dateTime.getUTCHours(),
			dateTime.getUTCMinutes(),
			dateTime.getUTCSeconds()
		);

		var positionEci = positionAndVelocity.position;

		var deg2rad = Math.PI / 180.;
		var rad2deg = 1. / deg2rad;

		// TODO: Set from GPS if available
		var observerGd = {
			longitude: -121.992397 * deg2rad,
			latitude: 47.90058 * deg2rad,
			height: 0.138 // km. above WGS 84 ellipsoid?
		};

		var gmst = satellite.gstimeFromDate(
			dateTime.getUTCFullYear(),
			dateTime.getUTCMonth() + 1, // Note, this function requires months in range 1-12.
			dateTime.getUTCDate(),
			dateTime.getUTCHours(),
			dateTime.getUTCMinutes(),
			dateTime.getUTCSeconds()
		);

		var positionEcf = satellite.eciToEcf( positionEci, gmst ),
			lookAngles  = satellite.ecfToLookAngles( observerGd, positionEcf );

		azimuth   = Math.floor( 10.0 * lookAngles.azimuth * rad2deg ) / 10.0;
		elevation = Math.floor( 10.0 * lookAngles.elevation * rad2deg ) / 10.0;

	}

	return { azimuth: azimuth, elevation: elevation };
}

function findCurrentPositionOfFavorites() {

	var favoritesPositions = [];
	var favoritesToPlot = [];
	var now = new Date();

	coreStore.favoriteIDs.forEach( function( favoriteID ) {
		var favoriteTLE = _.findWhere( coreStore.tles, { id: favoriteID } );
		var position = findPositionOfSatellite( favoriteID, now );

		if ( position.elevation >= 0 ) {
			favoritesToPlot.push( {
				prn: favoriteTLE.satName,
				azimuth: position.azimuth,
				elevation: position.elevation,
				snr: 100
			} );
		}

		favoritesPositions.push( {
			id: favoriteTLE.id,
			name: favoriteTLE.satName,
			azimuth: position.azimuth,
			elevation: position.elevation
		} );

	} );

	// drawPolarGraph();

	// plotSatellites( favoritesToPlot );

	renderInViewList();

}

function repositionPolarGraphPaper() {
	var width = $( '#polar-graph-paper' ).width();

	$( '#polar-graph-paper' ).css( { height: width } );

	polarGraphSize = width - 8;
	fullRadius = 0.90 * polarGraphSize / 2.0;
	cx = polarGraphSize / 2.0;
	cy = polarGraphSize / 2.0;

	var offset = $( '#polar-graph-paper' ).offset();

	if ( paper ) {
		paper.remove();
		paper = false;
	}

	// Creates canvas 320 × 200 at 10, 50
	paper = Raphael( offset.left + 4, offset.top + 4, polarGraphSize, polarGraphSize );

	drawPolarGraph();
}

jQuery( document ).ready( function( $ ) {
	// Position drawing area and keep it that way
	repositionPolarGraphPaper();
	$( window ).resize( function() {
		console.log( 'in resize handler' );
		repositionPolarGraphPaper();
	} );

	var socket = io.connect();

	// listener, whenever the server emits 'gps-data', this updates the chat body
	socket.on( 'gps-data', function( data ) {
		drawPolarGraph();
		plotSatellites( data.satellites );
	} );

	// listener, whenever the server emits 'tle-data', this updates the chat body
	socket.on( 'tle-data', function( data ) {
		coreStore.tles = data.tle;
		coreStore.lastModified = new Date( data.lastModified );
		findPassesOfFavorites();
	} );

	setInterval( function() {
		if ( coreStore.tles.length ) {
			findCurrentPositionOfFavorites();

			React.render(
				React.createElement( DgxUpcomingPasses, {
					passes: coreStore.passes,
					satellites: coreStore.tles,
					notes: coreStore.notes
				} ), document.getElementById( 'upcoming-passes' )
			);

			React.render(
				React.createElement( DgxCurrentlyInView, {
					passes: coreStore.passes,
					satellites: coreStore.tles,
					notes: coreStore.notes
				} ), document.getElementById( 'currently-in-view' )
			);


		}
	}, 1000 );

} );
