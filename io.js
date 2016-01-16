
// io

var _fs = require('fs');
var _path = require('path');

var _private = Symbol(); // the key for private member 


class File {

}

File.exists = function(path) {
	return _fs.existsSync(path);
}

File.existsAsync = function*(path) {
	return yield function(returns) {
		_fs.exists(path, function(exists){
			returns(null, exists);
		});
	}
}

File.readBuffer = function(path) {
	return _fs.readFileSync(path, {flag:'r'});
}

File.readBufferAsync = function*(path) {
	return yield function(returns) { 
		_fs.readFile(path, {flag:'r'}, function(ex, data) {
			returns(ex, data);
		});
	}
}

File.readContent = function(path, encoding) { // (path)
	return _fs.readFileSync(path, encoding == null ? 'utf-8' : encoding.toString());
}

File.readContentAsync = function*(path, encoding) { // (path)
	return yield function(returns) { 
		_fs.readFile(path, encoding == null ? 'utf-8' : encoding.toString(), function(ex, data) {
			returns(ex, data);
		});
	}
}

class Path {
	
}

/**
 * The separator of path in several paths.
 */
Path.delimiter = _path.delimiter;

/**
 * The separator of directory in the path.
 */
Path.separator = _path.sep;

class TextWriter {
	constructor(){
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'	
	}
	write(value){		
	}
	writeLine(...args){
		this.write(...args);
		this.write(this.newLine);	
	}
	get encoding(){
		return this[_private].encoding;
	}
	get newLine(){
		return this[_private].newLine;
	}
}

class StringWriter {
	constructor(){
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'
		this[_private].buffer = '';	
	}
	write(value){
		var buffer = this[_private].buffer;
		this[_private].buffer = buffer + value;		
	}
	toString(){
		return this[_private].buffer;
	}
}


exports.File = File;
exports.Path = Path;
exports.StringWriter = StringWriter;