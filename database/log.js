'use strict';
const moment = require('moment');

let TOMI = {
	'normal': 0,
	'ebook': 0,
	'special': 0,
	'other': 0
};

module.exports.total = (method, items) => {
	const filepath = `${require('path').resolve(__dirname)}/data/${moment().utcOffset("+09:00").format("YYYYMMDD")}.csv`;
	for (const item of items) {
		const content = `${items.code},${items.quantity},${method},${items.title},${items.type},${moment().utcOffset("+09:00").format("HH:mm:ss")}`;
		fs.appendFileSync(filepath, `${content}\n`);
	}

	for (const item of items) TOMI[items.type] += item.quantity;
	return TOMI;
};