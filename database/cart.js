'use strict';
let CART = [];

module.exports.add = (item) => {
	for (let val of CART) {
		if (val.code === item.code) {
			val.quantity += 1;
			return;
		}
	}
	CART.push(item);
};

module.exports.del = (item) => {
	for (let val of CART) {
		if (val.code === item.code) {
			val.quantity -= 1;
			break;
		}
	}
	CART = CART.filter(val => val.quantity != 0);
};

module.exports.items = () => {
	return CART;
};

module.exports.clear = () => {
	CART = [];
};