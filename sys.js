
// sys

var _private = Symbol(); // the key for private member 


class Eventer {
	constructor(target) {
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'
		this[_private].target = target;
		this[_private].events = {};	
	}
	add(type, handler) {
		if(!type || !handler) return;
		var handlers = this[_private].events[type];
		if (!handlers) this[_private].events[type] = handlers = [];
		handlers.push(handler);
	}
	remove(type, handler) {
		if(!type || !handler) return;
		var handlers = this[_private].events[type];
		if (!handlers) return;
		for(var i = handlers.length; i-- > 0;) {
			if(handlers[i] == handler) handlers.splice(i, 1)
		}
	}
	fire(type, ...args) {
		if(!type) return;
		var handlers = this[_private].events[type];
		if (!handlers) return;
		for(var i = 0, length = handlers.length; i < length; i++) {
			if(handlers[i].apply(this[_private].target, ...args) === false) return false;
		}
		return true;
	}
}


exports.Eventer = Eventer;