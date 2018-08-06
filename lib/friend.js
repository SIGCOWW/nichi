'use strict';
const debug = require('debug')('nichi');
const SPI = require('pi-spi');
let spi = null;

module.exports.initialize = (port) => {
	if (port) spi = SPI.initialize(port);
};

module.exports.raw = (cmd) => {
	let pkts = [];
	cmd.split(/(.{16})/).filter(x=>x).forEach(function(c, i, arr) {
		const len = c.length;
		if ((arr.length - 1) != i) len |= 0x80;
		pkts.push(Buffer.concat([Buffer.from([0x10, 0x00, 0x0A, len]), Buffer.from(c)]));
	});

	if (!spi) {
		debug(pkts);
	} else {
		const receive = () => {
			spi.read(4, function(e, d) {
				const type = d[0]
				const id = d[2] << 8 | d[1];
				const len = d[3] & 0x7f;
				const more = d[3] & 0x80;

				if (type == 0xff || type == 0xfe) return;
				spi.read(len, function(e, d) {
					if (more) receive();
				});
			});
		}

		const send = (idx) => {
			if (!idx) idx = 0;
			spi.write(pkts[idx], function(e, d) {
				if ((pkts.length - 1) == idx) {
					receive();
				} else {
					send(idx + 1);
				}
			});
		}
		send();
	}
}

module.exports.presskey = (str) => {
	debug(str);
	debug(str.split(''));

	let offset = 100;
	for (let ch of str.split('')) {
		let lower = ch.toLowerCase();
		setTimeout(() => {
			module.exports.raw('AT+BLEKEYBOARD=' + lower);
		}, offset);

		debug(`Press:${ch}, Send:${lower}, Time:${offset}`);
		offset += (ch !== lower) ? 1500 : 100;
	}
}
