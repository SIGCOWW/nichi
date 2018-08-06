'use strict';
const debug = require('debug')('nichi');
const yaml = require('js-yaml');
const fs = require('fs');
const moment = require("moment");
const csv = require('csv');
const parse  = require('csv-parse/lib/sync');
const { IncomingWebhook } = require('@slack/client');

let JSONDATA = {};
let CONFIG = {};
let NOTIFY_COUNTER = 0;

module.exports.config = () => { return CONFIG; };
module.exports.load = () => {
	let yml = yaml.safeLoad(fs.readFileSync(`config.yml`, 'utf8')) || {};

	CONFIG = {};
	CONFIG.scanner = yml.scanner || [];
	CONFIG.port = yml.port || 3000;
	CONFIG.squareid = yml.squareid || '';
	CONFIG.root = require('path').resolve('') + '/data';
	CONFIG.display = yml.display || null;
	CONFIG.message = yml.message || '';
	CONFIG.slack = yml.slack || null;
	CONFIG.friend = yml.friend || null;
	return CONFIG;
}

module.exports.search = (isdn) => {
	if (isdn in JSONDATA) return JSONDATA[isdn];

	const path = CONFIG.root + '/meta';
	for (const dir of fs.readdirSync(path)) {
		if (!fs.existsSync(`${path}/${dir}/meta.yml`)) continue;
		let yml = yaml.safeLoad(fs.readFileSync(`${path}/${dir}/meta.yml`, 'utf8'));

		for (let key in yml.books) {
			JSONDATA[key] = {
				'title': yml.title,
				'subtitle': yml.books[key].title || '',
				'price': yml.books[key].price,
				'cover': `files/${dir}/cover.png`,
				'keychar': yml.books[key].keychar || null,
				'isdn': key
			}
		}

		if (isdn in JSONDATA) return JSONDATA[isdn];
	}

	return null;
}

module.exports.onPurchase = (data) => {
	const path = `${CONFIG.root}/${moment().utcOffset("+09:00").format("YYYYMMDD")}.csv`;

	if (++NOTIFY_COUNTER >= 10) {
		NOTIFY_COUNTER = 0;

		let sum = [ 0, 0, 0 ];
		for (let row of (fs.existsSync(path) ? parse(fs.readFileSync(path)) : [])) {
			sum[0] += row[0].startsWith('278');
			sum[1] += row[0].startsWith('279');
			sum[2] += row[0].startsWith('200');
		}

		const message = `${sum.reduce((x, y) => { return x + y; })} 冊売れたよー (物理:${sum[0]} 電子:${sum[1]} 謹呈:${sum[2]})`
		if (CONFIG.slack) {
			const webhook = new IncomingWebhook(CONFIG.slack);
			webhook.send("```\n" + message + "\n```");
		} else {
			debug('Notify: ' + message);
		}
	}

	const output = [ data.isdn, data.title, data.subtitle, moment().utcOffset("+09:00").format("HH:mm:ss") ];
	csv.stringify([output], function(err, result){
		fs.appendFileSync(path, result, 'utf8');
	});
}