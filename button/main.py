# -*- coding: utf-8 -*-
import sys
import atexit
import RPi.GPIO as GPIO
import paho.mqtt.client as mqtt
import json
import time

MQTT_CLIENT = None

CASH_PIN = 17
SQUARE_PIN = 19
PXVPAY_PIN = 21
BUTTON_PINS = [ CASH_PIN, SQUARE_PIN, PXVPAY_PIN ]

LED1_PIN = 16
LED2_PIN = 18
LED3_PIN = 20
LED_PINS = [ LED1_PIN, LED2_PIN, LED3_PIN ]
LED_STATUS = [ False, False, False ]
LED_UNHAPPY = {'kemu':False, 'pixivpay':False}
LED_UNHAPPY_TIMING = False


def cleanup():
	for pin in BUTTON_PINS: GPIO.remove_event_detect(pin)
	GPIO.cleanup()

def pressHandler(pin):
	if pin not in BUTTON_PINS: return
	if MQTT_CLIENT is None: return
	MQTT_CLIENT.publish('cart/checkout', json.dumps(BUTTON_PINS.index(pin)+1))


def ledctl():
	global LED_UNHAPPY_TIMING
	unhappy = LED_UNHAPPY['kemu'] or LED_UNHAPPY['pixivpay']
	if (not unhappy) or (unhappy and (not LED_UNHAPPY_TIMING)):
		status = LED_STATUS
	else:
		if LED_STATUS.count(True) > 0:
			status = [ False for i in range(len(LED_PINS)) ]
		else:
			status = [ len(LED_PINS)//2 == i for i in range(len(LED_PINS)) ]

	for i in range(len(LED_PINS)): GPIO.output(LED_PINS[i], GPIO.HIGH if status[i] else GPIO.LOW)
	LED_UNHAPPY_TIMING = not LED_UNHAPPY_TIMING

def onConnect(client, userdata, flags, respons_code):
	MQTT_CLIENT.subscribe('notice/cart')
	MQTT_CLIENT.subscribe('notice/payment')
	MQTT_CLIENT.subscribe('notice/unhappy')

def onMessage(client, userdata, msg):
	global LED_STATUS
	global LED_UNHAPPY_TIMING
	message = json.loads(msg.payload)

	if msg.topic == 'notice/cart':
		count = 0
		for item in message['cart']: count += item['quantity']
		LED_STATUS = [ i < count for i in range(len(LED_PINS)) ]
	elif msg.topic == 'notice/payment':
		LED_STATUS = [ False for i in range(len(LED_PINS)) ]
	elif msg.topic == 'notice/unhappy':
		for (k,v) in message.items():
			if k in LED_UNHAPPY: LED_UNHAPPY[k] = v
		LED_UNHAPPY_TIMING = False
	ledctl()


if __name__ == '__main__':
	argv = sys.argv
	argc = len(argv)
	if argc != 2:
		print('$ python main.py <MQTT_HOST:PORT>')
		exit(1)

	tmp = argv[1].split(':')
	host = tmp[0]
	port = None if len(tmp) == 1 else tmp[1]


	GPIO.setmode(GPIO.BCM)
	for pin in BUTTON_PINS:
		GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)
		GPIO.add_event_detect(pin, GPIO.FALLING, callback=pressHandler, bouncetime=100)
	for pin in LED_PINS:
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

	while True:
		ledctl()
		MQTT_CLIENT.loop(1)
