# pi-station
A node.js powered "Earth Station in a Box", designed for Raspberry Pi

# First, install globals (only needs to be done once)
    npm install -g browserify
    npm install -g babelify babel-preset-react

# Clone this repository, e.g.
    mkdir ~/repos
    cd repos
    git clone git@github.com:allendav/pi-station.git
    cd pi-station
    mkdir cache

# Install/update dependencies
    npm install -d

# Build the client javascript
    npm install -g browserify
    browserify -t [ babelify --presets [ react ] ] client/main.js -o public/bundle.js

# Prowl support
To receive notifications using Prowl ( http://www.prowlapp.com/ ), create a `config/production.json` file with a `prowl-key` entry, e.g.

    {
        "prowl-key": "YOURKEYHERE"
    }

# Run it
    NODE_ENV=production node app.js
    http://localhost:8080/

# To have raspbian automatically start it on reboot, add something like this to /etc/rc.local
    # Start the satellite tracking app
    cd /home/pi/repos/pi-station
    su pi -c 'NODE_ENV=production /opt/node/bin/node /home/pi/repos/pi-station/app.js &'

# To have production automatically set whenever you manually run node, do this command:
    echo export NODE_ENV=production >> ~/.bash_profile
