#!/bin/bash
#
# ネットワークの接続状況より本気(会場)か判定する
# 本気モードならWiFiとHDMIをOFFにする
#
sleep 60
PING_HOST="sigcoww.org"

# WiFiを 掴んでいたら 何もしない
ip link show up | grep -o -E 'wlan[0-9]+' | while read -r line; do
	ping "$PING_HOST" -c 10 -I "$line"
	if [ $? -eq 0 ]; then exit 123; fi
done
if [ $? -eq 123 ]; then exit; fi

# 全体で 疎通不可なら 何もしない
ping "$PING_HOST" -c 10
if [ $? -ne 0 ]; then exit; fi


# 本気モード
echo "heartbeat" > /sys/class/leds/led0
tvservice --off
ip link show up | grep -o -E 'wlan[0-9]+' | while read -r line; do
	ifconfig "$line" down
done
