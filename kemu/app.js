// based on https://github.com/yaptb/BlogCode/blob/master/btkeyboard/keyboard/
'use strict';
const debug = require('debug')('nichi');
const mqtt = require('mqtt');
const btkey = require('./btkey');

let program = require('commander');
program
	.usage('[options] <mqttserver:port>')
	.parse(process.argv);

const btSuccess = () => { pub('notice/unhappy', {'kemu':false}); }
const btError = () => { pub('notice/unhappy', {'kemu':true}); }
btkey.connect(btSuccess, btError);

const client = (program.args.length == 0) ? null : mqtt.connect('mqtt://' + program.args[0]);
const pub = (topic, msg) => {
	debug(`${topic}: ${JSON.stringify(msg)}`);
	if (client) client.publish(topic, JSON.stringify(msg), {qos:0});
};

const handler = (topic, message) => {
	message = JSON.parse(message);
	if (topic === 'keyboard/press') {
		debug(`Receive: ${message}`);
		btkey.sendStr(message);
	}
}


if (client) {
	client.subscribe('keyboard/press');
	client.on('message', handler);
	client.on('connect', () => {
		pub('notice/unhappy', {'kemu':true});
	});
}
