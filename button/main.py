# -*- coding: utf-8 -*-
import sys
import atexit
import RPi.GPIO as GPIO
import paho.mqtt.client as mqtt
import json

MQTT_CLIENT = None

CASH_PIN = 17
SQUARE_PIN = 19
PXVPAY_PIN = 21
INPUT_PINS = [ CASH_PIN, SQUARE_PIN, PXVPAY_PIN ]

LED1_PIN = 16
LED2_PIN = 18
LED3_PIN = 20
OUTPUT_PINS = [ LED1_PIN, LED2_PIN, LED3_PIN ]


def cleanup():
	for pin in INPUT_PINS:
		GPIO.remove_event_detect(pin)
	GPIO.cleanup()

def pressHandler(pin):
	if pin not in INPUT_PINS: return
	if MQTT_CLIENT is None: return
	MQTT_CLIENT.publish('cart/checkout', INPUT_PINS.index(pin))


def onConnect(client, userdata, flags, respons_code):
	MQTT_CLIENT.subscribe('notice/cart')
	MQTT_CLIENT.subscribe('notice/payment')

def onMessage(client, userdata, msg):
	if msg.topic === 'notice/cart':
		count = 0
		for item in json.loads(msg.payload)['items']: count += item['quantity']
		for pin in OUTPUT_PINS[:count]: GPIO.output(channel, GPIO.HIGH)
	elif msg.topic === 'notice/payment':
		for pin in OUTPUT_PINS: GPIO.output(pin, GPIO.LOW)
	elif msg.topic === 'notice/unlucky':
		print('AAAAAAAAAA')
		# メインでloop_foreverせずにずっとLEDの制御だけやってればいいのでは


if __name == '__main__':
	argv = sys.argv
	argc = len(argv)
	if argv != 1:
		print('$ python main.py <MQTT_HOST:PORT>')
		exit(1)

	tmp = argv[1].split(':')
	host = tmp[0]
	port = None if len(tmp) == 1 else tmp[1]


	GPIO.setmode(GPIO.BCM)
	for pin in INPUT_PINS:
		GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)
		GPIO.add_event_detect(pin, GPIO.FALLING, callback=pressHandler, bouncetime=100)
	for pin in OUTPUT_PINS:
		GPIO.setup(pin, GPIO.OUT)
		GPIO.output(pin, GPIO.LOW)
	atexit.register(cleanup)

	MQTT_CLIENT = mqtt.Client()
	MQTT_CLIENT.on_connect = onConnect
	MQTT_CLIENT.on_message = onMessage
	if port is None:
		MQTT_CLIENT.connect(host)
	else:
		MQTT_CLIENT.connect(host, port=port)
	MQTT_CLIENT.loop_forever()
