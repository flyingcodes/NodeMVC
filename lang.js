
// lang

console.log('lang.js');

var _private = Symbol(); // the key for private member 

var prototype;

// Function

prototype = Function.prototype;

prototype.isSubclassOf = function(parent) {
	if(!(parent instanceof Function)) return false;
	var type = this.__proto__;
	while(type != null) {
		if(type == parent) return true;
		type = type.__proto__;
	}
	return false;
}

// [0].concat([1, 2, [3, 4]]) => [0, 1, 2, [3, 4]]
// Array.concats([0], [1, 2, [3, 4]]) => [0, 1, 2, 3, 4]
Array.concats = function() { // 
	var result = [];
	for(var i = 0, length = arguments.length, arg; i < length; i++){
		if(Array.is(arg = arguments[i])) {
			result = result.concat(...arg);
		} else {
			result = result.concat(arg);
		}
	}
	return result;
}

Array.contains = function(array, value){
	return array && array.indexOf(value) > -1;
}

Array.is = function (value) {
	return value != null && value instanceof Array; // [] instanceof Array is true
}

Array.likely = function (value) { // like array, array likely, not String and Function
	return value != null && typeof (value) != "string" && !(value instanceof String) // not String
    	&& typeof (value) != "function" && !(value instanceof Function) // not Function
      	&& (typeof (value = value.length) == "number" || value instanceof Number); // like a array            
}

// [0].pushs([1, 2]) => [0, [1, 2]]
// Array.pushs([0], [1, 2]) => [0, 1, 2]
Array.pushs = function(result) {
	if(!result) return result;
	for(var i = 1, length = arguments.length, arg; i < length; i++){
		if(Array.is(arg = arguments[i])) {
			result = result.push(...arg);
		} else {
			result = result.push(arg);
		}
	}
	return result;
}


class Char {	
}

Char.isDigit = function (value/* unicode of char */) {
	return value > 0x2f && value < 0x3a; // 0 : 48 0x30 , 9 : 57 0x39 
}

Char.isLower = function (value/* unicode of char */) {
	return value > 0x40 && value < 0x5b; // A : 65 0x41 , Z : 90 0x5a 
}

Char.isUpper = function (value/* unicode of char */) {
	return value > 0x60 && value < 0x7b; // a : 97 0x61 , z : 122 0x7a 
}

Char.isLetter = function (value/* unicode of char */) {
	return ((value > 0x40 && value < 0x5b) // A : 65 0x41 , Z : 90 0x5a 
        || (value > 0x60 && value < 0x7b)); // a : 97 0x61 , z : 122 0x7a 
}

/*
Conformance : 3.9 Special Character Properties (http://unicode.org/book/ch03.pdf)
0009    Horizontal tab
000a    Line feed
000c    Form feed
000d    Carriage return
0020    Space
00a0    No-break space
2000    En quad
2002    En space
2003    Em space
2004    Three-per-em space
2005    Four-per-em space
2006    Six-per-em space
2007    Figure space
2008    Punctuation space
2009    Thin space
200a    Hair space
200b    Zero width space
2028    Line separator
2029    Paragraph separator
202f    Narrow no-break space
feff    Zero width no-break space
*/
Char.isWhiteSpace = function (value/* unicode of char */) {
	return ((0x0008 < value && value < 0x00e) || (0x2001 < value && value < 0x200c)
        || (value == 0x0020 || value == 0x00a0 || value == 0x2028 || value == 0x2029 || value == 0x202f || value == 0xfeff));
}


Date.format = function (value, format) {
	if (value == null) return "";
	if (isNaN(value)) return "NaN";
	if (format == null || format.length == 0) return value.toString();
	return value.toString();
}

Date.is = function (value) {
	return value != null && value instanceof Date;
}


Function.is = function (value) {
	return value != null && (typeof (value) == "function" || value instanceof Function);
}

		
Number.format = function (value, format) {
   	if (value == null || isNaN(value)) return "";
	if (format == null || format.length == 0) return value.toString();
	if (format == ".") return value.toString() + ".0"; 
	var findFormatChar = Number.formatFindFormatChar;
	var negative = value < 0;
	if (negative) value = -value;
	value = value.toString();
	var index, vleft, vright, fleft, fright, digits, dleft, dright, result, rleft, rright; // left or right of dot, for value, format, digits and result
	if ((index = value.indexOf(".")) < 0) {
		vleft = value;
		vright = "";
	} else {
		vleft = value.substr(0, index);
		vright = value.substr(index + 1);
	}
	if ((index = format.indexOf(".")) < 0) {
		fleft = format;
		fright = "";
	} else {
		fleft = format.substr(0, index);
		fright = format.substr(index + 1);
	}
	var digitFormats = ['0', '#']; // digit format chars
	// process left of dot
	digits = 0;
	rleft = "";
	for (var thousand = false, i = fleft.length, max = vleft.length - 1, ch; i-- > 0;) {
		if (i > 0 && fleft.charAt(i - 1) == "\\") { // is "\\c"
			rleft = fleft.charAt(i--) + rleft;
			continue;
		}
		switch (ch = fleft.charAt(i)) {
			case "0":
				if (thousand && digits && digits % 3 == 0) rleft = "," + rleft;
				if (digits <= max) ch = vleft.charAt(max - digits);
				rleft = ch + rleft;
				digits++;
				break;
			case "#":
				if (digits > max) break;
				if (max == 0 && vleft == '0') break; // "#" for 0 return ''
				if (i != 0 && findFormatChar(fleft, digitFormats, 0, i) > -1) {
					if (thousand && digits && digits % 3 == 0) rleft = "," + rleft;
					ch = vleft.charAt(max - digits);
					rleft = ch + rleft;
					digits++;
					break;
				}
				// first char
				var str = vleft.substr(0, max - digits + 1);
				if (!thousand) {
					rleft = str + rleft;
					digits += str.length;
					break;
				}
				for (var k = str.length; k-- > 0;) {
					if (thousand && digits && digits % 3 == 0) rleft = "," + rleft;
					rleft = str.charAt(k) + rleft;
					digits++;
				}
				break;
			case ",":
				if(thousand) rleft = ch + rleft; else thousand = true;
				break;
			default:
				rleft = ch + rleft;
				break;
		}
	}
	dleft = digits;
	// process right of dot
	digits = 0;
	rright = "";
	for (var thousand = false, i = 0, len = fright.length, max = vright.length - 1, ch; i < len;) {
		switch (ch = fright.charAt(i++)) {
			case "0":
				if (thousand && digits % 3 == 0) rright = rright + ",";
				if (digits <= max) ch = vright.charAt(digits);
				if (digits >= max || ch == '9' || findFormatChar(fright, digitFormats, i, len) > -1) {
					rright = rright + ch;
					digits++;
					break;
				}
				// last char, and value has more digits
				var ch2 = vright.charCodeAt(digits + 1);
				if (ch2 > 0x34 && ch2 < 0x3a) { // 0=0x30, 9=0x39 
					ch = String.fromCharCode(ch.charCodeAt(0) + 1); // previous +1
				}
				rright = rright + ch;
				digits++;
				break;
			case "#":
				if (digits > max) break;
				if (thousand && digits % 3 == 0) rright = rright + ",";
				ch = vright.charAt(digits);
				if (digits == max || ch == '9' || findFormatChar(fright, digitFormats, i, len) > -1) {
					rright = rright + ch;
					digits++;
					break;
				}
				// last char, and value has more digits
				var ch2 = vright.charCodeAt(digits + 1);
				if (ch2 > 0x34 && ch2 < 0x3a) { // 0=0x30, 9=0x39 
					ch = String.fromCharCode(ch.charCodeAt(0) + 1); // previous +1
				}
				rright = rright + ch;
				digits++;
				break;
			case ",":
				if(thousand) rright = rright + ch; else thousand = true;
				break;
			case "\\":
				if(i < len) rright = rright + fright.charAt(i++); else rright = rright + ch;
				break;
			default:
				rright = rright + ch;
				break;
		}
	}
	dright = digits;
	if (rright.length == 0) return rleft;
	return dright ? (rleft + "." + rright) : (rleft + rright);
}

Number.formatFindFormatChar = function (format, chars, start, end) {
	var length = chars.length;
	while(start < end) {
		var ch = format.charAt(start++);
		if(ch == "\\") {
			start++;
			continue;
		}
		for(var i = 0; i < length; i++) {
			if(chars[i] == ch) return start - 1;
		}
	}
	return -1;
}

Number.is = function(value){
	return value != null && (typeof (value) == "number" || value instanceof Number);
}

// 转换字符串中的特殊字符以方便再次使用
/*
\b    Backspace 
\f    Form feed 
\n    Line feed (newline) 
\r    Carriage return 
\t    Horizontal tab (Ctrl-I) 
\'    Single quotation mark 
\"    Double quotation mark 
\\    Backslash 
\v
*/
String.escape = function (value) {
	if (!String.is(value) || !value) return value;
	
	var result = "", index = 0, length = value.length, start = 0, count = 0, ch, vl;
	while (index < length) {
	    ch = value.charAt(index++);
	    // "\b", "\f", "\n", "\r", "\t", "\'", "\"", "\\", "\v"
	    vl = "";
	    switch (ch) {
	        case '\b': vl = "\\b"; break;
	        case '\f': vl = "\\f"; break;
	        case '\n': vl = "\\n"; break;
	        case '\r': vl = "\\r"; break;
	        case '\t': vl = "\\t"; break;
	        case '\'': vl = "\\\'"; break;
	        case '\"': vl = "\\\""; break;
	        case '\\': vl = "\\\\"; break;
	        case '\v': vl = "\\v"; break;
	        default: count++; continue;
	    }

	    if (count > 0) result += value.substr(start, count);
	    start = index;
	    count = 0;
	    result += vl;
	}
	if (count > 0) result += value.substr(start, count);

    return result;
}

String.format = function (format, arg) { // (format, arg0, ...), care of arg has length property
	var result = '', isDate = Date.is, isFunction = Function.is, isNumber = Number.is,
		formatNumber = Number.format, formatDate = Date.format;
	if (!format) return result;
	var args = arguments, argStartIndex = 1;
	if (arguments.length == 2 && Array.likely(arg) && !String.is(arg)) {
		args = arg, argStartIndex = 0;
	}
	for (var i = 0; ;) {
		var open = format.indexOf('{', i);
		var close = format.indexOf('}', i);
		if ((open < 0) && (close < 0)) {
			result += format.slice(i);
			break;
		}
		if ((close > 0) && ((close < open) || (open < 0))) {
			if (format.charAt(close + 1) !== '}') {
				throw new Error('The format string contains an unmatched opening or closing brace.');
			}
			result += format.slice(i, close + 1);
			i = close + 2;
			continue;
		}
		result += format.slice(i, open);
		i = open + 1;
		if (format.charAt(i) === '{') {
			result += '{';
			i++;
			continue;
		}
		if (close < 0) throw new Error('The format string contains an unmatched opening or closing brace.');
		var brace = format.substring(i, close);
		var colonIndex = brace.indexOf(':');
		var argNumber = parseInt((colonIndex < 0) ? brace : brace.substring(0, colonIndex), 10) + argStartIndex;
		if (isNaN(argNumber)) throw new Error('The format string is invalid.');
		var argFormat = (colonIndex < 0) ? '' : brace.substring(colonIndex + 1);
		var argv = args[argNumber];
		i = close + 1;
		if (argv == null) continue;
		if (isFunction(argv.format)) result += argv.format(argFormat); else {
			if (isNumber(argv)) result += formatNumber(argv, argFormat);
			else if (isDate(argv)) result += formatDate(argv, argFormat);
			else result += argv.toString();
		}
	}
	return result;
}

String.is = function (value) {
	return value != null && (typeof (value) == "string" || value instanceof String);
}

String.left = function(value, length) {
	if(!value) return value;
	if(length >= 0) return value.substring(0, length);
	length = value.length + length;
	return length > 0 ? value.substring(0, length) : '';
}


global.Char = Char;
