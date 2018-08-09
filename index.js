'use strict';
const debug = require('debug')('nichi');
const yaml = require('js-yaml');
const fs = require('fs');

// Logger, Config
const database = require('./lib/database');
let config = database.load();


// Web
const web = require('./lib/web');
web.start(config);


// Display
const display = require('./lib/display');
display.start(config);


// Scanner
const scanner = require('./lib/scanner');
const exec = require('child_process').exec;
const onScan = (isdn) => {
	debug(`onScan: ${isdn}`);
	if (isdn === config.initcode) {
		const handler = (err, stdout, stderr) => {
			if (err) {
				debug(err);
				debug(stdout);
				debug(stderr);
			}
		}

		exec('tvservice --off', handler);
		exec('sudo ifconfig wlan0 down', handler);
		if (config.btaddr) exec('sudo bt-pan --debug client ' + config.btaddr, handler);
	}


	const data = database.search(isdn);
	if (data === null) return;

	web.onPurchase(data);
	display.onPurchase(data);
	database.onPurchase(data);
};

if (config.scanner.length == 0) scanner.stdin(onScan);
for (const ids of config.scanner) {
	scanner.hid(ids[0], ids[1], onScan);
}
