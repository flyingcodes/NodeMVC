
// jhtml

var _view = require('./view');

var _private = Symbol(); // the key for private member 


var JHtmlCompiler = function(options) {
	
	var _options = options || {}, _output = _options.output; 
	
	var _content, _length, _index, _maxIndex, _level, _incode, _intag, _tags, _tokens, _codes;
	
	
	var _PLAIN_TEXT = 0, _SINGLE_LINE_COMMENT = 1, _MULTILINE_COMMENT = 2, _EXECUTE_BLOCK = 3, _OUTPUT_BLOCK = 4, 
		_BINDING_CODE = 5, _DIRECTIVE_IF = 6, _DIRECTIVE_FOR = 7, _DIRECTIVE_WHILE = 8;
	
	var _CODE_WELL_END_CHAR = '\n'; // end code with '\n' or ';'
	var _DIRECTIVE_NAME_MAX = 16, _DIRECTIVE_LETTER_MIN = 0x61, _DIRECTIVE_LETTER_MAX = 0x7a; // a-z : 0x61-0x7a
	var _ALL_DIRECTIVE_NAMES = ["if", "for", "while"];
	var _COMPILE_CODE_JOINER = '\n'; // codes joiner while compile
	var _stringEscape = String.escape, _isWhiteSpace = Char.isWhiteSpace, _arrayContains = Array.contains, _arrayPushs = Array.pushs;
	
	var _token = function(type, code) {
		// 0 = Plain Text
		// 1 = Single Line Comment
		// 2 = Multiline Comment
		// 3 = Execute Block
		// 4 = Output Block
		// 5 = Binding Code
		// 6 = Directive If
		// 7 = Directive For
		// 8 = Directive While 
		return {type: type, code: code};
	}

    var _readEscape = function(){
		// \b    Backspace 
		// \f    Form feed 
		// \n    Line feed (newline) 
		// \r    Carriage return 
		// \t    Horizontal tab (Ctrl-I) 
		// \'    Single quotation mark 
		// \"    Double quotation mark 
		// \\    Backslash 
		// \v
		// \uxxxx
		
		if (_index > _maxIndex) throw new Error("Char is missed.");
		
		var ch = _content[_index++];
		switch (ch)
		{
			case 'b':
				return '\b';
			case 'f':
				return '\f';
			case 'n':
				return '\n';
			case 'r':
				return '\r';
			case 't':
				return '\t';
			case 'v':
				return '\v';
			case '\'':
			case '\"':
			case '\\':
				return ch;
			case 'u':
				ch = parseInt(_content.substring(_index, 4), 16);
				_index += 4;
				return String.fromCharCode(ch);
			default:
				//throw new InvalidOperationException("Invalid escape char.");
				return ch;
		}
   	}
			
	var _skipWhiteSpaces = function(endChar){
		var index = _index;
		while(index < _length && _isWhiteSpace(_content.charCodeAt(index))) {
			index++;
		}
		if(endChar != null && _content[index] != endChar) throw new Error('The end character \"' + endChar + '\" is expected.');
		_index = endChar == null ? index : (index + 1);
	}
	
	var _skipString = function(single) {
		var quotation = single ? '\'' : '\"', skipQuotation = single ? '\"' : '\'';
        while (_length > _index)
        {
			var ch = _content[_index++];
			if (ch == skipQuotation) continue;
			if (ch == '\\') _readEscape();
			if (ch != quotation) continue;
	
			// string end
			return; // current index is after quotation
		}
		throw new Error("The quotation \"" + quotation + "\" is expected.");	
	}
	
	var _skipText = function(end) {
		var index = _content.indexOf(end, _index);
		if(index < 0) {
			if(end != '\n') throw new Error('The end text \"' + end + '\" is expected.');
			_index = _length;
		} else {
			_index = index + end.length;
		}
	}

	var _readPlainText = function() {
		var start = _index, index = _content.indexOf('@', start);
		if(index < 0) {			
			_index = index = _length;
		} else {
			_index = index;
		}
		return _content.substring(start, index);
	}
	
	var _readTextBlock = function(end) {
		var start = _index, index = _content.indexOf(end, start);
		if(index < 0) {
			if(end != '\n') throw new Error('The end text \"' + end + '\" is expected.');
			_index = index = _length;
		} else {
			_index = index + end.length;
		}
		return _content.substring(start, index);
	}
	
	var _readCodeBlock = function(startChar, endChar) {
		var start = _index, matched = 0, ch;
		// start character is read
		while(_index < _length) {
			ch = _content[_index++];
			switch(ch) {
				case '/': if((ch = _content[_index++]) == '/' || ch == '*') _skipText(ch == '*' ? '*/' : '\n'); continue;
				case '\'': _skipString(true); continue;
				case '\"': _skipString(false); continue;
				case startChar: matched++; continue;
			}
			if(ch == endChar && matched-- == 0) break;
		}
		if(ch != endChar) throw new Error('The end character \'' + endChar + '\' is expected.');
		return _content.substring(start, _index - 1);
	}
	
	var _checkCodeWellEnd = function(code){
		if(_COMPILE_CODE_JOINER) return true; // always return true if join codes with '\n' or ';'
		if(!code) return true;
		var length = code.length, ch;
		while(length--){
			ch = code.charCodeAt(length);
			// ; : 0x3b
			if(ch == 10 || ch == 13 || ch == 0x3b) return true;
			if(!_isWhiteSpace(ch)) break;
		}
		return false;
	}
			
	var _readExecuteBlock = function() {
		// current index is after {
		var code = _readCodeBlock('{', '}');
		if(!_checkCodeWellEnd(code)) code += _CODE_WELL_END_CHAR;
		return code;
	}
	
	var _readDirective = function(skip) {		
		var start = _index, index = start, length = start + _DIRECTIVE_NAME_MAX, ch;
		if(length > _length) length = _length;
		if(index >= length) return '';
		while(index < length) {
			ch = _content.charCodeAt(index++);
			if(ch < _DIRECTIVE_LETTER_MIN || ch > _DIRECTIVE_LETTER_MAX) break;
		}
		index--;
		if(skip) _index = index;
		return _content.substring(start, index);
	}
	
	var _openHtmlTag = function(tag){
		if(tag) _tags.push(tag.toLowerCase());
	}
	
	/**
	 * Close html tag.
	 * @returns {Boolean} Boolean : All of tags are closed if true.
	 */
	var _closeHtmlTag = function(tag){
		if(!tag) return !_tags.length;
		tag = tag.toLowerCase();
		var length = _tags.length;
		while(length--){
			if(_tags[length] == tag){
				return !(_tags.length = length);
			}
		}
		return !_tags.length;
	}
	
	var _readHtmlTag = function(end){
		if(_index >= _maxIndex) return '';
		var start = _index, ch;
		if(end && _content[_index] == '/') _index++;
		// starts with letter(a-z, A-Z), underline(_), dollar sign($)
		// A-Z : 0x41-0x5a
		// a-z : 0x61-0x7a		
		while(_index < _length) {
			ch = _content.charCodeAt(_index);
			if(!( (ch > 0x60 && ch < 0x7b) || (ch > 0x40 && ch < 0x5b) )) break;
			_index++;
		}
		// / : 0x2f
		// > : 0x3e
		if(ch != 0x2f && ch != 0x3e && !_isWhiteSpace(ch)) _index = start;
		return _content.substring(start, _index);	
	}
	
	var _canReadHtmlTag = function(end){
		var start = _index;
		if(!_readHtmlTag(end)) return false;
		_index = start;
		return true;		
	}
	
	var _skipHtmlString = function(single) {
		var quotation = single ? '\'' : '\"', skipQuotation = single ? '\"' : '\'';
        var index = _index;
        while (_length > _index)
        {
			var ch = _content[_index++];
			if (ch == skipQuotation) continue;
			if (ch != quotation) continue;
	
			// string end
			return; // current index is after quotation
		}
		throw new Error("The quotation \"" + quotation + "\" is expected.");	
	}
	
	var _readHtmlAttribute = function(){
		var start = _index, ch, name;

		ch = _content.charCodeAt(_index++);
		// " : 0x22
		// ' : 0x27
		if(ch == 0x22 || ch == 0x27) return {name: _readTextBlock(ch == 0x22 ? '\"' : '\'')};
		// = : 0x3d	
		while(ch != 0x3d && !_isWhiteSpace(ch) && _index < _length) {
			ch = _content.charCodeAt(_index++);
		}
		name = _content.substring(start, _index);
		if(ch != 0x3d) return {name: name}; // only name
		name = String.left(name, -1);
		
		start = _index;
		ch = _content.charCodeAt(_index++);
		// " : 0x22
		// ' : 0x27
		if(ch == 0x22 || ch == 0x27) return {name: name, value: _readTextBlock(ch == 0x22 ? '\"' : '\'')};
		
		while(!_isWhiteSpace(ch) && _index < _length) {
			ch = _content.charCodeAt(_index++);
		}
		return {name: name, value: _content.substring(start, _index)};
	}
		
	var _canReadHtml = function() { // return true if can read html
		var start = _index, index = start, ch, result = false;
		// start character is read
		_readHtmlTag();
		if(_index == start) return false;
		_skipWhiteSpaces();
		index = _index;
		if(index < _length) {
			ch = _content[index++];
			if(index < _length) {
				if(ch == '>' || (ch == '/' && _content[index] == '>')) { // <tag > or <tag />
					result = true;
				} else {
					var attr = _readHtmlAttribute(), name = attr.name, value = attr.value;
					if(name){
						_index = start;
						if(name[0] == '@' || value) result = true;
					}
				}
			}
		}
		_index = start;
		return result;
	}
	
	var _readDirectiveCode = function(level) {
		var start = _index, ch, code, checkEnd;
		// start character is read
		while(_index < _length) {
			ch = _content[_index++];
			switch(ch) {
				case '/': if((ch = _content[_index++]) == '/' || ch == '*') _skipText(ch == '*' ? '*/' : '\n'); continue;
				case '\'': _skipString(true); continue;
				case '\"': _skipString(false); continue;
				case '{': _level++; continue;
				case '}': 
					if(--_level != level) continue; // continue if not begin level
					break;
				case '<': 
					if(!_canReadHtml()) continue; // continue if can not read html 
					_incode = false, _intag = true; // current index is < in '<tag...'
					_index--; // skip the <
					checkEnd = true; // check the code is end in well format
					break;
				default: continue;
			}			
			break; // break while if can read html 
		}
		code = _content.substring(start, _index);
		if(checkEnd && !_checkCodeWellEnd(code)) code += _CODE_WELL_END_CHAR;
		return _token(_EXECUTE_BLOCK, code);
	}
	
	var _readDirectiveHtml = function(){
		var start = _index, ch;
		// start character is read
		while(_index < _length) {
			ch = _content[_index++];
			switch(ch) {				
				case '@': 
					_index--;
					if(_index == start) return _readToken(); // @ is first
					break;
				case '<': 
					if(_intag || !_canReadHtmlTag(true)) continue; // continue if in tag or can not read tag 
					_intag = true; // current index is < in '<tag...'
					_index--;
					if(start == _index) { // < is first
					 	return _readDirectiveHtmlTag(); 
					}
					break;
				default:
					continue;
			}
			break; // break while if can read html 
		}
		return _token(_PLAIN_TEXT, _content.substring(start, _index));
	}
	
	var _readDirectiveHtmlTag = function(){
		var start = _index, ch, tokens = [], isclose = false, quotation;
		if(_index < _length && _content[_index] == '<') { // for <...
			_index++;
			if(_content[_index] == '/') { // for </...
				_index++; // skip this /
				isclose = true;
			}
			_intag = _readHtmlTag();
			if(!isclose) _openHtmlTag(_intag);
		} else {
			throw new Error("The start character '<' is expected.");
		}
		// start character is read
		while(_index < _length) {
			ch = _content[_index++];
			switch(ch) {
				case '@': 
					_index--; 
					if(_index > start) tokens.push(_token(_PLAIN_TEXT, _content.substring(start, _index))); // @ is not first
					_arrayPushs(tokens, _readToken());
					start = _index;
					continue;				
				case '\'': 
				case '\"':
					if(quotation && ch != quotation) continue;
				 	quotation = quotation ? null : ch; 
					continue;
				case '/': 
					if(isclose || _index >= _length || _content[_index] != '>') continue; // continue if not />
					if(_closeHtmlTag(_intag)) _incode = true; // is self close tag and all are closed 
					break;
				case '>': 
					if(isclose && _closeHtmlTag(_intag)) _incode = true; // is self close tag and all are closed 
					break; // tag is end
				default:
					continue;
			}
			_intag = null; // current index is after > in '<tag...>'
			break; // break while if can read html 
		}
		return _token(_PLAIN_TEXT, _content.substring(start, _index));
	}
	
	var _readDirectiveHtmlRange = function(end){
		if(!end) throw new Error("The end of range can not be null or empty.");
		var start = _index, ch, tokens = [], endLength = end.length, first = end[0], isend;
		// start character is read
		while(_index < _length) {
			ch = _content[_index++];
			switch(ch) {
				case '@': 
					_index--; 
					if(_index > start) tokens.push(_token(_PLAIN_TEXT, _content.substring(start, _index))); // @ is not first
					_arrayPushs(tokens, _readToken());
					start = _index;
					continue;	
				case first:
					if(_content.substr(_index - 1, endLength) != end) continue; 
					isend = true;
			}
			break; // break while if can read html 
		}
		if(!isend) throw new Error("The end of range \"" + end + "\". is expected.");
		tokens.push(_token(_PLAIN_TEXT, _content.substring(start, _index)));
		return tokens;
	}
	
	var _readDirectiveBlock = function(name, follow){
		if(name == null) throw new Error("The directive name can not be null.");
		if(_incode) throw new Error("The directive can not be declared in code.");
		if(_intag != null) throw new Error("The directive can not be declared in html tag.");
		var start = _index, index = start + name.length;
		if(_content.substring(start, index) != name) throw new Error("The directive name \"" + name + "\" is expected.");
		_index = index; // skip directive name
		_skipWhiteSpaces('(');
		_readCodeBlock('(', ')');
		_skipWhiteSpaces('{');
		return _readDirectiveBlockBody(start, follow);
	}
	
	var _readDirectiveBlockBody = function(start, follow){
		var level = _level++, incode = _incode, intag = _intag, tags = _tags, token, tokens = [_token(_EXECUTE_BLOCK, _content.substring(start, _index))];
		_incode = true, _intag = null, _tags = [];
		while(level < _level) {
			if(_incode){
				token = _readDirectiveCode(level);
			} else if(_intag) {
				token = _readDirectiveHtmlTag();
			} else {
				token = _readDirectiveHtml();
			}
			_arrayPushs(tokens, token);
		}
		token = null;
		if(follow && _incode) {
			start = _index;
			_skipWhiteSpaces();
			name = _readDirective(true);
			if(name == follow){
				_skipWhiteSpaces();
				if(_content[_index] == '{') { // for "else {"
					_index++; // skip {
					token = _readDirectiveBlockBody(start, follow);
				} else {
					name = _readDirective();
					if(_arrayContains(_ALL_DIRECTIVE_NAMES, name)) { // is valid directive
						_incode = false;
						token = _readDirectiveBlock(name, follow);
						_arrayPushs(tokens, _token(_EXECUTE_BLOCK, follow + ' ')); // 'else ' in } else if ... {
					}
				}
			}
			if(!token) _index = start;
		}
		_incode = incode, _intag = intag, _tags = tags;
		if(token) _arrayPushs(tokens, token);
		return tokens;
	}
	
	
	var _readDirectiveIf = function() { // @if () { ... } else if () { ... } else {}
		return _readDirectiveBlock("if", "else");
	}
	var _readDirectiveFor = function() { // @for () { ... }
		return _readDirectiveBlock("for");
	}
	var _readDirectiveWhile = function() { // @while () { ... }
		return _readDirectiveBlock("while");
	}
	
	
	var _readIdentifier = function(){
		if(_index >= _maxIndex) return '';
		// starts with letter(a-z, A-Z), underline(_), dollar sign($)
		// following letter(a-z, A-Z), digit (0-9), underline(_), dollar sign($)
		var start = _index, index = start, ch = _content.charCodeAt(index);
		// 0-9 : 0x30-0x39
		// A-Z : 0x41-0x5a
		// a-z : 0x61-0x7a
		// $  : 0x24
		// _  : 0x5f		
		if(!( (ch > 0x60 && ch < 0x7b) || (ch > 0x40 && ch < 0x5b) || ch == 0x24 || ch == 0x5f )) return '';
		while(++index < _length) {
			ch = _content.charCodeAt(index);
			if(!( (ch > 0x60 && ch < 0x7b) || (ch > 0x40 && ch < 0x5b) || (ch > 0x2f && ch < 0x3a) || ch == 0x24 || ch == 0x5f )) break;
		}
		return _content.substring(start, _index = index);	
	}
	
	// @model.name
	// @mode.datas[0].age
	// @mode.getUrl(123)
	var _readBinding = function(){
		var start = _index, ch, endChar;
		while(true){
			if(!_readIdentifier()) throw new Error("The identifier is expected in binding code.");			
			ch = _content[_index++];
			if(ch == '.') continue;
			else if(ch == '[') endChar = ']';
			else if(ch == '(') endChar = ')'; 
			else {
				_index--; // not include current character
				break;
			}
			_readCodeBlock(ch, endChar);
			if(_content[_index] != '.') break;
			_index++; // skip current character, to next
		}
		return _content.substring(start, _index);
	}
	
	var _readToken = function() {
		var index = _index, first = _content[_index];
		if (first != '@') return _token(_PLAIN_TEXT, _readPlainText());
		if (_index++ == _maxIndex) return _token(0, '@'); // last character		
		var second = _content[_index++];
		switch(second){
			case '@': return _token(_PLAIN_TEXT, '@');
			case '{': return _token(_EXECUTE_BLOCK, _readExecuteBlock());
			case '(': return _token(_OUTPUT_BLOCK, _readCodeBlock('(', ')'));
			case '\/' : // @/^, @//, @/*
				switch(_content[_index++]) {
					case '^': return _token(_PLAIN_TEXT, _readTextBlock('^/@')); // @/^ ... ^/@
					case '/': return _token(_SINGLE_LINE_COMMENT, _readTextBlock('\n')); // @//
					case '*': return _token(_MULTILINE_COMMENT, _readTextBlock('*/@')); // @/* ... */@
				}
				throw new Error('Invalid character in token.');		
		}
		_index--;
		var directive = _readDirective();
		if(!directive) throw new Error('A directive or binding is expected.');
		switch(directive) {
			case 'if': return _readDirectiveIf();
			case 'for': return _readDirectiveFor();
			case 'while': return _readDirectiveWhile();
		}
		var binding = _readBinding();
		if(!binding) throw new Error('A binding is expected.');
		return _token(_BINDING_CODE, binding);
	}
	
	var _parseContent = function(content) {
		_content = content || '', _length = _content.length, _index = 0, _maxIndex = _length - 1, _level = 0, _incode = false, _intag = null, _tags = [], _tokens = [], _codes = null;
		while(_index < _length) {
			_arrayPushs(_tokens, _readToken());
		}
		return _tokens;
	}
	
	var _writeText = function(text) {
		if(!text) return;
		return _output + '(\"' + _stringEscape(text) + '\");';
	}
	var _writeOutput = function(exp) {
		return _output + '(' + exp + ');';
	}
	var _writeBinding = function(exp){
		return _output + '(' + exp + ');';
	}
	var _writeCode = function(code) {
		return code;
	}	
	var _compileTokens = function(tokens) {
		_codes = [];
		if(!tokens) return _codes;
		var length = tokens.length, index = -1, token, code;
		while(++index < length) {
			if(!(token = tokens[index])) continue;
			code = null;
			switch(token.type) {
				case _PLAIN_TEXT: code = _writeText(token.code); break;
				case _SINGLE_LINE_COMMENT: continue;
				case _MULTILINE_COMMENT: continue;
				case _EXECUTE_BLOCK: code = token.code; break;
				case _OUTPUT_BLOCK: code = _writeOutput(token.code); break;
				case _BINDING_CODE: code = _writeBinding(token.code); break;
				case _DIRECTIVE_IF: code = _writeCode(token.code); break;
				case _DIRECTIVE_FOR: code = _writeCode(token.code); break;
				case _DIRECTIVE_WHILE: code = _writeCode(token.code); break;
				default: throw new Error('Invalid token to compile.');
			}
			_codes.push(code);
		}
		return _codes;	
	}
	
	this.compile = function(content) {
		if (content == null) return null;
		var tokens = _parseContent(content);
		var codes = _compileTokens(tokens);
		return codes.join(_COMPILE_CODE_JOINER);
	}

}

var _jHtmlCompiler = new JHtmlCompiler({output: 'this.write'});

class JHtmlViewBuilder extends _view.ViewBuilder {
	constructor(){
		super();
	}
	compileContent(content){ // override it
		return _jHtmlCompiler.compile(content);
	}
}

var _jHtmlViewBuilder = new JHtmlViewBuilder();


class JHtmlCompiledView extends _view.CompiledView {
	constructor(controllerContext, viewContent){
		super(controllerContext, viewContent);
		if(!this[_private]) this[_private] = {}; // must be first in any constructor, but after at 'super()'	
	}
	createViewPage(){ // ViewPage
		var page = new _view.ViewPage(this.viewContent);
		return page;
	}
}

class JHtmlFileViewEngine extends _view.VirtualFileViewEngine {
	constructor(){
		super();
		this.filePathFormats = ['/{2}/{1}/{0}.html'];
	}
	/**
	 * Create the view instance.
	 * @param {ControllerContext} controllerContext ControllerContext : The context of controller to create view.
	 * @param {String} view String : The path of view to create.
	 * @param {String} layout String : The path of layout to create.
	 * @returns {IView} IView : The view instance is created.
	 */
	createView(controllerContext, view, layout){
		var body = _jHtmlViewBuilder.compile(this.getFullPath(controllerContext, view));
		return new JHtmlCompiledView(controllerContext, body);		
	}	
}



exports.JHtmlFileViewEngine = JHtmlFileViewEngine;