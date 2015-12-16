
// route

var _private = Symbol(); // the key for private member 

var _ROUTE_PATTERN_MARK = '[a-z0-9]+';
var _ROUTE_PATTERN_NAME = /\{[a-z0-9]+\}/gi;
var _ROUTE_PATTERN_MATCH = '([a-z0-9]+)';
var _ROUTE_SPECIAL_CHAR = /([^a-z0-9*{}])/gi;

var _convertUrlToPattern = function(url){
	// /abcd/{control}/ddff.html?{name}=123&nam={value}
	if(!url) return '';
	return url.replace(_ROUTE_SPECIAL_CHAR, '\\$1').replace(_ROUTE_PATTERN_NAME, _ROUTE_PATTERN_MATCH);
}

var _createUrlPatternRegex = function(pattern) {
	if(!pattern) pattern = "^.+";
	pattern	= pattern.replace('*', _ROUTE_PATTERN_MARK);
	return new RegExp('^' + pattern, "i");
}

var _getUrlPatternNames = function(url) {
	if(!url) return [];
	var names = url.match(_ROUTE_PATTERN_NAME);
	for(var i = 0, length = names.length, name; i < length; i++){
		name = names[i];
		names[i] = name.substr(1, name.length - 2);
	}
	return names;
}

class Route {
	constructor(url, handler, values, tokens){
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'
		this.url = url;
		this.handler = handler;
		this.values = values;
		this.tokens = tokens;
	}
	parseValues(url) {
		var names = this.urlPatternNames, length = names.length, result = {};
		if(!length) return result;
		var values = this.urlPatternRegex.exec(url);
		if(!values) return result;
		var i = 0;
		while(i < length) {
			result[names[i++]] = values[i];
		}
		return result;
	}
	requiredValue(key){
		var value = this.values;		
		if(value != null) value = value[key];
		if(value == null) throw new Error('The key "' + key + '" is not exists.');
		return value;
	}
	requiredToken(key){
		var value = this.tokens;		
		if(value != null) value = value[key];
		if(value == null) throw new Error('The key "' + key + '" is not exists.');
		return value;
	}
	get url() {
		return this[_private].url;
	}
	set url(value) {
		this[_private].url = value;
		this[_private].urlPattern = null;
		this[_private].urlPatternRegex = null;
		this[_private].urlPatternNames = null;
	}
	get urlPattern() {
		if(this[_private].urlPattern == null) this[_private].urlPattern = _convertUrlToPattern(this.url);
		return this[_private].urlPattern;
	}
	get urlPatternRegex() {
		if(this[_private].urlPatternRegex == null) this[_private].urlPatternRegex = _createUrlPatternRegex(this.urlPattern);
		return this[_private].urlPatternRegex;
	}
	get urlPatternNames() {
		if(this[_private].urlPatternNames == null) this[_private].urlPatternNames = _getUrlPatternNames(this.url);
		return this[_private].urlPatternNames;
	}
	get handler() {
		return this[_private].handler;
	}
	set handler(value) {
		this[_private].handler = value;
	}
	get values() {
		return this[_private].values;
	}
	set values(value) {
		this[_private].values = value;
	}
	get tokens() {
		return this[_private].tokens;
	}
	set tokens(value) {
		this[_private].tokens = value;
	}
}

class RouteData {
	constructor(route, handler, values, tokens) {
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'
		this.route = route;
		this.handler = handler;
		this.values = values;
		this.tokens = tokens;
	}
	getValue(key){
		var value = this.values;
		return value == null ? null : value[key];
	}
	getToken(key){
		var value = this.tokens;
		return value == null ? null : value[key];
	}
	requiredValue(key){
		var value = this.values;
		if(value != null) value = value[key];
		if(value == null) throw new Error('The key "' + key + '" is not exists.');
		return value;
	}
	requiredToken(key){
		var value = this.tokens;
		if(value != null) value = value[key];
		if(value == null) throw new Error('The key "' + key + '" is not exists.');
		return value;
	}
	get route() {
		return this[_private].route;
	}
	set route(value) {
		this[_private].route = value;
	}
	get handler() {
		return this[_private].handler;
	}
	set handler(value) {
		this[_private].handler = value;
	}
	get routeHandler() {
		return this[_private].route && this[_private].route.handler;
	}
	get values() {
		return this[_private].values;
	}
	set values(value) {
		this[_private].values = value;
	}
	get tokens() {
		return this[_private].tokens;
	}
	set tokens(value) {
		this[_private].tokens = value;
	}
}

class RouteTable {
	constructor(){
		console.log('RouteTable.constructor');
		if(RouteTable[_private].Instance) return RouteTable[_private].Instance;
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'
		this[_private].table = [];
		RouteTable[_private].Instance = this;		
	}
	get table() {
		return this[_private].table;
	}
	mapRoute(url, handler, values){
		this[_private].table.push(new Route(url, handler, values));
	}
	matchRoute(url) { // the url cannot be empty '', must start with /
		if(!url) return null;
		var table = this.table;
		for(let i = 0, length = table.length, route; i < length; i++) {
			if((route = table[i]) && route.urlPatternRegex.test(url)) return route;
		}
		return null;
	}
}

RouteTable[_private] = {}; // static private member

exports.Route = Route;
exports.RouteData = RouteData;
exports.RouteTable = new RouteTable();