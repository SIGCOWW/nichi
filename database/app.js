'use strict';
const debug = require('debug')('nichi');
const mqtt = require('mqtt');
const db = require('./data');
const cart = require('./cart');
const log = require('./log');

const PREPRINT_COUNT = 20;
const PAYMENT_METHODS = ['cancel', 'cash', 'square', 'pixivpay'];

let program = require('commander');
program
	.usage('[options] <mqttserver:port>')
	.option('-f --file <foo.yaml>', 'Item lsit file')
	.parse(process.argv);

if (!db.load(program.file)) {
	program.outputHelp();
	process.exit(1);
}
const client = (program.args.length == 0) ? null : mqtt.connect('mqtt://' + program.args[0]);


const pub = (topic, msg) => {
	if (client) client.publish(topic, msg, {qos:0});
};

const cartsum = (items) => {
	let sum = 0;
	for (const item of items) sum += (item.price * item.quantity);
	return sum;
}

const handler = (topic, message) => {
	const tmp = topic.split('/');
	const category = tmp.shift();
	const subcategory = tmp.join('/');

	switch (category) {
	case 'init':
		if (subcategory === 'dbrequest') {
			pub('init/dbresponse', {'signage':db.signage()});
		}
		break;
	case 'cart':
		if (subcategory === 'checkout') {
			if (0 <= message < PAYMENT_METHODS.length) {
				const items = cart.items();
				if (items.length === 0) break;
				const method = PAYMENT_METHODS[message];
				const tomisata = log.total(method, items);
				pub('notice/payment', {'method':method, 'cart':items, 'total':cartsum(items), 'tomisata':tomisata});
				cart.clear();
			}
			break;
		}

		const item = db.lookupItem(message);
		if (!item) break;
		if (subcategory === 'add') {
			cart.add(item);
			const items = cart.items();
			pub('notice/cart', {'add':item, 'cart':items, 'total':cartsum(items)});
		} else if (subcategory === 'del') {
			cart.del(item);
			const items = cart.items();
			pub('notice/cart', {'cart':items, 'total':cartsum(items)});
		}
		break;
	case 'receipt':
		if (subcategory === 'preprint') {
			const item = db.lookupItem(message);
			const receipt = db.receiptHdr();
			if (!item || !receipt) break;

			for (let i=0; i<PREPRINT_COUNT; i++) {
				pub('notice/print', {'receipt':receipt, 'item':item});
			}
		}
		break;
	}
}


if (client) {
	client.subscribe('init/dbrequest');
	client.subscribe('cart/+');
	client.on('message', handler);
}