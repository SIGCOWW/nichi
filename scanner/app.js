'use strict';
const debug = require('debug')('nichi');
const mqtt = require('mqtt');

let program = require('commander');
program
	.usage('[options] <mqttserver:port>')
	.option('--usb <vid:pid>', 'VID and PID for device')
	.option('--stdin', 'enable stdin mode')
	.parse(process.argv);


const client = (program.args.length == 0) ? null : mqtt.connect('mqtt://' + program.args[0]);
const onScan = (code) => {
	const pub = (topic, msg) => {
		if (client) client.publish(topic, msg, {qos:0});
	};

	debug(`onScan: ${code}`);
	if (/^27[2-9]\d{10}$/.test(code)) {
		pub('cart/add', code);
	} else if (/^26[2-9]\d{10}$/.test(code).substr(2, 10)) {
		pub('cart/del', code);
	} else if (/^28[2-9]\d{10}$/.test(code).substr(2, 10)) {
		pub('receipt/preprint', code.substr(2, 10));
	} else if (/^220\d{10}$/.test(code)) {
		pub('cart/checkout', parseInt(code.substr(3, 9), 10));
	} else {
		debug(`unknown code: ${code}`);
	}
};

if (program.usb) {
	let tmp = program.usb.split(':');
	if (tmp.length == 2) {
		require('./usb').read(tmp[0], tmp[1], onScan);
	} else {
		program.outputHelp();
		process.exit(1);
	}
} else {
	require('./stdin').read(onScan);
}