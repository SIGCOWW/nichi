'use strict';
const debug = require('debug')('nichi');
const express = require("express");
const http = require('http');
const mosca = require('mosca');
const yaml = require('js-yaml');
const fs = require('fs');

const rootpath = require('path').resolve(__dirname);
const configpath = rootpath + '/config.yml';

let config = fs.existsSync(configpath) ? yaml.safeLoad(fs.readFileSync(configpath, 'utf8')) : {};
config.httpport = config.httpport || 3000;
config.mqttport = config.mqttport || 1883;


const app = express();
const httpServer = http.createServer(app);
const mqttServer = new mosca.Server({port: config.mqttport});

app.use(express.static(rootpath));
mqttServer.on('ready', () => debug(`MQTT server is running on ${config.mqttport}`));
mqttServer.on('clientConnected', client => debug(`MQTT connected: ${client.id}`));
mqttServer.on('clientDisconnected', client => debug(`MQTT disconnected: ${client.id}`));
mqttServer.on('subscribed', (topic, client) => debug(`MQTT subscribed: ${client.id} on ${topic}`));
mqttServer.on('unsubscribed', (topic, client) => debug(`MQTT unsubscribed: ${client.id} on ${topic}`));
mqttServer.on('published', (packet, client) => {
	if (client) debug(`MQTT published: ${client.id}`)
});

mqttServer.attachHttpServer(httpServer);
httpServer.listen(config.httpport);
debug(`Webserver runnning on ${config.httpport}`);