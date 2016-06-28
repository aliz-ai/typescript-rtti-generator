function FieldBuilder() {
	var descriptor = {
		name: '',
		type: '', // 'number', 'string', 'object'
		reflect: '', // the name of the object, in case of 'object'
		constructor: '', // a direct reference to the constructor, if it's a class or enum
		array: false,
		enum: false
	}

	this.build = function () {
		var properties = [];
		properties.push('name: "' + descriptor.name + '"');
		properties.push('type: "' + descriptor.type + '"');
		if (descriptor.reflect) {
			properties.push('reflect: ' + descriptor.reflect + 'Reflect');
		}
		if (descriptor.constructor) {
			properties.push('constructor: ' + descriptor.constructor);
		}
		if (descriptor.array) {
			properties.push('array: ' + descriptor.array);
		}
		if (descriptor.enum) {
			properties.push('enum: ' + descriptor.enum);
		}
		var result = 'public static get ' + descriptor.name + '(){ return {' + properties.join(', ') + '};}';
		return result;
	}

	this.setName = function (name) {
		descriptor.name = name;
		return this;
	}

	this.setType = function (type) {
		descriptor.type = type;
		return this;
	}

	this.setReflect = function (reflect) {
		descriptor.reflect = reflect;
		return this;
	}

	this.setArray = function () {
		descriptor.array = true;
		return this;
	}

	this.setEnum = function () {
		descriptor.enum = true;
		return this;
	}

	this.setConstructor = function (constructor) {
		descriptor.constructor = constructor;
		return this;
	}
}

module.exports = FieldBuilder;
