
// controller

var _action = require('./action');
var _route = require('./route');
var _view = require('./view');

var _private = Symbol(); // the key for private member 

class Controller {
	constructor(context) {
		this[_private] = {}; // must be first in any constructor, must after at 'super()'
	}
	initialize(context) {
		this.context = context;
		this.request = context.request;
		this.response = context.response;
	}
	content(content, contentType, encoding) {
		return new _action.ContentResult(content, contentType, encoding)
	}
	view(name, layout, model){ // (), (model)/(name), (name, model)/(name, layout), 
		if(arguments.length == 1 && name != null && name.constructor != String){
			model = name, name = null;
		} else if (arguments.length == 2 && layout != null && layout.constructor != String) {
			model = layout, layout = null;
		}
		this.viewData.model = model;
		var result = new _action.ViewResult(name, layout, model);
		result.viewData = this.viewData;
		result.viewEngines = this.viewEngines;
		return result;
	}
	get context() {
		return this[_private].context;
	}
	set context(value) {
		this[_private].context = value;
	}
	get request() {
		return this[_private].request;
	}
	set request(value) {
		this[_private].request = value;
	}
	get response() {
		return this[_private].response;
	}
	set response(value) {
		this[_private].response = value;
	}
	get routeData() {
		if(!this[_private].routeData) this[_private].routeData = this.request.routeData;
		return this[_private].routeData;
	}
	get viewData() {
		var data = this[_private].viewData;
		if(!data) this[_private].viewData = data = new _view.ViewData();
		return data;
	}
	set viewData(value) {
		this[_private].viewData = value;
	}
	get controllerContext(){
		var context = this[_private].controllerContext;
		if(!context) this[_private].controllerContext = context = new ControllerContext(this, this.context, this.routeData);
		return context;
	}
	get viewEngines(){ // ViewEngineCollection
		return this[_private].viewEngines || _view.ViewEngines.engines;
	}
	set viewEngines(value){ // value: ViewEngineCollection
		this[_private].viewEngines = value;
	}
}

class ControllerContext {
	constructor(controller, httpContext, routeData) {
		this[_private] = {}; // must be first in any constructor, must after at 'super()'
		this.controller = controller;
		this.httpContext = httpContext;
		this.routeData = routeData;
	}
	get controller() {
		return this[_private].controller;
	}
	set controller(value) {
		this[_private].controller = value;
	}
	get httpContext() {
		return this[_private].httpContext;
	}
	set httpContext(value) {
		this[_private].httpContext = value;
	}
	get routeData() {
		return this[_private].routeData;
	}
	set routeData(value) {
		this[_private].routeData = value;
	}
}

exports.Controller = Controller;
exports.ControllerContext = ControllerContext;