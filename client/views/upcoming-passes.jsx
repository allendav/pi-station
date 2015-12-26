var React = require( 'react' );
var DgxSatellite = require( './satellite.jsx' );
var passesStore = require( '../stores/passes.js' )();

module.exports = React.createClass( {

	render: function() {
		var now = new Date();
		var nowTime = now.getTime();

		// Find all satellites with passes beginning in the future
		var satelliteIDs = [];
		passesStore.passes.map( function( pass ) {
			if ( pass.startTime > nowTime ) {
				if ( -1 === satelliteIDs.indexOf( pass.id ) ) {
					satelliteIDs.push( pass.id );
				}
			};
		} );

		return (
			<div className='upcoming-passes section'>
				<h2>
					Upcoming Passes
				</h2>
				{
					satelliteIDs.map( function( satelliteID ) {
						var tle = _.findWhere( passesStore.tles, { id: satelliteID } );
						var note = _.findWhere( passesStore.notes, { id: satelliteID} );
						if ( 'undefined' === typeof note ) {
							note = { text: '' };
						}

						var passes = passesStore.passes.filter( function( p ) {
							if ( p.startTime < nowTime ) {
								return false;
							}
							return ( satelliteID === p.id );
						} );

						if ( 0 === passes.length ) {
							return null;
						}

						var pass = passes[0];
						var key = '' + pass.id + '-' + pass.startTime;

						return (
							<DgxSatellite
								key={ key }
								pass={ pass }
								satellite={ tle }
								note={ note.text }
								passes={ passes } />
						);
					}.bind( this ) )
				}
			</div>
		);
	}

} );
