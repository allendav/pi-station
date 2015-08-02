var paper;
var polarGraphSize = 500.0;
var fullRadius = 0.90 * polarGraphSize / 2.0;
var cx = polarGraphSize / 2.0;
var cy = polarGraphSize / 2.0;

var tles = [];
var upcomingPasses = [];
var favoriteIDs = [
	7530,  // AMSAT OSCAR 7
	24278, // FO-29 / JAS 2
	25544, // ISS
	27607, // SAUDISAT 50
	36122, // HOPE 1
	39444  // Funcube 1
];

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

function getColorMapValue( min, current, max ) {
	var red, green, blue, color;
	var midpoint = 0.5 * ( max - min );

	var percent = Math.floor( 100.0 * ( current - min ) / ( max - min ) );

	if ( percent > 50 ) {
		red = 255 - Math.floor( 255.0 * ( percent - 50 ) / 50 );
		green = 255;
		blue = 0;
	} else if ( percent < 5 ) {
		red = 80;
		blue = 80;
		green = 80;
	} else {
		red = 255;
		green = Math.floor( 255 * percent / 50 );
		blue = 0;
	}

	return "#" + numberToHex( red ) + numberToHex( green ) + numberToHex( blue );
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

function plotSatellites( satellites ) {

	// Plot each satellite
	satellites.forEach( function( satellite, index, array ) {
		if ( null !== satellite.azimuth && null !== satellite.elevation ) {
			var satCenter = convertAzElToXY( satellite.azimuth, satellite.elevation );
			var satSprite = paper.circle( satCenter.x, satCenter.y, 10 );
			var color = getColorMapValue( 0, satellite.snr, 100 );
			satSprite.attr( "stroke", color );
			satSprite.attr( "fill", color );

			var satLabel = paper.text( satCenter.x, satCenter.y - 20, satellite.prn );
			satLabel.attr( "font-size", "14" );
			satLabel.attr( "stroke", "#ccc" );
			satLabel.attr( "fill", "#ccc" );
		}
	} );
}

function updateFavoritesTable( satellites ) {

	var html = '';

	satellites.forEach( function( favorite ) {
		html += "<p";
		if ( favorite.elevation >= 0.0 ) {
			html += " class='in-view'";
		}
		html += "><a href='http://www.n2yo.com/?s=";
		html += favorite.id;
		html += "' target='_blank'>";
		html += favorite.name;
		html += "</a>";
		html += "<br/>";
		html += "Az: ";
		html += favorite.azimuth;
		html += ", El: ";
		html += favorite.elevation;

		if ( favorite.elevation < 0.0 ) {
			var nextPass = getNextPass( favorite.id );
			if ( false !== nextPass ) {
				var next = new Date();
				next.setTime( nextPass.startTime );
				var m = moment( next );

				html += '<br/>Next pass is ';
				html += m.fromNow();
				html += ' (maxEl: ';
				html += nextPass.maxEl;
				html += ')';
			}
		}

		html += "</p>";

	} );

	jQuery( "#favorites" ).html( html );
}

function getNextPass( satelliteID ) {
	// returns the next pass for the given satelliteID
	// returns false if we have no more passes in the store for this satelliteID

	var nextPass = false;
	var now = new Date();
	var nowTime = now.getTime();

	var passes = _.filter( upcomingPasses, function( pass ) {
		return ( pass.id === satelliteID );
	} );

	passes.forEach( function( pass ) {
		// note: assumes the passes are in chronological order in the store
		if ( ! nextPass && nowTime <= pass.startTime ) {
			nextPass = pass;
		}
	} );

	return nextPass;
}


function findUpcomingPassesOfFavorites() {

	upcomingPasses = [];

	var now = new Date();
	var nowTime = now.getTime();
	var then = new Date();
	var thenTime = then.getTime();

	favoriteIDs.forEach( function( favoriteID ) {
		var favoriteTLE = _.findWhere( tles, { id: favoriteID } );

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
							upcomingPasses.push( {
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

	// dump the pass database for debugging
	console.log( upcomingPasses );
}

function findPositionOfSatellite( satelliteID, dateTime ) {

	var azimuth = null;
	var elevation = null;
	var satelliteTLE = _.findWhere( tles, { id: satelliteID } );

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

	favoriteIDs.forEach( function( favoriteID ) {

		var favoriteTLE = _.findWhere( tles, { id: favoriteID } );
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

	drawPolarGraph();

	plotSatellites( favoritesToPlot );

	updateFavoritesTable( favoritesPositions );

}

$( document ).ready( function() {
	// Creates canvas 320 × 200 at 10, 50
	paper = Raphael( 50, 50, polarGraphSize, polarGraphSize );

	drawPolarGraph();

	var socket = io.connect();

	// listener, whenever the server emits 'gps-data', this updates the chat body
	socket.on( 'gps-data', function( data ) {
		drawPolarGraph();
		plotSatellites( data.satellites );
	} );

	// listener, whenever the server emits 'tle-data', this updates the chat body
	socket.on( 'tle-data', function( data ) {
		tles = data;
		findUpcomingPassesOfFavorites();
	} );

	setInterval( function() {
		if ( tles.length ) {
			findCurrentPositionOfFavorites();
		}
	}, 1000 );

} );
