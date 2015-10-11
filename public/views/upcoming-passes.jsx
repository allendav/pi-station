var DgxUpcomingPasses = React.createClass( {

	propTypes: {
		passes: React.PropTypes.array.isRequired,
		satellites: React.PropTypes.array.isRequired
	},

	render: function() {
		var now = new Date();
		var nowTime = now.getTime();
		var tle;
		var key;
		var pass;
		var passes;

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
						tle = _.findWhere( this.props.satellites, { id: satelliteID } );
						note = _.findWhere( this.props.notes, { id: satelliteID} );
						if ( 'undefined' === typeof note ) {
							note = { text: '' };
						}

						passes = this.props.passes.filter( function( p ) {
							if ( p.startTime < nowTime ) {
								return false;
							}
							return ( satelliteID === p.id );
						} );

						if ( 0 === passes.length ) {
							return null;
						}

						pass = passes[0];
						key = '' + pass.id + '-' + pass.startTime;

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
