
// collections

var _private = Symbol(); // the key for private member 



var _keysValues = Symbol(); // the key for keys and values

class Dictionary {
	constructor(){
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'
		this[_keysValues] = {};
	}
	get(key){
		return this[_keysValues][key];
	}
	set(key, value){
		this[_keysValues][key] = value;
		return this;
	}
	contains(key){
		return this[_keysValues].hasOwnProperty(key)
	}
	remove(key){
		delete this[_keysValues][key];
		return this;
	}
}


exports.Dictionary = Dictionary;