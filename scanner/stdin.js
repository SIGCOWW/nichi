'use strict';
const debug = require('debug')('nichi');
const readline = require('readline');

module.exports.read = (callback) => {
	debug('Read stdin');

	let rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	rl.on('line', (line) => { callback(line); });
}