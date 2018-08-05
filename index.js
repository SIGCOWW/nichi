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








setTimeout(function() {
	onScan('2794403994056');
}, 5000);

/*
setTimeout(function() {
	onScan('2794403994056');
}, 1000);

setTimeout(function() {
	onScan('2004403994056');
}, 2000);

setTimeout(function() {
	onScan('2554403994057');
}, 3000);

setTimeout(function() {
	onScan('2794403994056');
}, 4000);

setTimeout(function() {
	onScan('2794403994056');
}, 5000);

setTimeout(function() {
	onScan('2794403994056');
}, 6000);

setTimeout(function() {
	onScan('2794403994056');
}, 7000);

setTimeout(function() {
	onScan('2784403994057');
}, 8000);

setTimeout(function() {
	onScan('2784403994057');
}, 9000);

setTimeout(function() {
	onScan('2794403994056');
}, 10000);

setTimeout(function() {
	onScan('2794403994056');
}, 11000);
*/