'use strict';
const debug = require('debug')('nichi');
const btkey = require('./btkey');

let program = require('commander');
program
	.usage('[options] <mqttserver:port>')
	.parse(process.argv);

const btSuccess = () => { pub('notify/unhappy', {'kemu':false}); }
const btError = () => { pub('notify/unhappy', {'kemu':true}); }
const btkey.connect(btSuccess, btError);

const client = (program.args.length == 0) ? null : mqtt.connect('mqtt://' + program.args[0]);
const pub = (topic, msg) => {
	if (client) client.publish(topic, JSON.stringify(msg), {qos:0});
};

const handler = (topic, message) => {
	message = JSON.parse(message);
	if (topic === 'keyboard/press') {
		btkey.sendStr(message);
	}
}


if (client) {
	client.subscribe('keyboard/press');
	client.on('message', handler);
}