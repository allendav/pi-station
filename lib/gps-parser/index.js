/**
 * Parse NMEA strings
 */

var GPSParser = {

	state : {
		satellites: [],
		utcDatetime: false,
		latitude: false,
		longitude: false
	},

	getState: function() {
		return this.state;
	},

	normalizeNumber: function( string ) {
		// Bad string?  Return null
		if ( 'undefined' === typeof string ) {
			return null;
		}

		// Empty string?  Return null
		if ( 0 === string.length ) {
			return null;
		}

		// parseInt automagically handles leading zeros just fine
		return parseInt( string, 10 );
	},

	normalizeLatLong: function( string, isNorthOrEast ) {
		if ( 'undefined' === typeof string ) {
			return null;
		}

		// Empty string?  Return null
		if ( 0 === string.length ) {
			return null;
		}

		var num = parseFloat( string );
		if ( isNaN( num ) ) {
			return null;
		}

		var degrees = Math.floor( num / 100.0 );
		var minutes = 100.0 * ( num / 100.0 - degrees );
		var sign = isNorthOrEast ? 1.0 : -1.0;

		var value = sign * ( degrees + minutes / 60.0 );

		// Only 8 sig figs please
		return ( Math.floor( value * 1.0E8 ) / 1.0E8 );
	},

	normalizeDatetime: function( utcDate, utcTime ) {
		// Date is in format DDMMYY
		// Time is in format HHMMSS.mmm

		// Bad string?  Return null
		if ( 'undefined' === typeof utcDate || 'undefined' === typeof utcTime ) {
			return null;
		}

		// Empty string?  Return null
		if ( 0 === utcDate.length || 0 === utcTime.length ) {
			return null;
		}

		var time = parseFloat( utcTime );
				if ( isNaN( time ) ) {
			return null;
		}

		var hour = Math.floor( time / 10000 );
		var remainder = Math.floor( time - hour * 10000 );
		var minutes = Math.floor( remainder / 100 );
		remainder = Math.floor( remainder - minutes * 100 );
		var seconds = Math.floor( remainder );

		var month = parseInt( utcDate.substr( 2, 2 ), 10 ) - 1; // 0 = January
		var day = parseInt( utcDate.substr( 0, 2 ), 10 );
		var year = 2000 + parseInt( utcDate.substr( 4, 2 ), 10 );

		return new Date( Date.UTC( year, month, day, hour, minutes, seconds ) );
	},

	parseGSV: function( parts ) {
		var numMessages = parts[1],
			messageNumber = parts[2];

			if ( 1 == messageNumber) {
				this.state.satellites = [];
			}

			for ( var i=0; i < 4; i++) {
				var prn       = parts[4 + i * 4];
				var elevation = this.normalizeNumber( parts[ 4 + i * 4 + 1] );
				var azimuth   = this.normalizeNumber( parts[ 4 + i * 4 + 2] );
				var snr       = this.normalizeNumber( parts[ 4 + i * 4 + 3] );

				if ( null === snr ) {
					snr = 0;
				}

				if ( prn && prn.length ) {

					this.state.satellites.push(
						{
							prn: prn,
							elevation: elevation,
							azimuth: azimuth,
							snr: snr
						}
					);
				}
			}
	},

	parseRMC: function( parts ) {
		var utcTime = parts[1];
		var utcDate = parts[9];

		if ( utcTime && utcTime.length && utcDate && utcDate.length ) {
			this.state.utcDatetime = this.normalizeDatetime( utcDate, utcTime );
		}

		var lat = parts[3];
		var hemi = parts[4];
		if ( lat && lat.length && hemi && hemi.length ) {
			this.state.latitude = this.normalizeLatLong( lat, 'N' === hemi );
		}

		var long = parts[5];
		hemi = parts[6];
		if ( long && long.length && hemi && hemi.length ) {
			this.state.longitude = this.normalizeLatLong( long, 'E' === hemi );
		}
	},

	parse: function( sentence ) {
		var parts = sentence.split( '*' );
		if ( parts[0] ) {
			var data = parts[0].split( ',' );
			if ( '$GPGSV' === data[0] ) {
				this.parseGSV( data );
			}
			if ( '$GPRMC' === data[0] ) {
				this.parseRMC( data );
				return true;
			}
		}
		return false;
	}
};

module.exports = GPSParser;
