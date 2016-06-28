var ts = require('typescript');
const ReflectBuilder = require('./reflect-builder');
const FieldBuilder = require('./field-builder');
const TypeBuilder = require('./type-builder');

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

	function processProperty(node) {
		var typeBuilder = new TypeBuilder();
		var fieldBuilder = new FieldBuilder();
		processPropertyNode(node);
		fieldBuilder.setTypeDesc(typeBuilder.build());
		return fieldBuilder.build();

		function processPropertyNode(node) {
			switch (node.kind) {
				case ts.SyntaxKind.Identifier: // 69
					if (node.parent.kind === ts.SyntaxKind.TypeReference) { // 152
						var name = node.text;
						typeBuilder.setName('object');
						if (!declarations[name] || declarations[name].kind == ts.SyntaxKind.InterfaceDeclaration) { // if there was no declaration found, we expect it to actually exist
							typeBuilder.setReflect(node.text);
						} else if (declarations[name].kind == ts.SyntaxKind.EnumDeclaration) {
							// there's no reflect generated for enums, but we import it from the reflected module
							typeBuilder.setEnum();
							typeBuilder.setConstructor(name);
						}
					} else {
						fieldBuilder.setName(node.text);
					}
					break;
				case ts.SyntaxKind.BooleanKeyword: // 120
				case ts.SyntaxKind.NumberKeyword: // 128
				case ts.SyntaxKind.StringKeyword: // 130
					typeBuilder.setName(getTypeAsString(node.kind));
					break;
				case ts.SyntaxKind.ArrayType:  // 157
					typeBuilder.setArray();
					break;
			}
			if (node.kind != ts.SyntaxKind.MethodSignature) {
				ts.forEachChild(node, processPropertyNode);
			}
		}
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
				}
				if (node.kind != ts.SyntaxKind.MethodSignature) {
					ts.forEachChild(node, processNode);
				}
			}
		}
	}

	this.process = function (inputString, fileName) {
		var sourceFile = ts.createSourceFile('', inputString, ts.ScriptTarget.ES6, true);
		preEnumerateTypes(sourceFile)

		rv += 'import {PropertyDescriptor} from "typescript-rtti";\r\n';

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
