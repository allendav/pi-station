var React = require( 'react' );
var DgxSatellite = require( './satellite.jsx' );
var passesStore = require( '../stores/passes.js' )();

module.exports = React.createClass( {

	render: function() {
		var passesToShow = [];
		var now = new Date();
		var nowTime = now.getTime();
		var tle;
		var key;

		// Iterate over passes finding passes currently visible
		// and return just those passes

		// If there are none, return null

		passesStore.passes.forEach( function( pass ) {
			if ( nowTime >= pass.startTime && nowTime <= pass.endTime ) {
				passesToShow.push( pass );
			}
		} );

		if ( 0 === passesToShow.length ) {
			return null;
		}

		return (
			<div className='currently-in-view section'>
				<h2>
					Currently in View
				</h2>
				{
					passesToShow.map( function( pass ) {
						tle = _.findWhere( passesStore.tles, { id: pass.id } );
						note = _.findWhere( passesStore.notes, { id: pass.id } );
						if ( 'undefined' === typeof note ) {
							note = { text: '' };
						}
						key = '' + pass.id + '-' + pass.startTime;
						passes = passesStore.passes.filter( function( p ) {
							return ( pass.id === p.id);
						} );
						passes = [ passes[0] ];

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
