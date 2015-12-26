
function PassesStore() {
	if ( ! ( this instanceof PassesStore ) ) {
		return new PassesStore();
	}

	this.socket = false;
	this.tles = [];
	this.lastModified = false;
	this.passes = [];
	this.location = {
		longitude: 0,
		latitude: 0,
		altitude: 0,
		bearing: 180
	};
	this.favoriteIDs = [];
	this.notes = [
		{
			id: 1002,
			text: 'Downlink (tone) at about 237 MHz'
		},
		{
			id: 7530,
			text: 'TLM Beacon: Downlink 145.9775 MHz CW; Uplink: 432.1250 – 432.1750 MHz SSB/CW; Downlink 145.9750 – 145.9250 MHz SSB/CW',
		},
		{
			id: 24278,
			text: 'Downlink 435.8000 – 435.9000 MHz SSB/CW'
		},
		{
			id: 25544,
			text: 'Packet Downlink 145.825 MHz'
		},
		{
			id: 26931,
			text: 'Uplink and Downlink: 145.825 MHz (FM FSK, AX.25, 1k2 and 9k6) (sun only)'
		},
		{
			id: 27607,
			text: 'Uplink: 145.850 MHz (67.0 Hz PL Tone) SO-50 also has a 10 minute timer that must be armed before use. Transmit a 2 second carrier with a PL tone of 74.4 to arm the timer.; Downlink: 436.800 MHz'
		},
		{
			id: 27844,
			text: 'Downlinks on CW Beacon 436.8375, packet 437.470'
		},
		{
			id: 32789,
			text: 'Downlink: 145.870 MHz, 1200 Baud, BPSK, AX.25, 100mW operational in Sun'
		},
		{
			id: 36122,
			text: 'Downlink 435.7900 MHz CW Beacon; 435.6750 MHz FM Voice repeater; 435.7650 – 435.7150 MHz SSB/CW Linear transponder (inverted); 435.6750 MHz 1k2 AFSK FM'
		},
		{
			id: 39444,
			text: '145.935 MHz BPSK Telemetry; Transponder (eclipse only): 435.150 – 435.130 MHz Uplink; – 145.950 – 145.970 MHz Downlink'
		},
		{
			id: 39770,
			text: '437.525 MHz FM 1k2 AFSK AX.25, CW, SSTV Downlink'
		},
		{
			id: 40897,
			text: 'Downlink: 145.980 MHz GFSK modulation at 9600 bps and AX.25 every 10 seconds, 437.365 MHz CW/MSK at 1200 bps and CSP'
		},
		{
			id: 40903,
			text: 'Downlink: Digital Telemetry 145.640, CW Beacon 145.660, Linear Transponder 145.665 ‐ 145.685'
		},
		{
			id: 40911,
			text: 'Downlink: Digital Telemetry 145.705, CW Beacon 145.725, Linear Transponder 145.730 ‐ 145.750'
		},
		{
			id: 40906,
			text: 'Downlink: Digital Telemetry 145.770, CW Beacon 145.790, Linear Transponder 145.795 ‐ 145.815'
		},
		{
			id: 40907,
			text: 'Downlink: Digital Telemetry 145.835, CW Beacon 145.855, Linear Transponder 145.860 ‐ 145.880'
		},
		{
			id: 40909,
			text: 'Downlink: Digital Telemetry 145.890, CW Beacon 145.910, Linear Transponder 145.915 ‐ 145.935'
		},
		{
			id: 40910,
			text: 'Uplink: Linear Transponder 435.330 - 435.350 MHz; Downlink: Digital Telemetry 145.955, CW Beacon 145.975, Linear Transponder 145.980 ‐ 146.000'
		},
		{
			id: 40967,
			text: 'Uplink: 435.180 MHz w/ 67 Hz tone; Downlink: 145.980 MHz'
		}
	];
}

PassesStore.prototype.findPassesOfFavorites = function() {

	if ( 0 == this.tles.length ) {
		return;
	}

	this.passes = [];

	var now = new Date();
	var nowTime = now.getTime() - 30 * 60 * 1000; // start a half hour ago
	var then = new Date();
	var thenTime = then.getTime();

	this.favoriteIDs.forEach( function( favoriteID ) {

		var favoriteTLE = _.findWhere( this.tles, { id: favoriteID } );

		var inPass = false;
		var position;

		var startTime, startAz, maxElTime, maxElAz, endTime, endAz;

		var maxEl = -1.0;
		var passPositions = [];

		// Only do any of this if we have TLEs
		if ( favoriteTLE ) {

			// Find all passes for this satellite for the next 1440 minutes (24 hours)
			for ( var minutes = 0; minutes < 1440; minutes++ ) {

				thenTime = nowTime + minutes * 60000;
				then.setTime( thenTime );

				position = this.findPositionOfSatellite( favoriteID, then );

				if ( null !== position.elevation ) {
					if ( position.elevation >= 0.0 ) {
						passPositions.push( {
							time: thenTime,
							azimuth: position.azimuth,
							elevation: position.elevation
						} );
					}

					if ( ! inPass && position.elevation >= 0.0 ) { // the pass has begun
						inPass = true;
						startTime = thenTime;
						startAz = position.azimuth;
					} else if ( inPass && position.elevation < 0.0 ) { // the pass has ended
						inPass = false;

						// save the record if Elevation got to at least 15 degrees
						if ( maxEl >= 15.0 ) {
							this.passes.push( {
								id : favoriteID,
								startTime: startTime,
								startAz: startAz,
								maxEl: maxEl,
								maxElAz: maxElAz,
								maxElTime: maxElTime,
								endTime: thenTime,
								endAz: position.azimuth,
								positions: passPositions
							} );
						}

						// Reset for next pass
						maxEl = -1.0;
						passPositions = [];
					}



					if ( inPass && position.elevation > maxEl ) {
						maxEl = position.elevation;
						maxElAz = position.azimuth;
						maxElTime = thenTime;
					}
				}
			}
		}
	}.bind( this ) );

	// Now, refine the found passes to second (not minute) resolution
	this.passes.forEach( function ( pass, index ) {
		inPass = false;
		thenTime = pass.startTime - 60 * 1000;
		maxEl = -1.0;

		do {
			then.setTime( thenTime );
			position = this.findPositionOfSatellite( pass.id, then );

			if ( ! inPass && position.elevation >= 0.0 ) {
				inPass = true;
				startTime = thenTime;
				startAz = position.azimuth;
			} else if ( inPass && position.elevation < 0.0 ) {
				inPass = false;
				endTime = thenTime;
				endAz = position.azimuth;
			}

			if ( inPass && position.elevation > maxEl ) {
				maxEl = position.elevation;
				maxElAz = position.azimuth;
				maxElTime = thenTime;
			}

			thenTime += 1000; // increment by one second
		} while ( thenTime < pass.endTime + 60 * 1000 );

		// update the record with the precision times
		pass.startTime = startTime;
		pass.startAz = startAz;
		pass.maxEl = maxEl;
		pass.maxElAz = maxElAz;
		pass.maxElTime = maxElTime;
		pass.endTime = endTime;
		pass.endAz = endAz;
		this.passes[ index ] = pass;
	}.bind( this ) );

	// Lastly, sort the passes in chronological order
	this.passes = this.passes.sort( function( a, b ) {
		if ( a.startTime < b.startTime ) {
			return -1;
		}
		if ( a.startTime > b.startTime ) {
			return 1;
		}
		return 0;
	} );

};


PassesStore.prototype.findPositionOfSatellite = function( satelliteID, dateTime ) {

	var azimuth = null;
	var elevation = null;
	var satelliteTLE = _.findWhere( this.tles, { id: satelliteID } );

	if ( satelliteTLE ) {
		var satrec = satellite.twoline2satrec( satelliteTLE.tleLine1, satelliteTLE.tleLine2 );

		var positionAndVelocity = satellite.propagate(
			satrec,
			dateTime.getUTCFullYear(),
			dateTime.getUTCMonth() + 1, // Note, this function requires months in range 1-12.
			dateTime.getUTCDate(),
			dateTime.getUTCHours(),
			dateTime.getUTCMinutes(),
			dateTime.getUTCSeconds()
		);

		var positionEci = positionAndVelocity.position;

		var deg2rad = Math.PI / 180.;
		var rad2deg = 1. / deg2rad;

		var observerGd = {
			longitude: this.location.longitude * deg2rad,
			latitude: this.location.latitude * deg2rad,
			height: 0.001 * this.location.altitude // m -> km. above WGS 84 ellipsoid?
		};

		var gmst = satellite.gstimeFromDate(
			dateTime.getUTCFullYear(),
			dateTime.getUTCMonth() + 1, // Note, this function requires months in range 1-12.
			dateTime.getUTCDate(),
			dateTime.getUTCHours(),
			dateTime.getUTCMinutes(),
			dateTime.getUTCSeconds()
		);

		var positionEcf = satellite.eciToEcf( positionEci, gmst ),
			lookAngles  = satellite.ecfToLookAngles( observerGd, positionEcf );

		azimuth   = Math.floor( 10.0 * lookAngles.azimuth * rad2deg ) / 10.0;
		elevation = Math.floor( 10.0 * lookAngles.elevation * rad2deg ) / 10.0;
		rangeSat  = Math.floor( lookAngles.rangeSat );
	}

	return { azimuth: azimuth, elevation: elevation, rangeSat: rangeSat };
};

PassesStore.prototype.loadFavorites = function() {
	// Default, just the space station and FOX-1A
	this.favoriteIDs = [ 25544, 40967 ];

	if ( "undefined" !== typeof localStorage ) {
		var localStorageFavorites = localStorage.getItem( "favorites" );
		if ( null !== localStorageFavorites ) {
			localStorageFavorites = localStorageFavorites.split( "," );
			this.favoriteIDs = [];
			localStorageFavorites.map( function( favorite ) {
				this.favoriteIDs.push( parseInt( favorite, 10 ) );
			}.bind( this ) );
			console.log( "loaded favorites from localStorage:", this.favoriteIDs );
		}
	}
};

PassesStore.prototype.setFavorites = function( favorites ) {
	this.favoriteIDs = favorites;

	if ( "undefined" !== typeof localStorage ) {
		// the browser will store arrays as a comma delimeted string
		localStorage.setItem( "favorites", favorites );
	}
};

PassesStore.prototype.getFavorites = function() {
	return this.favoriteIDs;
}

// TODO - add event emitter (e.g. when favorites changes)

PassesStore.prototype.init = function() {

	// Load favorites
	this.loadFavorites();

	// Connect our socket
	this.socket = io.connect();

	this.socket.on( 'location', ( function( data ) {
		this.location = data;
		this.findPassesOfFavorites();
	} ).bind( this ) );

	// listener, whenever the server emits 'tle-data', this updates the chat body
	this.socket.on( 'tle-data', ( function( data ) {
		this.tles = data.tle;
		this.lastModified = new Date( data.lastModified );
		this.findPassesOfFavorites();
	} ).bind( this ) );

};

module.exports = PassesStore;
