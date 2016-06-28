var ts = require('typescript');
const ReflectBuilder = require('./reflect-builder');
const FieldBuilder = require('./field-builder');

function RttiGenerator() {
	var rv = '';
	var log = false;

	var moduleName = '';
	var declarations = [];

	var fieldBuilder = new FieldBuilder();

	function InterfaceProcessor() {
		var fieldBuilderObj;
		var scope;
		this.process = function (node) {
			var reflectBuilder = new ReflectBuilder();
			var fieldBuilder = new FieldBuilder();
			processNode(node);
			return reflectBuilder.build();
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

			function processNode(node) {
				switch (node.kind) {
					case ts.SyntaxKind.Identifier: // 69
						if (scope == ts.SyntaxKind.PropertySignature) {  // 141
							if (node.parent.kind === ts.SyntaxKind.TypeReference) { // 152
								var name = node.text;
								fieldBuilder.setType('object');
								if (!declarations[name] || declarations[name].kind == ts.SyntaxKind.InterfaceDeclaration) { // if there was no declaration found, we expect it to actually exist
									fieldBuilder.setReflect(node.text);
								} else if (declarations[name].kind == ts.SyntaxKind.EnumDeclaration) {
									// there's no reflect generated for enums, but we import it from the reflected module
									fieldBuilder.setEnum();
									fieldBuilder.setConstructor(name);
								}
								reflectBuilder.addField(fieldBuilder.build());
							} else {
								fieldBuilder.setName(node.text);
							}
						} else if (node.parent.kind == ts.SyntaxKind.InterfaceDeclaration) {
							reflectBuilder.setTypeName(node.text);
						}
						break;
					case ts.SyntaxKind.BooleanKeyword: // 120
					case ts.SyntaxKind.NumberKeyword: // 128
					case ts.SyntaxKind.StringKeyword: // 130
						if (scope == ts.SyntaxKind.PropertySignature) {
							fieldBuilder.setType(getTypeAsString(node.kind));
							reflectBuilder.addField(fieldBuilder.build());
						}
						break;
					case ts.SyntaxKind.PropertySignature: //141
						scope = ts.SyntaxKind.PropertySignature;
						fieldBuilder = new FieldBuilder();
						break;
					case ts.SyntaxKind.ArrayType:  // 157
						fieldBuilder.setArray();
						break;
				}
				if (node.kind != ts.SyntaxKind.MethodSignature) {
					ts.forEachChild(node, processNode);
				}
			}
		}
	}

	function getActualScopeAsString() {
		switch (scope) {
			case ts.SyntaxKind.ModuleDeclaration:
				return "module";
			case ts.SyntaxKind.InterfaceDeclaration:
				return "interface";
			case ts.SyntaxKind.PropertySignature:
				return "property";
			default:
				break;
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
			case ts.SyntaxKind.ModuleDeclaration:  // 221
				scope = ts.SyntaxKind.ModuleDeclaration;
				break;
			case ts.SyntaxKind.Identifier: // 69
				if (log) report(node, node.text + ' ' + getActualScopeAsString() + ' is found');
				break;
			case ts.SyntaxKind.BooleanKeyword: // 120
			case ts.SyntaxKind.NumberKeyword: // 128
			case ts.SyntaxKind.StringKeyword: // 130
				break;
			case ts.SyntaxKind.InterfaceDeclaration: //218
				interfaceProcessor = new InterfaceProcessor();
				if (rv != '') { rv += "\n"; }
				rv += interfaceProcessor.process(node);
				break;
			case ts.SyntaxKind.PropertySignature: //141
				scope = ts.SyntaxKind.PropertySignature;
				break;
			case ts.SyntaxKind.TypeReference:  // 152
			case ts.SyntaxKind.ExportKeyword:  // 82
			case ts.SyntaxKind.ArrayType:  // 157
			case ts.SyntaxKind.ModuleBlock:  // 222
			case ts.SyntaxKind.SourceFile:  // 251
			case ts.SyntaxKind.MethodSignature:  // 143
			case ts.SyntaxKind.Parameter:  // 139
			case ts.SyntaxKind.AnyKeyword:  // 117
			case ts.SyntaxKind.EnumDeclaration:  // 220
			case ts.SyntaxKind.EnumMember:  // 250
			case ts.SyntaxKind.VariableStatement:  // 196
			case ts.SyntaxKind.EndOfFileToken:  // 196
				break;
			default:
				if (log) console.info('Unknown node kind: ' + node.kind);
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
