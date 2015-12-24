var React = require( 'react' );

module.exports = React.createClass( {

	propTypes: {
		passes: React.PropTypes.array.isRequired
	},

	getHM: function( time ) {
		var dateTime = new Date();
		dateTime.setTime( time );
		var m = moment( dateTime );
		return m.format( 'h:mm a' );
	},

	getMDHM: function( time ) {
		var dateTime = new Date();
		dateTime.setTime( time );
		var m = moment( dateTime );
		return m.format( 'M/D h:mm a' );
	},

	render: function() {
		var odd = true;

		return (
			<table className="passes">
				<tbody>
					<tr>
						<th colSpan="2">Start</th>
						<th colSpan="3">Max El</th>
						<th colSpan="2">End</th>
					</tr>
					<tr>
						<th>Time</th>
						<th>Az</th>
						<th>Time</th>
						<th>Az</th>
						<th>El</th>
						<th>Time</th>
						<th>Az</th>
					</tr>
					{
						this.props.passes.map( function( pass ) {
							var startTimeString = this.getMDHM( pass.startTime );
							var maxElTimeString = this.getHM( pass.maxElTime );
							var endTimeString = this.getHM( pass.endTime );

							var uniqueKey = 's' + pass.id + '_' + pass.startTime;

							var classes = classNames( {
								'pass-row' : true,
								'odd': odd,
								'even': ! odd,
								'good': ( pass.maxEl >= 30 )
							} );

							classes += ' ' + uniqueKey;

							odd = ! odd;

							return(
								<tr className={ classes } key={ uniqueKey }>
									<td>{ startTimeString }</td>
									<td>{ pass.startAz }&deg;</td>
									<td>{ maxElTimeString }</td>
									<td>{ pass.maxElAz }&deg;</td>
									<td>{ pass.maxEl }&deg;</td>
									<td>{ endTimeString }</td>
									<td>{ pass.endAz }&deg;</td>
								</tr>
							);
						}.bind( this ) )
					}
				</tbody>
			</table>
		);
	}

} );