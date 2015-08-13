var DgxPass = React.createClass( {

	propTypes: {
		pass: React.PropTypes.object.isRequired
	},

	render: function() {
		return (
			<table className="pass">
				<tbody>
					<tr>
						<th>Start</th>
					</tr>
					<tr>
						<th>Max</th>
					</tr>
					<tr>
						<th>End</th>
					</tr>
				</tbody>
			</table>
		);
	}

} );