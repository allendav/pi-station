var React = require( 'react' );
var DgxPasses = require( './passes.jsx' );
var passesStore = require( '../stores/passes.js' )();

module.exports = React.createClass( {

	propTypes: {
		satellite: React.PropTypes.object.isRequired,
		pass: React.PropTypes.object.isRequired,
		passes: React.PropTypes.array.isRequired
	},

	renderSubtitle: function() {
		var now = new Date();
		var nowTime = now.getTime();

		var startTime = new Date();
		var endTime = new Date();

		startTime.setTime( this.props.pass.startTime );
		endTime.setTime( this.props.pass.endTime );

		if ( nowTime < this.props.pass.startTime || nowTime > this.props.pass.endTime ) {

			var startTimeFromNow;
			startTimeFromNow = moment( startTime ).fromNow();

			var classes = classNames( {
				'satellite-subtitle': true,
				'good': ( this.props.pass.maxEl >= 30 )
			} );

			return (
				<span className={ classes }>
					Next pass begins { startTimeFromNow } (max El: { this.props.pass.maxEl }&deg;)
				</span>
			);
		}

		var position = passesStore.findPositionOfSatellite( this.props.pass.id, now );
		var endTimeFromNow = moment( endTime ).fromNow();

		return (
			<span className="satellite-subtitle in-view">
				Az: { position.azimuth }&deg;, El: { position.elevation }&deg;, Range: { position.rangeSat} km, ends { endTimeFromNow }
			</span>
		);
	},

	possiblyRenderNote: function() {
		if ( ! this.props.note ) {
			return ( <br/> );
		}

		return(
			<p className="note">
				{ this.props.note }
			</p>
		);
	},

	possiblyRenderPasses: function() {
		return( <DgxPasses passes={ this.props.passes } /> );
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