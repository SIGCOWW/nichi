'use strict';
const debug = require('debug')('nichi');
const express = require("express");
const http = require('http');
const mosca = require('mosca');
const yaml = require('js-yaml');
const fs = require('fs');

let program = require('commander');
program
	.usage('[options]')
	.option('--http <port>', 'HTTP Port')
	.option('--mqtt <port>', 'MQTT Port')
	.parse(process.argv);

const httpport = program.http || 3000;
const mqttport = program.mqtt || 1883;

const app = express();
const httpServer = http.createServer(app);
const mqttServer = new mosca.Server({port: mqttport});

app.use(express.static(require('path').resolve(__dirname) + '/static'));
mqttServer.on('ready', () => debug(`MQTT server is running on ${mqttport}`));
mqttServer.on('clientConnected', client => debug(`MQTT connected: ${client.id}`));
mqttServer.on('clientDisconnected', client => debug(`MQTT disconnected: ${client.id}`));
mqttServer.on('subscribed', (topic, client) => debug(`MQTT subscribed: ${client.id} on ${topic}`));
mqttServer.on('unsubscribed', (topic, client) => debug(`MQTT unsubscribed: ${client.id} on ${topic}`));
mqttServer.on('published', (packet, client) => {
	if (client) debug(`MQTT published: ${client.id}`)
});

mqttServer.attachHttpServer(httpServer);
httpServer.listen(httpport);
debug(`Webserver runnning on ${httpport}`);