'use strict';
const debug = require('debug')('nichi');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
let DATA = null;


const toDataURI = (rootpath, filename, contenttype) => {
	const base64 = new Buffer(fs.readFileSync(`${rootpath}/${filename}`)).toString('base64');
	return `data:${contenttype};base64,${base64}`;
};

module.exports.load = (filename) => {
	if (!filename || !fs.existsSync(filename)) {
		DATA = null;
		return false;
	}

	let yml = yaml.safeLoad(fs.readFileSync(filename, 'utf8'));
	const rootpath = path.dirname(path.resolve(filename));

	if (yml.receipt.logo) {
		yml.receipt.logo = !fs.existsSync(`${rootpath}/${yml.receipt.logo}`) ? null :
			toDataURI(rootpath, yml.receipt.logo, 'image/png');
	}

	if (yml.receipt.sellers) {
		yml.receipt.sellers = !fs.existsSync(`${rootpath}/${yml.receipt.sellers}`) ? null :
			fs.readFileSync(`${rootpath}/${yml.receipt.sellers}`, 'utf8').split(/\r\n|\r|\n/).map(x => x.trim()).filter(x => x);
	}

	for (const key of Object.keys(yml.items)) {
		if (yml.items[key].cover) {
			yml.items[key].cover = !fs.existsSync(`${rootpath}/${yml.items[key].cover}`) ? null :
				toDataURI(rootpath, yml.items[key].cover, 'image/png');
		}
		
		if (yml.items[key].content) {
			yml.items[key].content = !fs.existsSync(`${rootpath}/${yml.items[key].content}`) ? null :
				toDataURI(rootpath, yml.items[key].content, 'application/pdf');
		}
	}

	DATA = yml;
	return true;
};

module.exports.lookupItem = (code) => {
	if (!DATA) return null;

	const key = type = null, head = parseInt(code.substr(0, 1), 10);
	switch (head) {
	case 8:
	case 9:
		key = code;
		type = 'normal';
		break;
	case 6:
	case 7:
		key = (head+2) + code.substr(1, 9);
		type = 'ebook';
		break;
	case 4:
	case 5:
		key = (head+4) + code.substr(1, 9);
		type = 'special';
		break;
	case 2:
	case 3:
		key = (head+6) + code.substr(1, 9);
		type = 'other';
		break;
	}

	if (!DATA.items[key]) return null;
	return {
		'title': DATA.items[key].title,
		'price': DATA.items[key].prices[type] || null,
		'type': type,
		'code': code,
		'quantity': 1,
		'dlcode': DATA.items[key].codes[type] || null
	};
};

module.exports.receiptHdr = () => {
	if (!DATA) return null;
	return {
		'logo': DATA.receipt.logo,
		'event': DATA.receipt.event,
		'message': DATA.receipt.messages ? DATA.receipt.messages[Math.floor(Math.random()*DATA.receipt.messages.length)] : null,
		'date': DATA.receipt.date,
		'seller': DATA.receipt.sellers ? DATA.receipt.sellers[Math.floor(Math.random()*DATA.receipt.sellers.length)] : null
	};
};