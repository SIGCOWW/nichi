'use strict';
const debug = require('debug')('nichi');
const dbus = require('dbus');
const exec = require('child_process').exec;
const keymap = require('./keymap');

let INTERFACE = null;
let SUCCESS_HANDLER = null;
let ERR_HANDLER = null;
let INTERVAL_TIMER = null;

process.env.DISPLAY = ':0';
process.env.DBUS_SESSION_BUS_ADDRESS = 'unix:path=/var/run/dbus/system_bus_socket';

module.exports.connect = (successHandler, errHandler) => {
	INTERFACE = null;
	SUCCESS_HANDLER = successHandler;
	ERR_HANDLER = errHandler;
	if (INTERVAL_TIMER !== null) {
		clearInterval(INTERVAL_TIMER);
		INTERVAL_TIMER = null;
	}

	const bus = dbus.getBus('system');
	bus.getInterface('org.yaptb.btkbservice', '/org/yaptb/btkbservice', 'org.yaptb.btkbservice', (err, iface) => {
		if (err && ERR_HANDLER) {
			debug(err);
			ERR_HANDLER();
			return;
		}

		INTERFACE = iface;
		SUCCESS_HANDLER();
		INTERVAL_TIMER = setInterval(() => {
			recover();
		}, 30 * 1000);
	});
};


const pressKey = (code, callback) => {
	if (!INTERFACE) return;
	const state = [0xa1, 0x01, [0, 0, 0, 0, 0, 0, 0, 0], 0x00, code, 0x00, 0x00, 0x00, 0x00, 0x00];

	INTERFACE.send_keys(parseInt(state[2].join(''), 2), state.slice(4), {timeout: 100}, (err, result) => {
		if (err && ERR_HANDLER) {
			ERR_HANDLER();
			if (callback) callback();
			return;
		}

		if (code === 0) {
			SUCCESS_HANDLER();
		} else {
			setTimeout(() => {
				pressKey(0);
			}, 10);
		}
	});
};

const recover = () => {
	pressKey(keymap.toCode('z'), () => {
		debug('Reconnect');
		//exec('sudo systemctl start btkey-server', (err, stdout, stderr) => {
		//	module.exports.connect(SUCCESS_HANDLER, ERR_HANDLER);
		//});
	});
};

module.exports.sendStr = (str) => {
	let offset = 100;
	for (const c of str.split('')) {
		const code = keymap.toCode(c);
		if (!code) continue;

		setTimeout(() => {
			pressKey(code);
			debug(`Press:${c}, Send:${code}, Time:${offset}`);
		}, offset);

		offset += (65 <= c <= 90) ? 1500 : 100;
	}
}
