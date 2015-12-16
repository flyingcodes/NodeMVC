
// web

var _route = require('./route');
var _url = require('url');
var _sys = require('./sys');
var _io = require('./io');

var _private = Symbol(); // the key for private member 

var _registeredModules = [];

var _initializeRegisteredModules = function(application) {
	var length = _registeredModules.length, i = -1, module;
	while(++i < length) {
		if((module = _registeredModules[i])) module.initialize(application);	
	}	
}

var _moduleProcessRequest = function(module, context, application) {
	var events = application[_private].events;
	events.fire("BeginRequest", context);
	module.processRequest(context);
	events.fire("EndRequest", context);
}

var _httpApplicationConfigKeys = 'physicalPath virtualPath'.split(' ')

class HttpApplicationConfig {
	constructor(config) {
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'
		if(config == null) return;
		for(var key in config){
			if(_httpApplicationConfigKeys.indexOf(key) < 0) throw new Error("The config key \"" + key + "\" is invalid.");
			this[key] = config[key];
		}
	}
	get physicalPath(){
		return this[_private].physicalPath;
	}
	get physicalPathRoot(){
		return this[_private].physicalPathRoot;
	}
	set physicalPath(value){
		if(!value) throw new Error("The value can not be null or empty");
		if(!_io.File.exists(value)) throw new Error("The path \"" + value + "\" is not exists.");
		var separator = _io.Path.separator, last = value.length - 1;
		if(value[last] == separator) value = value.substring(0, last);
		this[_private].physicalPath = value;
		this[_private].physicalPathRoot = value + separator;
	}
	get virtualPath(){
		return this[_private].virtualPath;
	}
	get virtualPathRoot(){
		return this[_private].virtualPathRoot;
	}
	set virtualPath(value){
		if(!value) throw new Error("The value can not be null or empty");
		if(value[0] != '/') throw new Error("The value \"" + value + "\" is not starts with \'/\'.");
		var last = value.length - 1;
		if(last && value[last] == '/') value = value.substring(0, last);		
		this[_private].virtualPath = value;
		this[_private].virtualPathRoot = last ? value + '/' : value;
	}
}

class HttpApplication {
	static registerModule (module) {
		//if(_registeredModules.indexOf(module) > -1) throw "The module is registered.";
		_registeredModules.push(module);
	}
	constructor(config) {
		console.log('HttpApplication.constructor');
		if(config == null) throw new Error("The config can not be null");
		if(!(config instanceof HttpApplicationConfig)) throw new Error("The config is not a instance of HttpApplicationConfig.");
		if(HttpApplication[_private].Instance) return HttpApplication[_private].Instance;
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'
		this[_private].isRunning = false;
		this[_private].events = new _sys.Eventer(this);
		this[_private].config = config;
		HttpApplication[_private].Instance = this;
	}
	initialize(){
		if(this[_private].initialized) return;
		_initializeRegisteredModules(this);
		this[_private].initialized = true;
	}
	start() {
		if(!this[_private].initialized) this.initialize();
		this[_private].isRunning = true;		
	}
	pause() {
		this[_private].isRunning = false;
	}
	onBeginRequest(handler){ // handler(context)
		this[_private].events.add("BeginRequest", handler);
	}
	onEndRequest(handler){ // handler(context)
		this[_private].events.add("EndRequest", handler);
	}
	onRequestCompleted(handler){ // handler(context)
		this[_private].events.add("RequestCompleted", handler);
	}
	processRequest(context){
		var events = this[_private].events;
		if(!context.application) context.application = this;
		events.fire("BeginRequest", context);
		var length = _registeredModules.length, i = -1;
		while(++i < length) {
			_registeredModules[i].processRequest(context);	
		}
		events.fire("EndRequest", context);
		events.fire("RequestCompleted", context);
	}
	get isRunning() {
		return this[_private].isRunning;
	}
	get physicalPath(){
		return this[_private].config.physicalPath;
	}
	get physicalPathRoot(){
		return this[_private].config.physicalPathRoot;
	}
	get virtualPath(){
		return this[_private].config.virtualPath;
	}
	get virtualPathRoot(){
		return this[_private].config.virtualPathRoot;
	}
	
}

HttpApplication[_private] = {}; // static private member


class HttpContext {
	constructor(application, request, response) { // (request, response)
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'
		if(arguments.length == 2) {
			response = request, request = application, application = null;
		}
		this.application = application;
		this.request = request;
		this.response = response;
	}	
	get application(){
		return this[_private].application;
	}
	set application(value) {
		this[_private].application = value;
	}
	get request(){
		return this[_private].request;
	}
	set request(value) {
		this[_private].request = value;
	}
	get response(){
		return this[_private].response;
	}
	set response(value) {
		this[_private].response = value;
	}
	get server(){
		return this[_private].server;
	}
	set server(value) {
		this[_private].server = value;
	}
	get session(){
		return this[_private].session;
	}
	set session(value) {
		this[_private].session = value;
	}
}

var _createRouteData = function(url) {
	var route = _route.RouteTable.matchRoute(url);
	if(!route) return new _route.RouteData(new _route.RouteData());
	var def = route.values && Object.create(route.values), values = route.parseValues(url), tokens = route.tokens;
	return new _route.RouteData(route, route.handler, Object.assign(def || {}, values), tokens && Object.create(route.tokens));
}

class HttpRequest {
	constructor() {
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'
	}
	get rawUrl(){
		return this[_private].rawUrl;
	}
	set rawUrl(value){
		this[_private].rawUrl = value;
		this[_private].url = null;
		this[_private].queryString = null;
		this[_private].routeData = null;
	}
	get url() {
		if(this[_private].url == null) this[_private].url = _url.parse(this[_private].rawUrl, true);
		return this[_private].url;
	}
	get path() {
		return this.url.pathname;
	}
	get queryString() { // string
		if(this[_private].queryString == null) this[_private].queryString = this.url.search ? this.url.search.substr(1) : "";
		return this[_private].queryString;
	}
	get query(){ // object
		return this.url.query;
	}
	get routeData(){
		if(!this[_private].routeData) this[_private].routeData = _createRouteData(this.path);
		return this[_private].routeData;
	}
}


class HttpResponse {
	constructor() {
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'
	}
	get contentType() {
		return this[_private].contentType;
	}
	set contentType(value) {
		this[_private].contentType = value;
	}
	get contentEncoding() {
		return this[_private].contentEncoding;
	}
	set contentEncoding(value) {
		this[_private].contentEncoding = value;
	}
	get contentBody() {
		return this[_private].contentBody;
	}
	set contentBody(value) {
		this[_private].contentBody = value;
	}
}


class HttpServer {
	constructor() {
		
	}
}

class HttpSession {
	constructor() {
		
	}
}

class IHttpModule {
	initialize(application) {		
	}
	processRequest(context){		
	}
	dispose() {		
	}
}

class IHttpHandler {
	processRequest(context){		
	}
}

exports.HttpApplication = HttpApplication;
exports.HttpApplicationConfig = HttpApplicationConfig;
exports.HttpContext = HttpContext;
exports.HttpRequest = HttpRequest;
exports.HttpResponse = HttpResponse;
exports.HttpServer = HttpServer;
exports.HttpSession = HttpSession;
exports.IHttpModule = IHttpModule;
exports.IHttpHandler = IHttpHandler;