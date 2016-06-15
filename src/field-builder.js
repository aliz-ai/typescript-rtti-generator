function FieldBuilder() {
	var _name = '';
	var _type = '';
	var _tomb = false;

	this.build = function() {
		if (_name == '' || _type == '')
			return '';
		var rv = 'public static get ' + _name + '(){ return {name: "' +
			_name + '", type: ';

		if (_tomb) {
			rv += '"' + _type+'[]' + '"';
		} else {
			rv += '"' + _type + '"';
		}
		rv += '};}';
		return rv;
	}

	this.setName = function(name) {
		_name = name;
		return this;
	}

	this.setType = function(type) {
		_type = type;
		return this;
	}

	this.setArray = function() {
		_tomb = true;
		return this;
	}
}

module.exports = FieldBuilder;
