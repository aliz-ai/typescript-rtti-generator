function FieldBuilder() {
	var descriptor = {
		name: '',
		type: '', // 'number', 'string', 'object'
		objectType: '', // the name of the object, in case of 'object'
		array: false
	}

	this.build = function () {
		var properties = [];
		properties.push('name: "' + descriptor.name + '"');
		properties.push('type: "' + descriptor.type + '"');
		if (descriptor.objectType) {
			properties.push('objectType: ' + descriptor.objectType + 'Reflect');
		}
		if (descriptor.array) {
			properties.push('array: ' + descriptor.array);
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

	this.setObjectType = function (objectType) {
		descriptor.objectType = objectType;
		return this;
	}

	this.setArray = function () {
		descriptor.array = true;
		return this;
	}
}

module.exports = FieldBuilder;
