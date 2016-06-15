function ReflectBuilder() {
	var _array = [];
	var _typeName = '';

	this.setTypeName = function (typeName) {
		_typeName = typeName + 'Reflect';
		return this;
	}

	this.addfield = function (field) {
		_array.push(field);
		return this;
	}

	this.build = function () {
		if (_typeName == '')
			return '';

		rv = 'export class ' + _typeName + "{\n\t";

		if (_array != null && _array.length > 0) {
			rv += _array.reduce((previousValue, currentValue) => {
				return previousValue + "\n\t" + currentValue;
			})
		}

		rv += "\n}";

		return rv;
	}
}

module.exports = ReflectBuilder;
