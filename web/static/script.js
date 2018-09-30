$(function() {
	var client = mqtt.connect('mqtt://' + ((location.hash.indexOf('#localhost') > 0) ? 'localhost' : 'sigcoww.local') + ':1883');
	function pub(topic, msg) { client.publish(topic, msg, {qos:0}); };


	var timeout = null;
	$(window).on('load click', function() {
		clearTimeout(timeout);
		timeout = setTimeout(function() {
			//$('#signage').show();
			console.log('#signage.show()');
		}, 60 * 1000);
	});

	$('#signage').on('click', function() {
		$('#signage').hide();
	});

	function initSignage(file) {
		var container = $('#signage');
		container.empty().width(0);

		pdfjsLib.getDocument(file).then(function(pdf) {
			for (var i=1; i<=pdf.numPages; i++) {
				var l = pdf.getPage(i).then(function(page) {
					var viewport = page.getViewport(1);
					var scale = window.innerHeight / viewport.height;
					viewport = page.getViewport(scale);

					var canvas = document.createElement("canvas");
					container.append(canvas);
					var context = canvas.getContext('2d');
					canvas.height = viewport.height;
					canvas.width = viewport.width;
					container.width(container.width() + viewport.width);

					var renderContext = {
						canvasContext: context,
						viewport: viewport
					};
					page.render(renderContext);
				});
			}
		});
	}

	function refresh() {
		$('#total').text(0);
		$('#item table tbody tr').remove();
	}
	refresh();

	$('.payments div').click(function() {
		var id = $(this).data('bid');
		if (id === void 0) {
			alert('Button ID 未設定');
		} else {
			pub('cart/checkout', id);
		}
	});

	function handleSquare(items) {
		var appid = $('#square').data('appid');
		if (!appid) {
			alert('[Square] AppID未設定');
			return;
		}
		
		var total = items.total;
		if (total < 100) {
			alert('[Square] 100円未満の決済不可');
			return;
		}
		
		var param = {
			'amount_money': {
				'amount': total,
				'currency_code': 'JPY'
			},
			'callback_url': location.protocol + '//' + location.host + '/',
			'client_id': appid,
			'version': '1.3',
			'options' : {
				'supported_tender_types': ['CREDIT_CARD', 'CASH', 'OTHER', 'SQUARE_GIFT_CARD', 'CARD_ON_FILE']
			}
		};
		pub('keyboard/press', 'Q');
		window.location = 'square-commerce-v1://payment/create?data=' + encodeURIComponent(JSON.stringify(param));
	}
	
	function handlePixivpay(items) {
		var postfix = 'e';
		var keychar = '';
		for (var i=0; i<items.cart.length; i++) {
			if (items.cart[i].keychar === null) {
				postfix = '';
				continue;
			}

			for (var j=0; j<items.cart[i].quantity; j++) {
				keychar += items.cart[i].keychar;
			}
		}
		pub('keyboard/press', 'Q'+keychar+postfix);
		window.location = 'serval://';
	}
	
	
	client.subscribe('init/dbresponse');
	client.subscribe('notice/cart');
	client.subscribe('notice/payment');
	client.on('connect', function() {
		pub('init/dbrequest');
	});

	client.on('message', function(topic, message) {
		switch (topic) {
		case 'init/dbresponse':
			$.get('/square.txt', function(data) {
				$('#square').data('appid', data);
			});
			if (message.signage) initSignage(message.signage);
			break;
		case 'notice/cart':
			refresh();
			for (var i=0; i<message.cart.length; i++) {
				var tr = $('<tr>');
				if (message.add && message.cart[i].code === message.add.code) $('<tr>').addClass('is-selected');
				var tag = $('<span>').addClass('tag is-dark is-large').text(message.cart[i].typestr);
				var td1 = $('<td>').text(message.cart[i].title).append(tag);
				var td2 = $('<td>').text('&yen; ' + message.cart[i].price.toLocaleString() + ' × ' + message.cart[i].quantity.toLocaleString());
				$('#item table tbody').append(tr.append(td1, td2));
			}

			$('#total').text(message.total.toLocaleString());
			setTimeout(function() {
				$('#item table tbody tr').removeClass('is-selected');
			}, 0);
			break;
		case 'notice/payment':
			refresh();
			switch (message.method) {
			case 'cash':
				break;
			case 'square':
				handleSquare(message);
				break;
			case 'pixivpay':
				handlePixivpay(message);
				break;
			}
			break;
		}
	});
});
