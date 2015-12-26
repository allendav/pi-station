var React = require( 'react' );
var ReactBootstrap = require( 'react-bootstrap' );
var passesStore = require( '../stores/passes.js' )();

module.exports = React.createClass( {

	getInitialState: function() {
		var satellites = [];
		passesStore.tles.forEach( function( tle ) {
			satellites[ tle.id ] = {
				name: tle.satName,
				favorite: ( passesStore.favoriteIDs.indexOf( tle.id ) > -1 )
			};
		}.bind( this ) );

		return {
			satellites: satellites,
			showModal: false
		};
	},

	closeModal: function() {
		this.setState( { showModal: false } );
	},

	saveAndClose: function() {
		var favorites = [];
		this.state.satellites.map( function( satellite, id ) {
			if ( satellite.favorite ) {
				favorites.push( id );
			}
		}.bind( this ) );
		passesStore.setFavorites( favorites );

		this.setState( { showModal: false } );
	},

	openModal: function() {
		this.setState( { showModal: true } ) ;
	},

	handleChange: function( id, e ) {
		var state = this.state;
		state.satellites[ id ].favorite = e.target.checked;
		this.setState( state );
	},

	renderSatelliteList: function() {
		var RBInput = ReactBootstrap.Input;

		return(
			<form>
				{
					this.state.satellites.map( function( satellite, id ) {
						return (
							<RBInput type="checkbox" key={ id } label={ satellite.name } onChange={ this.handleChange.bind( this, id ) } checked={ satellite.favorite } />
						);
					}.bind( this ) )
				}
			</form>
		);
	},

	render: function() {
		var RBButton = ReactBootstrap.Button;
		var RBButtonGroup = ReactBootstrap.ButtonGroup;
		var RBModal = ReactBootstrap.Modal;

		return (
			<div>
				<RBButtonGroup>
					<RBButton onClick={ this.openModal }>
						<span className="glyphicon glyphicon-cog" aria-hidden="true"></span> Settings
					</RBButton>
				</RBButtonGroup>

				<RBModal show={ this.state.showModal } onHide={ this.closeModal }>
					<RBModal.Header closeButton>
						<RBModal.Title>Favorites</RBModal.Title>
					</RBModal.Header>
					<RBModal.Body>
						{ this.renderSatelliteList() }
					</RBModal.Body>
					<RBModal.Footer>
						<RBButton onClick={ this.closeModal }>Cancel</RBButton>
						<RBButton bsStyle="primary" onClick={ this.saveAndClose }>Apply</RBButton>
					</RBModal.Footer>
				</RBModal>
			</div>
		);
	}

} );