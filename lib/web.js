'use strict';
const debug = require('debug')('nichi');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const fs = require('fs');
const friend = require('./friend');
let CONFIG;


const signages = () => {
	const path = CONFIG.root + '/meta';
	for (const dir of fs.readdirSync(path)) {
		if (fs.existsSync(`${path}/${dir}/sample.pdf`)) return `/files/${dir}/sample.pdf`;
	}
};

module.exports.start = (config) => {
	CONFIG = config;
	friend.initialize(CONFIG.friend);

	app.use(express.static(CONFIG.root + '/static'));
	app.get('/files/:dir/:name*.:ext(pdf|png)', (req, res) => {
		res.sendFile(`${CONFIG.root}/meta/${req.params.dir}/${req.params.name}.${req.params.ext}`);
	});

	server.listen(CONFIG.port);
	debug(`Webserver runnning on ${CONFIG.port}`);

	io.on('connection', (socket) => {
		socket.emit('initialize', {'signage':signages(), 'square':CONFIG.squareid});

		socket.on('press', (key) => {
			friend.presskey(key);
		});
	});
}

module.exports.onPurchase = (data) => {
	io.emit('purchase', data);
}