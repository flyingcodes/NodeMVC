
// mvc

console.log(__filename);


require('./lang');

var _url = require('url');
var _path = require('path');

var _controller = require('./controller');
var _action = require('./action');
var _view = require('./view');
var _web = require('./web');
var _route = require('./route');
var _jhtml = require('./jhtml');

var _private = Symbol(); // the key for private member 

var _COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var _DATE_ISO_END = new Date(0).toISOString().substr(10);
var _DATE_OFFSET = new Date().getTimezoneOffset() * 60 * 1000;

var _registeredControllers = {};

var _application;

var _getParameterNames = function (func) {
	var code = func.toString().replace(_COMMENTS, '');
	var result = code.slice(code.indexOf('(') + 1, code.indexOf(')'))
		.match(/([^\s,]+)/g);

	return result === null
		? []
		: result;
}

var _registerController = function (service, controller, controllerType) {
	var key = (service ? service.toLowerCase() : '') + '/' + controller.toLowerCase();
	_registeredControllers[key] = controllerType;
}

var _getRegisteredController = function (service, controller) {
	var key = (service ? service.toLowerCase() : '') + '/' + controller.toLowerCase();
	return _registeredControllers[key] || null;
}

var _findActionInController = function(controller, action) {
	if(!controller || !action) return null;
	action = action.toLowerCase();
	var act = 'Action', alen = act.length, names = Object.getOwnPropertyNames(controller.__proto__);
	for(var i = 0, length = names.length, name; i < length; i++){
		if((name = names[i]).endsWith(act) && name.substr(0, name.length - alen).toLowerCase() == action) return controller[name];
	}
	return null;
}

var _parseParameterValue = function (value) {
	if (value == null || value.length > 32) return value;
	var val = new Number(value).valueOf();
	if (!isNaN(val)) return val;
	if (value.length == 10) {
		val = Date.parse(value + _DATE_ISO_END);
		if (!isNaN(val)) return new Date(val + _DATE_OFFSET);
	}
	return value;
}

exports.register = function (service, controller, controllerType) { // (model), (service, controllerType)
	if (arguments.length > 2) return _registerController(service, controller, controllerType);
	if (arguments.length > 1) return _registerController(service, controller.name, controller);	
	var model = service, ctrl = 'Controller', ctrllen = ctrl.length;
	service = model.serviceName;
	for (var name in model) {
		if (name.endsWith(ctrl)) {
			_registerController(service, name.substr(0, name.length - ctrllen), model[name]);
		}
	}
};

class MvcHttpModule extends _web.IHttpModule {
	initialize(application) {		
	}
	processRequest(context){
		var request = context.request;
		var routeData = request.routeData;
		if(!routeData) return;
		var handler = routeData.handler || routeData.routeHandler;
		if(!handler) return;
		handler.processRequest(context);
	}
	dispose() {		
	}
}

class MvcControllerHttpHandler extends _web.IHttpHandler {
	processRequest(context) {
		var request = context.request;
		var routeData = request.routeData;
		if(!routeData) return;
		var values = routeData.values;
		if(!values) return;
		var controller = _getRegisteredController(values.service, values.controller);
		if (!controller) return;
		controller = new controller();
		controller.initialize(context);
		var action = _findActionInController(controller, values.action);
		if(!action) return;
		var names = _getParameterNames(action), length = names.length, i = -1, query = request.query;
		while (++i < length) {
			names[i] = _parseParameterValue(query[names[i]]);
		}
		var result = action.apply(controller, names);
		if (result instanceof _action.ActionResult) {
			result.executeResult(controller.controllerContext);	
		} else {
			context.response.contentBody = result;
		}		
	}
}

class MvcHttpApplication extends _web.HttpApplication {
	constructor(config) {
		super(config);
		_web.HttpApplication.registerModule(new MvcHttpModule());
	}
}

var _createHttpContext = function (ctx) {
	var request = new _web.HttpRequest(), req = ctx.request;
	
	request.rawUrl = req.url;
	
	var response = new _web.HttpResponse();
	
	return new _web.HttpContext(request, response);
}

exports.mapControllerRoute = function(url, values) {
	_route.RouteTable.mapRoute(url || '/', new MvcControllerHttpHandler(), values);
}

exports.handle = function* (ctx) {
	var context = _createHttpContext(ctx);
	_application.processRequest(context);
	var response = context.response, res = ctx.response;
	res.body = response.contentBody;
	if(response.contentType) res.set('Content-Type', response.contentEncoding ? (response.contentType + '; charset=' + response.contentEncoding) : response.contentType);
}


exports.createApplication = function(config){
	config = new _web.HttpApplicationConfig(config);
	return exports.application = _application = new MvcHttpApplication(config);	
}


_view.ViewEngines.add(new _jhtml.JHtmlFileViewEngine());

Object.assign(exports, _action, _controller, _route, _web);