var React = require( 'react' );
var ReactDOM = require( 'react-dom' );
var passesStore = require( './stores/passes.js' )();
var DgxTimeAndLocation = require( './views/time-and-location.jsx' );
var DgxUpcomingPasses = require( './views/upcoming-passes.jsx' );
var DgxCurrentlyInView = require( './views/currently-in-view.jsx' );
var Settings = require( './views/settings.jsx' );

// TODO - move these vars and the graph drawing to a component
var paper;
var polarGraphSize;
var fullRadius;
var cx;
var cy;

function convertAzElToXY( azdeg, eldeg, scale ) {
	if ( 'undefined' === typeof scale ) {
		scale = 1.0;
	}

	if ( 'undefined' === typeof passesStore.location.bearing ) {
		passesStore.location.bearing = 0;
	}

	var radius = scale * fullRadius * ( 90.0 - eldeg ) / 90.0;
	azdeg = azdeg - 90 - passesStore.location.bearing; // so the current location's bearing is at the top
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

	passesStore.passes.forEach( function( pass ) {
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
			var position = passesStore.findPositionOfSatellite( pass.id, now );
			var tle = _.findWhere( passesStore.tles, { id: pass.id } );

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

function findCurrentPositionOfFavorites() {

	var favoritesPositions = [];
	var favoritesToPlot = [];
	var now = new Date();

	passesStore.favoriteIDs.forEach( function( favoriteID ) {
		var favoriteTLE = _.findWhere( passesStore.tles, { id: favoriteID } );
		if ( 'undefined' != typeof favoriteTLE ) {
			var position = passesStore.findPositionOfSatellite( favoriteID, now );

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
	passesStore.init();

	// Position drawing area and keep it that way
	repositionPolarGraphPaper();
	$( window ).resize( function() {
		repositionPolarGraphPaper();
	} );

	setInterval( function() {
		ReactDOM.render(
			React.createElement( DgxTimeAndLocation, {} ), document.getElementById( 'time-and-location' )
		);

		if ( passesStore.tles.length ) {
			findCurrentPositionOfFavorites();
			renderInViewList();

			ReactDOM.render(
				React.createElement( Settings, {} ), document.getElementById( 'settings' )
			);

			ReactDOM.render(
				React.createElement( DgxUpcomingPasses, {} ), document.getElementById( 'upcoming-passes' )
			);

			ReactDOM.render(
				React.createElement( DgxCurrentlyInView, {} ), document.getElementById( 'currently-in-view' )
			);


		}
	}, 1000 );

} );
