var ts = require('typescript');
const ReflectBuilder = require('./reflect-builder');
const FieldBuilder = require('./field-builder');
const TypeBuilder = require('./type-builder');
const MethodBuilder = require('./method-builder');

function RttiGenerator() {
	var rv = '';
	var log = false;

	var moduleName = '';
	var declarations = [];

	function getTypeAsString(type) {
		switch (type) {
			case ts.SyntaxKind.BooleanKeyword: // 120
				return 'boolean';
			case ts.SyntaxKind.NumberKeyword: // 128
				return 'number';
			case ts.SyntaxKind.StringKeyword: // 130
				return 'string';
			default:
				break;
		}
	}

	function processType(node) {
		var typeBuilder = new TypeBuilder();
		processTypeSubNode(node);
		if (node.typeArguments) {
			node.typeArguments.forEach(typeArgumentNode => {
				typeBuilder.addTypeArgument(processType(typeArgumentNode));
			});
		}
		return typeBuilder.build();
		function processTypeSubNode(node) {
			switch (node.kind) {
				case ts.SyntaxKind.TypeReference: // 152
					var name = node.typeName.text;
					typeBuilder.setName('object');
					if (!declarations[name] || declarations[name].kind == ts.SyntaxKind.InterfaceDeclaration) { // if there was no declaration found, we expect it to actually exist
						if (name !== 'Promise') {	// we exclude some built-in types
							typeBuilder.setReflect(name);
						} else {
							typeBuilder.setConstructor(name);
						}
					} else if (declarations[name].kind == ts.SyntaxKind.EnumDeclaration) {
						// there's no reflect generated for enums, but we import it from the reflected module
						typeBuilder.setEnum();
						typeBuilder.setConstructor(name);
					}
					break;
				case ts.SyntaxKind.AnyKeyword:
					typeBuilder.setName("object");
					break;
				case ts.SyntaxKind.BooleanKeyword: // 120
				case ts.SyntaxKind.NumberKeyword: // 128
				case ts.SyntaxKind.StringKeyword: // 130
					typeBuilder.setName(getTypeAsString(node.kind));
					break;
				case ts.SyntaxKind.ArrayType:  // 157
					typeBuilder.setArray();
					processTypeSubNode(node.elementType);
					break;
			}
		}
	}

	function processProperty(node) {
		var fieldBuilder = new FieldBuilder();
		fieldBuilder.setName(node.name.text);
		fieldBuilder.setTypeDesc(processType(node.type));
		return fieldBuilder.build();
	}

	function processMethod(node) {
		var methodBuilder = new MethodBuilder();
		methodBuilder.setName(node.name.text);
		methodBuilder.setReturnType(processType(node.type));
		node.parameters.forEach(parameterNode => {
			methodBuilder.addParameter(parameterNode.name.text, processType(parameterNode.type));
		});
		return methodBuilder.build();
	}

	function InterfaceProcessor() {
		var reflectBuilder = new ReflectBuilder();
		this.process = function (node) {
			processNode(node);
			return reflectBuilder.build();

			function processNode(node) {
				switch (node.kind) {
					case ts.SyntaxKind.Identifier: // 69
						if (node.parent.kind == ts.SyntaxKind.InterfaceDeclaration) {
							reflectBuilder.setTypeName(node.text);
						}
						break;
					case ts.SyntaxKind.PropertySignature: //141
						reflectBuilder.addField(processProperty(node));
						break;
					case ts.SyntaxKind.MethodSignature:
						reflectBuilder.addField(processMethod(node));
						break
				}
				ts.forEachChild(node, processNode);
			}
		}
	}

	this.process = function (inputString, fileName) {
		var sourceFile = ts.createSourceFile('', inputString, ts.ScriptTarget.ES6, true);
		preEnumerateTypes(sourceFile)

		rv += 'import {PropertyDescriptor, MethodDescriptor} from "typescript-rtti";\r\n';

		// import enums
		if (moduleName) {
			rv += 'import {' + moduleName + '} from \'./' + fileName + '\';\r\n';
			for (var name in declarations) {
				if (declarations[name].kind == ts.SyntaxKind.EnumDeclaration) {
					rv += 'import ' + name + ' = ' + moduleName + '.' + name + ';\r\n';
				}
			}
		}

		processNode(sourceFile);
		return rv;
	}

	function preEnumerateTypes(node) {
		if (node.kind == ts.SyntaxKind.InterfaceDeclaration || node.kind == ts.SyntaxKind.EnumDeclaration) {
			declarations[node.name.text] = { kind: node.kind };
		}
		if (node.kind == ts.SyntaxKind.ModuleDeclaration) {
			moduleName = node.name.text;
		}
		ts.forEachChild(node, preEnumerateTypes);
	}

	function processNode(node) {
		if (log) console.info(ts.SyntaxKind[node.kind]);
		switch (node.kind) {
			case ts.SyntaxKind.InterfaceDeclaration: //218
				interfaceProcessor = new InterfaceProcessor();
				if (rv != '') { rv += "\n"; }
				rv += interfaceProcessor.process(node);
				break;
		}
		if (node.kind != ts.SyntaxKind.InterfaceDeclaration) {
			ts.forEachChild(node, processNode);
		}
	}

	function report(node, message) {
		var { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
		console.info(sourceFile.fileName + ' (' + line + 1 + ',' + character + 1 + '): "' + message + '"');
	}

	this.enableLog = function () {
		log = true;
	}

	this.disableLog = function () {
		log = false;
	}
}
module.exports = RttiGenerator;
