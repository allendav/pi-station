var PassesStore = require( './passes-store.js' ),
	_passes;

module.exports = function() {
	if ( ! _passes ) {
		_passes = new PassesStore();
	}

	return _passes;
};
