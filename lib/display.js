'use strict';
const debug = require('debug')('nichi');
const serialport = require('serialport');
const iconv = require('iconv-lite');

let CONFIG;
let TIMEOUT = null;
let PORT = null;

const initialMessage = Buffer.from([
	0x1b, 0x40,
	0x1b, 0x52, 0x08,
	0x1b, 0x74, 0x01,
	0x1f, 0x28, 0x47, 0x02, 0x00, 0x61, 0x01
]);

const write = (msg) => {
	if (CONFIG.display && PORT) {
		PORT.write(msg);
	} else {
		debug(msg);
	}
}

const displayMessage = () => {
	let buf = [ initialMessage ];
	buf.push(Buffer.from([0x1f, 0x45, 20]));
	buf.push(iconv.encode(CONFIG.message.replace(/\r?\n/g, '\r\n'), 'Shift_JIS'));
	write(Buffer.concat(buf));
}


module.exports.start = (config) => {
	CONFIG = config;

	if (!CONFIG.display) {
		displayMessage();
	} else {
		PORT = new serialport(CONFIG.display, { baudRate: 9600 });
		PORT.on('open', () => {
			displayMessage();
		});
	}
}

module.exports.onPurchase = (data) => {
	clearTimeout(TIMEOUT);

	let buf = [ initialMessage ];
	buf.push(iconv.encode(`${data.title}\r\n${data.subtitle}\r\n\r\n${data.price}円`, 'Shift_JIS'));
	write(Buffer.concat(buf));

	TIMEOUT = setTimeout(displayMessage, 60 * 1000);
}
