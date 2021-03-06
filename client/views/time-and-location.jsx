var React = require( 'react' );
var passesStore = require( '../stores/passes.js' )();

module.exports = React.createClass( {

	getDMS: function( angle ) {
		var west = false;
		var degrees = 0;
		var minutes = 0;
		var seconds = 0;

		west = ( angle < 0 );
		angle = Math.abs( angle );
		degrees = Math.floor( angle );
		angle = 60.0 * ( angle - degrees );
		minutes = Math.floor( angle );
		angle = 60.0 * ( angle - minutes );
		seconds = Math.floor( angle );

		if ( west ) {
			degrees = -degrees;
		}

		return "" + degrees + "\xB0 " + minutes + "' " + seconds + '"';
	},

	render: function() {
		var now = new Date();
		var nowTime = now.getTime();
		var nowMoment = moment( nowTime );
		var utcMoment = moment( nowTime ).utc();

		var latDMS = this.getDMS( passesStore.location.latitude );
		var longDMS = this.getDMS( passesStore.location.longitude );

		return (
			<div className="section">
				<div className='inner-status'>
					<table className="time-and-location">
						<tbody>
							<tr>
								<th>Lat</th>
								<th>Long</th>
								<th>Alt</th>
								<th>Local Time</th>
								<th>UTC</th>
							</tr>
							<tr>
								<td>
									{ passesStore.location.latitude }&deg;
								</td>
								<td>
									{ passesStore.location.longitude }&deg;
								</td>
								<td>{ passesStore.location.altitude } m</td>
								<td>
									{ nowMoment.format( 'ddd, MMM Do YYYY' ) }
								</td>
								<td>
									{ utcMoment.format( 'ddd, MMM Do YYYY' ) }
								</td>
							</tr>
							<tr>
								<td>
									{ latDMS }
								</td>
								<td>
									{ longDMS }
								</td>
								<td>&nbsp;</td>
								<td>
									{ nowMoment.format( 'h:mm:ss a') }
								</td>
								<td>
									{ utcMoment.format( 'HH:mm:ss') }
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		);
	}

} );