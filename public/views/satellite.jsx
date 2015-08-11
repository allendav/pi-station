var DgxSatellite = React.createClass( {

	propTypes: {
		satellite: React.PropTypes.object.isRequired,
		pass: React.PropTypes.object.isRequired
	},

	possiblyRenderNote: function() {
		if ( ! this.props.note ) {
			return;
		}

		return(
			<span className="note">
				{ this.props.note }
			</span>
		);
	},

	render: function() {
		var href = 'http://www.n2yo.com/?s=' + this.props.pass.id;
		var startTime = new Date();
		var starTimeFromNow;

		startTime.setTime( this.props.pass.startTime );
		starTimeFromNow = moment( startTime ).fromNow();

		return (
			<div>
				<p>
					<a href={ href } target='_blank'>
						{ this.props.satellite.satName }
					</a>
				<br/>
					Begins { starTimeFromNow } (max El: { this.props.pass.maxEl }&deg;)
				<br/>
				{ this.possiblyRenderNote() }
				</p>
			</div>
		);
	}

} );