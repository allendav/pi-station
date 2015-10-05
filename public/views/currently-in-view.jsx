var DgxCurrentlyInView = React.createClass( {

	propTypes: {
		passes: React.PropTypes.array.isRequired,
		satellites: React.PropTypes.array.isRequired
	},

	render: function() {
		var passesToShow = [];
		var now = new Date();
		var nowTime = now.getTime();
		var tle;
		var key;

		// Iterate over passes finding passes currently visible
		// and return just those passes

		// If there are none, return null

		this.props.passes.forEach( function( pass ) {
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
						tle = _.findWhere( this.props.satellites, { id: pass.id } );
						note = _.findWhere( this.props.notes, { id: pass.id } );
						if ( 'undefined' === typeof note ) {
							note = { text: '' };
						}
						key = '' + pass.id + '-' + pass.startTime;
						passes = this.props.passes.filter( function( p ) {
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
