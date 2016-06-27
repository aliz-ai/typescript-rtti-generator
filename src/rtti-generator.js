var ts = require('typescript');
const ReflectBuilder = require('./reflect-builder');
const FieldBuilder = require('./field-builder');

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
					if (scope == ts.SyntaxKind.PropertySignature) {
						if (node.parent.kind === ts.SyntaxKind.TypeReference) {
							fieldBuilder.setType('object');
							fieldBuilder.setObjectType(node.text);
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

function RttiGenerator() {
	var rv = '';
	var log = false;

	var fieldBuilder = new FieldBuilder();

	this.process = function (inputString) {
		var sourceFile = ts.createSourceFile('', inputString, ts.ScriptTarget.ES6, true);
		processNode(sourceFile);
		return rv;
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
