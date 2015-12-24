var React = require( 'react' );
var DgxSatellite = require( './satellite.jsx' );

module.exports = React.createClass( {

	propTypes: {
		passes: React.PropTypes.array.isRequired,
		satellites: React.PropTypes.array.isRequired
	},

	render: function() {
		var now = new Date();
		var nowTime = now.getTime();

		// Find all satellites with passes beginning in the future
		var satelliteIDs = [];
		this.props.passes.map( function( pass ) {
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
						var tle = _.findWhere( this.props.satellites, { id: satelliteID } );
						var note = _.findWhere( this.props.notes, { id: satelliteID} );
						if ( 'undefined' === typeof note ) {
							note = { text: '' };
						}

						var passes = this.props.passes.filter( function( p ) {
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
