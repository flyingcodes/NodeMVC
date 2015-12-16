
// action

var _io = require('./io');
var _view = require('./view');

var _private = Symbol(); // the key for private member 

class ActionResult {
	constructor() {
	}
	executeResult(context) {
	}
}

class ContentResult extends ActionResult {
	constructor(content, contentType, encoding) {
		super();
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'
		this.content = content;
		this.contentType = encoding;
		this.encoding = encoding;
	}
	executeResult(context) { // context: ControllerContext
		var response = context.controller.response;
		response.contentType = this.contentType;
		response.contentEncoding = this.encoding;
		response.contentBody = this.content;
		//response.write(this.content, this.encoding);
	}
	get content() {
		return this[_private].content;
	}
	set content(value) {
		this[_private].content = value == null ? null : (value.constructor == String ? value : value.toString());
	}
	get contentType() {
		return this[_private].contentType;
	}
	set contentType(value) {
		this[_private].contentType = value == null ? null : (value.constructor == String ? value : value.toString());;
	}
	get encoding() {
		return this[_private].encoding;
	}
	set encoding(value) {
		this[_private].encoding = value == null ? null : (value.constructor == String ? value : value.toString());
	}
}


class ViewResult extends ActionResult {
	constructor(view, layout, model) { // (), (model)/(view), (view, model)/(view, layout), 
		if(arguments.length == 1 && view != null && view.constructor != String){
			model = view, view = null;
		} else if (arguments.length == 2 && layout != null && layout.constructor != String) {
			model = layout, layout = null;
		}
		super();
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'
		this.viewName = view;
		this.layoutName = layout;
		if(model !== undefined) this[_private].model = model;
	}
	executeResult(context) { // context: ControllerContext
		var view = this.viewName;	
		if(!view) {
			if(!this.viewName) this.viewName = context.routeData.requiredValue('action');
			this.view = view = this.findView(context);
		}
		var writer = new _io.StringWriter();
		var vcontext = new _view.ViewContext(context, view, this.viewData, writer);
		view.render(vcontext, writer);
		var response = context.controller.response;
		response.contentType = this.contentType || 'text/html';
		response.contentEncoding = this.encoding || 'utf-8';
		response.contentBody = writer.toString();
	}
	findView(context){ // context: ControllerContext
		var view = this.viewName, result = this.engines.findView(context, view, this.layoutName);
		if(result.view) return result.view;
		throw new Error('Cannot find the view for "' + view + '":\r\n' + result.paths.join('\r\n'));
	}
	get viewName(){ // String
		return this[_private].viewName;
	}
	set viewName(value){ // String
		this[_private].viewName = value;
	}	
	get layoutName(){ // String
		return this[_private].layoutName;
	}
	set layoutName(value){ // String
		this[_private].layoutName = value;
	}	
	get model(){ // Object
		var data = this.viewData;
		return data == null ? this[_private].model : data.model;
	}
	get view(){ // IView
		return this[_private].view;
	}
	set view(value){ // IView
		this[_private].view = value;
	}
	get viewData(){ // ViewData
		return this[_private].viewData;
	}
	set viewData(value){ // ViewData
		if(value != null && this[_private].model !== undefined) {
			value.model = this[_private].model;
			delete this[_private].model;
		}
		this[_private].viewData = value;
	}	
	get engines(){ // ViewEngineCollection
		return this[_private].engines || _view.ViewEngines.engines;
	}
	set engines(value){ // value: ViewEngineCollection
		this[_private].engines = value;
	}
}

exports.ActionResult = ActionResult;
exports.ContentResult = ContentResult;
exports.ViewResult = ViewResult;