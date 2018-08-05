'use strict';
const debug = require('debug')('nichi');
const hid = require('node-hid');
const readline = require('readline');

module.exports.hid = (vid, pid, callback) => {
	debug(`Read HID: ${vid}:${pid}`);

	let scanner = new hid.HID(vid, pid);
	let buffer = '';
	scanner.on("data", function(data) {
		let hex = data[2];
		switch(hex) {
		case 0x1e:
		case 0x1f:
		case 0x20:
		case 0x21:
		case 0x22:
		case 0x23:
		case 0x24:
		case 0x25:
		case 0x26:
		case 0x27:
			buffer += String((hex - 0x1d) % 10);
			break;
		case 0x28:
			callback(buffer);
			buffer = '';
			break;
		}
	});
}

module.exports.stdin = (callback) => {
	debug('Read stdin');

	let rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	rl.on('line', (line) => { callback(line); });
}
