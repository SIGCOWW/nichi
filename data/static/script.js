$(function() {
	var socket = io();

	// Payment
	function initSquare(appid) {
		$('#square').data('appid', appid);
	}

	function purchase(data) {
		$('#item').css('background-image', 'url('+data.cover+')');
		$('#title').text(data.title);
		$('#subtitle').text(data.subtitle);
		$('#price').text(data.price);
		$('#pxvpay').data('keychar', data.keychar);
	}

	$('#test').on('click', function() {
		$('#price').text('100');
	});

	$('#square').on('click', function() {
		var appid = $('#square').data('appid');
		if (!appid) {
			alert('[Square] AppID未設定');
			return;
		}

		if (Number($('#price').text()) < 100) {
			alert('[Square] 100円未満の決済不可');
			return;
		}

		var param = {
			'amount_money': {
				'amount': Number($('#price').text()),
				'currency_code': 'JPY'
			},
			'callback_url': location.protocol + '//' + location.host + '/',
			'client_id': appid,
			'version': '1.3',
			'options' : {
				'supported_tender_types': ['CREDIT_CARD', 'CASH', 'OTHER', 'SQUARE_GIFT_CARD', 'CARD_ON_FILE']
			}
		};

		socket.emit('press', 'Q');
		window.location = 'square-commerce-v1://payment/create?data=' + encodeURIComponent(JSON.stringify(param));
	});

	$('#pxvpay').on('click', function() {
		var keychar = $('#pxvpay').data('keychar');
		if (!keychar) {
			alert('[pixivPAY] keychar未設定');
			return;
		}

		socket.emit('press', 'Q' + keychar + 'e');
		window.location = 'serval://';
	});


	// Signage
	function showSample() {
		$('div.modal').removeClass("is-active");
		$('#sample').show();
	}

	var timeout = null;
	$(window).on('load click', function() {
		clearTimeout(timeout);
		timeout = setTimeout(showSample, 60 * 1000);
	});

	$('#signage').on('click', function() {
		clearTimeout(timeout);
		timeout = null;
		showSample();
	});

	$('#sample').on('click', function() {
		$("#sample").hide();
	});

	function initSignage(file) {
		var container = $('#sample');
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


	// Configure
	$('#conft').on('click', function() {
		$('div.modal').addClass("is-active");
	})

	$('div.modal-background').on('click', function() {
		$('div.modal').removeClass('is-active');
	})


	// Server
	socket.on('connect', function() {
		socket.on('initialize', function(data) {
			initSignage(data.signage);
			initSquare(data.square);
		});

		socket.on('purchase', function(data) {
			$(window).trigger('click');
			$('#sample').trigger('click');
			purchase(data);
		});
	});
});
