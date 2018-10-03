'use strict';
const debug = require('debug')('nichi');
const mqtt = require('mqtt');
const { IncomingWebhook } = require('@slack/client');

let program = require('commander');
program
	.usage('[options] <mqttserver:port>')
	.option('--slack <token>', 'Token for Slack IncomingHook')
	.parse(process.argv);

const NOTIFY_TIMING = 10;
let COUNTER = 0;

const client = (program.args.length == 0) ? null : mqtt.connect('mqtt://' + program.args[0]);
const handler = (topic, message) => {
	if (topic !== 'notice/payment') return;
	if ((COUNTER++ % NOTIFY_TIMING) != 0) return;
	message = JSON.parse(message);
	if (message.method === 'cancel') return;

	let sum = 0;
	for (const key of Object.keys(message.tomisata)) sum += message.tomisata[key];

	let msg = `${sum} 部売れたよー\n`
	msg += `  通常: ${message.tomisata['normal']}\n`
	msg += `電子版: ${message.tomisata['ebook']}\n`
	msg += `  謹呈: ${message.tomisata['special']}\n`
	msg += `ISDN外: ${message.tomisata['other']}\n`

	if (program.slack) {
		const webhook = new IncomingWebhook(program.slack);
		webhook.send("```\n" + msg + "```");
	} else {
		debug('Notify: ' + msg);
	}
}

if (client) {
	client.subscribe('notice/payment');
	client.on('message', handler);
}