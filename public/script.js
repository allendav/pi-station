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
	location: {
		longitude: 0,
		latitude: 0,
		altitude: 0,
		bearing: 180
	},
	favoriteIDs: [
		// 7530,  // AMSAT OSCAR 7
		// 24278, // FO-29 / JAS 2 SSB
		25544, // ISS
		27607, // SAUDISAT 50
		// 27844, // CUTE 1
		// 32789, // Delfi-C3
		39444, // Funcube 1 aka AO-73
		// 39770, // Sprout
		// 40897, // SERPENS
		// 40903, // XW-2A
		// 40911, // XW-2B
		// 40906, // XW-2C
		// 40907, // XW-2D
		// 40909, // XW-2E
		40910, // XW-2F
		40967  // AO-85 (FOX-1A)
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
			id: 32789,
			text: 'Downlink: 145.870 MHz, 1200 Baud, BPSK, AX.25, 100mW operational in Sun'
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
		{
			id: 40897,
			text: 'Downlink: 145.980 MHz GFSK modulation at 9600 bps and AX.25 every 10 seconds, 437.365 MHz CW/MSK at 1200 bps and CSP'
		},
		{
			id: 40903,
			text: 'Downlink: Digital Telemetry 145.640, CW Beacon 145.660, Linear Transponder 145.665 ‐ 145.685'
		},
		{
			id: 40911,
			text: 'Downlink: Digital Telemetry 145.705, CW Beacon 145.725, Linear Transponder 145.730 ‐ 145.750'
		},
		{
			id: 40906,
			text: 'Downlink: Digital Telemetry 145.770, CW Beacon 145.790, Linear Transponder 145.795 ‐ 145.815'
		},
		{
			id: 40907,
			text: 'Downlink: Digital Telemetry 145.835, CW Beacon 145.855, Linear Transponder 145.860 ‐ 145.880'
		},
		{
			id: 40909,
			text: 'Downlink: Digital Telemetry 145.890, CW Beacon 145.910, Linear Transponder 145.915 ‐ 145.935'
		},
		{
			id: 40910,
			text: 'Uplink: Linear Transponder 435.330 - 435.350 MHz; Downlink: Digital Telemetry 145.955, CW Beacon 145.975, Linear Transponder 145.980 ‐ 146.000'
		},
		{
			id: 40967,
			text: 'Uplink: 435.180 MHz w/ 67 Hz tone; Downlink: 145.980 MHz'
		}
	]
};

function convertAzElToXY( azdeg, eldeg, scale ) {
	if ( 'undefined' === typeof scale ) {
		scale = 1.0;
	}

	if ( 'undefined' === typeof coreStore.location.bearing ) {
		coreStore.location.bearing = 0;
	}

	var radius = scale * fullRadius * ( 90.0 - eldeg ) / 90.0;
	azdeg = azdeg - 90 - coreStore.location.bearing; // so the current location's bearing is at the top
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

	// Draw N, S, E, W
	var directions = {
		'N'  : 0,
		'NE' : 45,
		'E'  : 90,
		'SE' : 135,
		'S'  : 180,
		'SW' : 225,
		'W'  : 270,
		'NW' : 315
	};

	for ( var direction in directions ) {
		var directionLabelXY = convertAzElToXY( directions[direction], 0, 1.06 );
		var directionLabel = paper.text( directionLabelXY.x, directionLabelXY.y, direction );
		directionLabel.attr( "font-size", "12" );
		directionLabel.attr( "stroke", "#999" );
		directionLabel.attr( "fill", "#999" );
	}
}

function renderInViewList() {
	// Iterate over the passes list, rendering satellites currently in-view

	var html = '';
	var now = new Date();
	var nowTime = now.getTime();

	drawPolarGraph();

	coreStore.passes.forEach( function( pass ) {
		var okToShowSatellite = false;
		var okToPlot = false;
		var trackColor = "#ffff00";

		if ( nowTime >= pass.startTime && nowTime <= pass.endTime ) {
			okToPlot = true;
			okToShowSatellite = true;
		}

		var passHoveredSelector = '.s' + pass.id + '_' + pass.startTime + ':hover';

		if ( $( passHoveredSelector ).length > 0 ) {
			okToPlot = true;
			trackColor = "#00ffff";
		}

		if ( okToPlot ) {
			var position = findPositionOfSatellite( pass.id, now );
			var tle = _.findWhere( coreStore.tles, { id: pass.id } );

			var trackString = '';
			pass.positions.forEach( function( position, index ) {
				if ( 0 == index ) {
					trackString += "M";
				} else if ( 1 == index ) {
					trackString += "R";
				} else {
					trackString += " ";
				}

				var xy = convertAzElToXY( position.azimuth, position.elevation );
				trackString += xy.x + "," + xy.y;
			} );

			var track = paper.path( trackString );
			track.attr( "stroke", trackColor );

			if ( okToShowSatellite ) {
				var satCenter = convertAzElToXY( position.azimuth, position.elevation );
				var satSprite = paper.circle( satCenter.x, satCenter.y, 10 );
				satSprite.attr( "stroke", "#ffff00" );
				satSprite.attr( "fill", "#ffff00" );

				var satLabel = paper.text( satCenter.x, satCenter.y - 20, tle.satName );
				satLabel.attr( "font-size", "14" );
				satLabel.attr( "stroke", "#ccc" );
				satLabel.attr( "fill", "#ccc" );
			}
		}
	} );
}

// TODO - move this to the server side
function findPassesOfFavorites() {

	if ( 0 == coreStore.tles.length ) {
		return;
	}

	coreStore.passes = [];

	var now = new Date();
	var nowTime = now.getTime() - 30 * 60 * 1000; // start a half hour ago
	var then = new Date();
	var thenTime = then.getTime();

	coreStore.favoriteIDs.forEach( function( favoriteID ) {
		var favoriteTLE = _.findWhere( coreStore.tles, { id: favoriteID } );

		var inPass = false;
		var position;

		var startTime, startAz, maxElTime, maxElAz, endTime, endAz;

		var maxEl = -1.0;
		var passPositions = [];

		// Only do any of this if we have TLEs
		if ( favoriteTLE ) {

			// Find all passes for this satellite for the next 1440 minutes (24 hours)
			for ( var minutes = 0; minutes < 1440; minutes++ ) {

				thenTime = nowTime + minutes * 60000;
				then.setTime( thenTime );

				position = findPositionOfSatellite( favoriteID, then );

				if ( null !== position.elevation ) {
					if ( position.elevation >= 0.0 ) {
						passPositions.push( {
							time: thenTime,
							azimuth: position.azimuth,
							elevation: position.elevation
						} );
					}

					if ( ! inPass && position.elevation >= 0.0 ) { // the pass has begun
						inPass = true;
						startTime = thenTime;
						startAz = position.azimuth;
					} else if ( inPass && position.elevation < 0.0 ) { // the pass has ended
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
								endAz: position.azimuth,
								positions: passPositions
							} );
						}

						// Reset for next pass
						maxEl = -1.0;
						passPositions = [];
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

	// Now, refine the found passes to second (not minute) resolution
	coreStore.passes.forEach( function ( pass, index ) {
		inPass = false;
		thenTime = pass.startTime - 60 * 1000;
		maxEl = -1.0;

		do {
			then.setTime( thenTime );
			position = findPositionOfSatellite( pass.id, then );

			if ( ! inPass && position.elevation >= 0.0 ) {
				inPass = true;
				startTime = thenTime;
				startAz = position.azimuth;
			} else if ( inPass && position.elevation < 0.0 ) {
				inPass = false;
				endTime = thenTime;
				endAz = position.azimuth;
			}

			if ( inPass && position.elevation > maxEl ) {
				maxEl = position.elevation;
				maxElAz = position.azimuth;
				maxElTime = thenTime;
			}

			thenTime += 1000; // increment by one second
		} while ( thenTime < pass.endTime + 60 * 1000 );

		// update the record with the precision times
		pass.startTime = startTime;
		pass.startAz = startAz;
		pass.maxEl = maxEl;
		pass.maxElAz = maxElAz;
		pass.maxElTime = maxElTime;
		pass.endTime = endTime;
		pass.endAz = endAz;
		coreStore.passes[ index ] = pass;
	} );

	// Lastly, sort the passes in chronological order
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

		var observerGd = {
			longitude: coreStore.location.longitude * deg2rad,
			latitude: coreStore.location.latitude * deg2rad,
			height: 0.001 * coreStore.location.altitude // m -> km. above WGS 84 ellipsoid?
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
		rangeSat  = Math.floor( lookAngles.rangeSat );
	}

	return { azimuth: azimuth, elevation: elevation, rangeSat: rangeSat };
}

function findCurrentPositionOfFavorites() {

	var favoritesPositions = [];
	var favoritesToPlot = [];
	var now = new Date();

	coreStore.favoriteIDs.forEach( function( favoriteID ) {
		var favoriteTLE = _.findWhere( coreStore.tles, { id: favoriteID } );
		if ( 'undefined' != typeof favoriteTLE ) {
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
		}
	} );

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
		repositionPolarGraphPaper();
	} );

	var socket = io.connect();

	socket.on( 'location', function( data ) {
		coreStore.location = data;
		findPassesOfFavorites();
	} );

	// listener, whenever the server emits 'tle-data', this updates the chat body
	socket.on( 'tle-data', function( data ) {
		coreStore.tles = data.tle;
		coreStore.lastModified = new Date( data.lastModified );
		findPassesOfFavorites();
	} );

	setInterval( function() {
		React.render(
			React.createElement( DgxTimeAndLocation, {
				location: coreStore.location
			} ), document.getElementById( 'time-and-location' )
		);

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
