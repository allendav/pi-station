var paper;
var polarGraphSize = 500.0;
var fullRadius = 0.95 * polarGraphSize / 2.0;
var cx = polarGraphSize / 2.0;
var cy = polarGraphSize / 2.0;

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

function drawPolarGraph( satellites ) {
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

$( document ).ready( function() {
	console.log( "ready!" );

	// Creates canvas 320 × 200 at 10, 50
	paper = Raphael( 50, 50, polarGraphSize, polarGraphSize );

	drawPolarGraph( [] );
} );
