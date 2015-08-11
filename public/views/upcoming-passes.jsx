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
		var numberRendered = 0;

		// Iterate over passes finding passes in the future
		// and return just those passes
		return (
			<div>
				<h2>
					Upcoming Passes
				</h2>
				{
					this.props.passes.map( function( pass ) {
						tle = _.findWhere( tles, { id: pass.id } );
						note = _.findWhere( notes, { id: pass.id } );
						key = '' + pass.id + '-' + pass.startTime;

						if ( pass.startTime < nowTime ) {
							return null;
						}

						numberRendered++;

						if ( numberRendered > 1 ) {
							note = false;
						} else {
							note = note.text;
						}

						return (
							<DgxSatellite
								key= { key }
								pass={ pass }
								satellite={ tle }
								note={ note }/>
						);
					} )
				}
			</div>
		);
	}

} );