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
const onScan = (isdn) => {
	debug(`onScan: ${isdn}`);
	if (client) {
		client.publish('scanner', isdn);
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