function MethodBuilder() {
	var descriptor = {
		name: '',
		returnType: '',
		parameters: []
	}

	this.build = function () {
		var properties = [];
		properties.push('name: "' + descriptor.name + '"');
		properties.push('returnType: ' + descriptor.returnType);
		properties.push('parameters: [' + descriptor.parameters.join(', ') + ']');
		var result = 'public static get ' + descriptor.name + '(): MethodDescriptor { return {' + properties.join(', ') + '};}';
		return result;
	}

	this.setName = function (name) {
		descriptor.name = name;
		return this;
	}

	this.setReturnType = function (returnType) {
		descriptor.returnType = returnType;
		return this;
	}

	this.addParameter = function (name, type) {
		descriptor.parameters.push('{name: "' + name + '", type: ' + type + '}');
		return this;
	}
}

module.exports = MethodBuilder;
