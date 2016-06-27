function ReflectBuilder() {
	var fields = [];
	var reflectClassName = '';

	this.setTypeName = function (typeName) {
		reflectClassName = typeName + 'Reflect';
		return this;
	}

	this.addField = function (field) {
		fields.push(field);
		return this;
	}

	this.build = function () {
		var result = 'export class ' + reflectClassName + '{\n\t';

		result += fields.join('\n\t');

		result += "\n}";

		return result;
	}
}

module.exports = ReflectBuilder;
