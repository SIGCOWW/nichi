$(function() {
	var client = mqtt.connect('mqtt://' + (location.hash.indexOf('#localhost') ? 'localhost' : 'sigcoww.local') + ':1883');
	function pub(topic, msg) { client.publish(topic, msg, {qos:0}); };

	client.subscribe('notice/payment');
	client.subscribe('notice/cart');
	client.on('message', function(topic, message) {
		console.log(topic, message);
	});

	
});
