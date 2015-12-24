# pi-station
A node.js powered "Earth Station in a Box", designed for Raspberry Pi

# First, install globals (only needs to be done once)
    npm install -g browserify watchify
    npm install -g babelify babel-preset-react

# Install/update dependencies
    npm install -d

# Build the client javascript
    browserify -t [ babelify --presets [ react ] ] client/main.js -o public/bundle.js

# Run
    node app.js
    http://localhost:8080/

# Caveats
 * Expects <a href="https://github.com/allendav/GPSClock">GPSClock</a> on /dev/cu.usbmodem14211
