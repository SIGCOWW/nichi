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
const onScan = (isdn) => {
	debug(`onScan: ${isdn}`);
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
