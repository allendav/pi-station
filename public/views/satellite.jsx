var DgxSatellite = React.createClass( {

	propTypes: {
		satellite: React.PropTypes.object.isRequired,
		pass: React.PropTypes.object.isRequired
	},

	renderSubtitle: function() {
		var now = new Date();
		var nowTime = now.getTime();

		var startTime = new Date();
		var endTime = new Date();

		startTime.setTime( this.props.pass.startTime );
		endTime.setTime( this.props.pass.endTime );

		if ( nowTime < this.props.pass.startTime || nowTime > this.props.pass.endTime ) {

			var starTimeFromNow;
			starTimeFromNow = moment( startTime ).fromNow();

			return (
				<span className="satellite-subtitle">
					Begins { starTimeFromNow } (max El: { this.props.pass.maxEl }&deg;)
				</span>
			);
		}

		var position = findPositionOfSatellite( this.props.pass.id, now );

		return (
			<span className="satellite-subtitle in-view">
				Az: { position.azimuth }&deg;, El: { position.elevation }&deg; (max El: { this.props.pass.maxEl }&deg;)
			</span>
		);
	},

	possiblyRenderNote: function() {
		if ( ! this.props.note ) {
			return;
		}

		return(
			<p className="note">
				{ this.props.note }
			</p>
		);
	},

	possiblyRenderPasses: function() {
		return null;
	},

	render: function() {
		var href = 'http://www.n2yo.com/?s=' + this.props.pass.id;

		return (
			<div className="satellite">
				<div>
					<a href={ href } target='_blank'>
						{ this.props.satellite.satName }
					</a>
					{ this.renderSubtitle() }
				</div>
				{ this.possiblyRenderNote() }
				{ this.possiblyRenderPasses() }
			</div>
		);
	}

} );