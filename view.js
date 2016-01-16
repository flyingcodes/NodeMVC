
// view

var _io = require('./io');
var _collections = require('./collections');

var _private = Symbol(); // the key for private member 

class IView {
	/**
	 * Render the view into writer.
	 * @param {ViewContext} context ViewContext : The view context for the view to render.
	 * @param {TextWriter} writer TextWriter : The text writer for the view to render.
	 */
	render(context, writer){		
	}
}

class IViewEngine {
	/**
	 * Find the view instance.
	 * @param {ControllerContext} controllerContext ControllerContext : The context of controller to find view.
	 * @param {String} view String : The name of view to find.
	 * @param {String} layout String : The name of layout to find.
	 * @returns {ViewEngineResult} ViewEngineResult : The search result for view engine.
	 */
	findView(controllerContext, view, layout) {		
	}
}

class ViewContext {
	constructor(controllerContext, view, viewData, writer){
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'
		this.controllerContext = controllerContext;
		this.view = view;
		this.viewData = viewData;
		this.writer = writer;
	}
	get controllerContext(){
		return this[_private].controllerContext;
	}
	set controllerContext(value){
		this[_private].controllerContext = value;
	}
	get controller() {
		var context = this[_private].controllerContext;
		return context && context.controller;
	}
	get httpContext() {
		var context = this[_private].controllerContext;
		return context && context.httpContext;
	}
	get routeData() {
		var context = this[_private].controllerContext;
		return context && context.routeData;
	}	
	get view(){
		return this[_private].view;
	}
	set view(value){
		this[_private].view = value;
	}
	get viewData(){
		return this[_private].viewData;
	}
	set viewData(value){
		this[_private].viewData = value;
	}
	get writer(){
		return this[_private].writer;
	}
	set writer(value){
		this[_private].writer = value;
	}
}

class ViewData extends _collections.Dictionary {
	constructor(model) {
		super();
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'
		this.model = model;
	}
	get model() {
		return this[_private].model;
	}
	set model(value){
		this[_private].model = value;
	}
}


class ViewEngineCollection extends Array {
	constructor(){
		super();
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'
	}
	add(value){
		super.push(value);
	}
	clear(){
		super.length = 0;
	}	
	findView(controllerContext, view, layout){
		var length = this.length, i = -1, engine, result, paths = [];
		while(++i < length) {
			if(!(engine = this[i])) continue;
			if(!(result = engine.findView(controllerContext, view, layout))) continue;
			if(result.view) return result;
			paths.push(...result.paths);
		}
		return new ViewEngineResult(paths);
	}
}

class ViewEngineResult {
	constructor(paths, view, engine) { // (paths, engine), (view, engine)
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'
		if(arguments.length < 3) {
			engine = view;
			if(paths instanceof Array) {
				view = null;
			} else {
				view = paths, paths = null;
			}
		}
		this.paths = paths;
		this.view = view;
		this.engine = engine;
	}
	get paths(){
		return this[_private].paths;
	}
	set paths(value){
		this[_private].paths = value;
	}
	get view(){
		return this[_private].view;
	}
	set view(value){
		this[_private].view = value;
	}
	get engine(){
		return this[_private].engine;
	}
	set engine(value){
		this[_private].engine = value;
	}
}


class ViewEngines {
	constructor(){
		console.log('ViewEngines.constructor');
		if(ViewEngines[_private].Instance) return ViewEngines[_private].Instance;
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'
		this[_private].engines = new ViewEngineCollection();
		ViewEngines[_private].Instance = this;				
	}
	add(engine) {
		this.engines.add(engine);
	}
	get engines(){ // ViewEngineCollection
		return this[_private].engines;
	}
}

ViewEngines[_private] = {}; // static private member

var _viewEngines = new ViewEngines();

var _FILE_PATH_CLEAR = /[\\/]+/gi;
var _FILE_PATH_SEPARATOR = _io.Path.separator;

class VirtualFileViewEngine extends IViewEngine {
	constructor(){
		super();		
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'
	}
	/**
	 * Get full physical path of virtual file.
	 * @param {ControllerContext} controllerContext ControllerContext : The context of controller to get virtual file.
	 * @param {String} path String : The virtual path of virtual file to get.
	 */
	getFullPath(controllerContext, file){
		file = controllerContext.httpContext.application.physicalPathRoot + file;
		return file.replace(_FILE_PATH_CLEAR, _FILE_PATH_SEPARATOR);
	}
	/**
	 * Check the file is exists.
	 * @param {ControllerContext} controllerContext ControllerContext : The context of controller to check view file.
	 * @param {String} path String : The path of view file to check.
	 */
	fileExists(controllerContext, path){
		path = this.getFullPath(controllerContext, path);		
		return _io.File.exists(path);
	}
	/**
	 * Create the view instance.
	 * @param {ControllerContext} controllerContext ControllerContext : The context of controller to create view.
	 * @param {String} view String : The path of view to create.
	 * @param {String} layout String : The path of layout to create.
	 * @returns {IView} IView : The view instance is created.
	 */
	createView(controllerContext, view, layout){
	}
	/**
	 * Find the view instance.
	 * @param {ControllerContext} controllerContext ControllerContext : The context of controller to find view.
	 * @param {String} view String : The name of view to find.
	 * @param {String} layout String : The name of layout to find.
	 * @returns {ViewEngineResult} ViewEngineResult : The search result for view engine.
	 */
	findView(controllerContext, view, layout) {	
		var routeData = controllerContext.routeData, serviceName = routeData.getValue("service") || routeData.getToken("service"), 
			controllerName = routeData.requiredValue("controller") || routeData.requiredToken("controller"), searcheds;
		var viewPath = this.findViewFile(controllerContext, view, controllerName, serviceName, searcheds = []), layoutPath;
		if(!viewPath) return new ViewEngineResult(searcheds, this);
		if(layout) {
			layoutPath = this.findViewFile(controllerContext, layout, controllerName, serviceName, searcheds = []);
			if(!layoutPath) return new ViewEngineResult(searcheds, this);
		}
		view = this.createView(controllerContext, viewPath, layoutPath);
		return new ViewEngineResult(view, this); 
	}
	/**
	 * Find the view file.
	 * @param {ControllerContext} controllerContext ControllerContext : The context of controller to find view.
	 * @param {String} view String : The name of view to find.
	 * @param {String} controller String : The name of controller for view to find.
	 * @param {String} service String : The name of service for view to find.
	 * @param {String[]} searcheds String[] : String array of file path is searched.
	 * @returns {String} String : The path of file is found, null for not found.
	 */
	findViewFile(controllerContext, view, controller, service, searcheds){
		var formats = this.filePathFormats;
		if(!formats) return null;
		for(var i = 0, length = formats.length, path; i < length; i++){
			if((path = String.format(formats[i], view, controller, service)) && this.fileExists(controllerContext, path = path.replace(_FILE_PATH_CLEAR, '/'))) return path;
			if(searcheds) searcheds.push(path);
		}
		return null;
	}
	/**
	 * The string formats for file path.
	 * @returns {String[]} String[] : String array of formats for file path, like "/{service}/{controller}/{action}.html".
	 */ 
	get filePathFormats() { // String[] "/{service}/{controller}/{action}.html"
		return this[_private].filePathFormats;
	}
	/**
	 * The string formats for file path.
	 * @param {String[]} value String[] : String array of formats for file path, like "/{service}/{controller}/{action}.html".
	 */ 
	set filePathFormats(value){ // value: String[] "/{service}/{controller}/{action}.html"
		this[_private].filePathFormats = value || [];
	}
}


var _cachedViewTypes = {};

var _readFileContent = function(path) {
	return _io.File.readContent(path, 'utf-8');
}

class ViewCompileResult {
	constructor(inherits, layout, content){
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'
		this.inherits = inherits;
		this.layout = layout;
		this.content = content;
	}
	get inherits() {
		return this[_private].inherits;
	}
	set inherits(value) {
		this[_private].inherits = value;
	}
	get layout() {
		return this[_private].layout;
	}
	set layout(value) {
		this[_private].layout = value;
	}
	get content() {
		return this[_private].content;
	}
	set content(value) {
		this[_private].content = value;
	}
	get sections() { // array of ViewCompileSection
		return this[_private].sections;
	}
	set sections(value) { // array of ViewCompileSection
		this[_private].sections = value;
	}
}

class ViewCompileSection {
	constructor(name, content) {
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'
		this.name = name;
		this.content = content;
	}
	get name() {
		return this[_private].name;
	}
	set name(value) {
		this[_private].name = value;
	}
	get content() {
		return this[_private].content;
	}
	set content(value) {
		this[_private].content = value;
	}
}

class ViewBuilder {
	constructor(){		
	}
	compile(path){
		if(!path) return null;
		var content = _readFileContent(path);
		var result = this.compileContent(content), inherits = result.inherits, layout = result.layout, content = result.content, sections = result.sections;
		console.log(content);
		result.inherits = inherits ? new Function("return " + inherits) : null;
		result.layout = layout ? new Function("return " + layout) : null;
		result.content = new Function("viewPage, viewModel, viewData", content);
		result.sections = sections ? this.createSections(sections) : null;
		return result;
	}
	compileContent(content){ // override it
		return null;
	}
	getViewType(path){
		if(!path) return null;
		var type = _cachedViewTypes[path];
		if(!type) _cachedViewTypes[path] = type = this.compile(path);
		return type;	
	}
	createSections(sections){
		if(!sections) return sections;
		var length = sections.length, result = new Array(length), i = -1, section;
		while(++i < length){
			section = sections[i];
			result[i] = new ViewCompileSection(section.name, new Function("viewPage, viewModel, viewData", section.content));
		}
		return result;
	}
}

class ViewPageExecutingBase {
	constructor(pageContent){
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'
		this.pageContent = pageContent;	
	}
	execute(){
		var page = this.pageContent;
		page.apply(this);	
	}
	get pageContent(){
		return this[_private].pageContent;
	}	
	set pageContent(value){
		this[_private].pageContent = value;
	}
}

class ViewPageRenderingBase extends ViewPageExecutingBase {
	constructor(pageContent){
		super(pageContent);
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'
		//this[_private].output
	}
	execute(){
		var page = this.pageContent;
		page.apply(this, [this, this.model, this.viewData]); // "viewPage, viewModel, viewData"	
	}	
	executePageHierarchy(){		
	}
	renderPage(){		
	}
	write(value){
		if(value == null) return;
		this.output.write(String.is(value) ? value : (value.constructor == Object ? JSON.stringify(value) : value.toString()));
	}
	get layout() {
		return this[_private].layout;
	}
	set layout(value) {
		this[_private].layout = value;
	}
	get viewContext() {
		return this[_private].viewContext;
	}
	set viewContext(value) {
		this[_private].viewContext = value;
	}
	get output() {
		var output = this[_private].output;
		if(output) return output;
		var context = this.viewContext;
		return context && context.writer;
	}
	set output(value) {
		this[_private].output = value;
	}
	get model(){
		var data = this.viewData;
		return data && data.model;
	}
	get viewData(){
		var context = this.viewContext;
		return context && context.viewData;
	}	
}

class ViewPageBase extends ViewPageRenderingBase {
	constructor(pageContent){
		super(pageContent);
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'	
	}
	executePageHierarchy(){
		this.execute();	
	}
	renderPage(){		
	}
	configPage(parent) {
		
	}
	defineSection(name, body){
		var sections = this.sections;
		if(sections.contains(name)) throw new Error('The section "' + name + '" is defined.');
		sections.set(name, body);
	}
	renderSection(name, required){
		var section = this.sections.get(name);
		if(!section) {
			if(!required) return;
			throw new Error('The section "' + name + '" is not defined.');
		}
		section.apply(this);
	}
	findView(view){
		var context = this.viewContext.controllerContext, engines = context.controller.viewEngines || _viewEngines.engines;
		var result = engines.findView(context, view, this.layoutName);
		if(result.view) return result.view;
		throw new Error('Cannot find the view for "' + view + '":\r\n' + result.paths.join('\r\n'));
	}
	get sections(){
		var sections = this[_private].sections
		if(!sections) this[_private].sections = sections = new _collections.Dictionary();
		return this[_private].sections;
	}
}

class ViewLayoutPage extends ViewPageBase {
	constructor(pageContent){
		super(pageContent);
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'	
	}	
	executePageHierarchy(){
		var page = this.contentPage, output	= new _io.StringWriter();
		this.contentOutput = page.output = output;
		page.execute();
		this.execute();
	}
	renderContentPage() {
		this.write(this.contentOutput.toString());	
	}
	renderSection(name, required){
		var section = this.sections.get(name);
		if(!section){
			var page = this.contentPage;
			if(page) section = page.sections.get(name);
			if(!section) {
				if(!required) return;
				throw new Error('The section "' + name + '" is not defined.');
			}
		}
		section.apply(this);
	}	
	get contentPage() {
		return this[_private].contentPage;
	}
	set contentPage(value) {
		this[_private].contentPage = value;
	}
	get contentOutput() {
		return this[_private].contentOutput;
	}
	set contentOutput(value) {
		this[_private].contentOutput = value;
	}
} 

class ViewPage extends ViewPageBase {
	constructor(pageContent){
		super(pageContent);
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'
		//this[_private].writer = new _io.StringWriter();
	}
	createLayout() {
		var view = this.findView(this.layout);
		if(!(view instanceof CompiledView)) throw new Error("The layout view is not instance of CompiledView.");
		var page = view.createViewLayoutPage();
		page.viewContext = this.viewContext;
		page.contentPage = this;
		this.layoutPage = page;
	}
	executePageHierarchy(){		
		if(!this.layout) {
			this.output = this.viewContext.writer;
			return this.execute();
		}
		this.createLayout();
		this.layoutPage.executePageHierarchy();
	}
	renderSection(name, required){
		var section = this.sections.get(name);
		if(!section){
			var page = this.layoutPage;
			if(page) section = page.sections.get(name);
			if(!section) {
				if(!required) return;
				throw new Error('The section "' + name + '" is not defined.');
			}
		}
		section.apply(this);
	}
	get layout() {
		return this[_private].layout;
	}
	set layout(value) {
		if(this.layoutPage) throw new Error("The layout page is created, can not change it.");
		this[_private].layout = value;
	}
	get layoutPage(){
		return this[_private].layoutPage;
	}
	set layoutPage(value){
		this[_private].layoutPage = value;
	}	
}

class CompiledView extends IView {
	constructor(controllerContext, compileResult){ // ViewCompileResult
		super();
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'	
		this.controllerContext = controllerContext;
		this.compileResult = compileResult;
	}
	createViewLayoutPage(){ // ViewLayoutPage
		var inherits = this.inherits; // a function which returns a type/class
		if(inherits){
			inherits = inherits();
			if(!inherits.isSubclassOf(ViewLayoutPage)) throw new Error("The inherits type must be ViewLayoutPage or subclass of ViewLayoutPage.");
		} else {
			inherits = ViewLayoutPage;
		}
		var page = new inherits(this.content), layout = this.layout, sections = this.sections;
		if(layout) throw new Error("Can not set layout.");
		if(sections) this.defineSections(page, sections);
		return page;
	}
	createViewPage(){ // ViewPage
		var inherits = this.inherits; // a function which returns a type/class
		if(inherits){
			inherits = inherits();
			if(!inherits.isSubclassOf(ViewPage)) throw new Error("The inherits type must be ViewPage or subclass of ViewPage.");
		} else {
			inherits = ViewPage;
		}
		var page = new inherits(this.content), layout = this.layout, sections = this.sections;
		if(layout) page.layout = layout.apply(page);
		if(sections) this.defineSections(page, sections);
		return page;
	}
	defineSections(page, sections) {
		if(!sections) return;
		for(var i = 0, length = sections.length, section; i < length; i++){
			section = sections[i];
			page.defineSection(section.name, section.content);
		}
	}
	/**
	 * Render the view into writer.
	 * @param {ViewContext} context ViewContext : The view context for the view to render.
	 * @param {TextWriter} writer TextWriter : The text writer for the view to render.
	 */
	render(context, writer){
		var page = this.createViewPage();
		page.viewContext = context;
		page.executePageHierarchy();
	}
	get controllerContext(){
		return this[_private].controllerContext;
	}	
	set controllerContext(value){
		this[_private].controllerContext = value;
	}
	get compileResult(){
		return this[_private].compileResult;
	}	
	set compileResult(value){
		this[_private].compileResult = value;
	}
	get inherits() {
		var value = this[_private].inherits;
		if(value != null) return value 
		return this[_private].compileResult.inherits;
	}
	set inherits(value){
		this[_private].inherits = value;
	}
	get layout() {
		var value = this[_private].layout;
		if(value != null) return value 
		return this[_private].compileResult.layout;
	}
	set layout(value){
		this[_private].layout = value;
	}
	get content(){
		var value = this[_private].content;
		if(value != null) return value 
		return this[_private].compileResult.content;
	}	
	set content(value){
		this[_private].content = value;
	}
	get sections(){
		var value = this[_private].sections;
		if(value != null) return value 
		return this[_private].compileResult.sections;
	}	
	set sections(value){
		this[_private].sections = value;
	}
}


//_viewEngines.add(new JHtmlFileViewEngine());


exports.ViewCompileResult = ViewCompileResult;
exports.ViewCompileSection = ViewCompileSection;
exports.CompiledView = CompiledView;
exports.ViewBuilder = ViewBuilder;
exports.ViewContext = ViewContext;
exports.ViewData = ViewData;
exports.ViewPage = ViewPage;
exports.VirtualFileViewEngine = VirtualFileViewEngine

exports.ViewEngines = _viewEngines;
