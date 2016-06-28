function FieldBuilder() {
	var descriptor = {
		name: '',
		typeDesc: ''
	}

	this.build = function () {
		var properties = [];
		properties.push('name: "' + descriptor.name + '"');
		properties.push('type: ' + descriptor.typeDesc);
		var result = 'public static get ' + descriptor.name + '(): PropertyDescriptor { return {' + properties.join(', ') + '};}';
		return result;
	}

	this.setName = function (name) {
		descriptor.name = name;
		return this;
	}

	this.setTypeDesc = function (typeDesc) {
		descriptor.typeDesc = typeDesc;
		return this;
	}
}

module.exports = FieldBuilder;
