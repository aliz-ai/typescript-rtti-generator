var ts = require('typescript');
const ReflectBuilder = require('../src//reflect-builder');
const FieldBuilder = require('../src/field-builder');
const RttiGenerator = require('../src/rtti-generator');

function squeezeWhitespaces(string) {
	return string.replace(/\s+/g, ' ');
}
function expectEqualIgnoreWhitespace(actual, expected) {
	expect(squeezeWhitespaces(actual)).toBe(squeezeWhitespaces(expected));
}

describe("The FieldDefinitionBuilder ", function () {
	var builder;
	beforeEach(function () {
		builder = new FieldBuilder();
	});

	it("create field builder with name and type", function () {
		const expected = 'public static get id(){ return {name: "id", type: "string"};}';
		expect(builder.setName('id').setType('string').build()).toEqual(expected);
  });

	it("create field builder with name and type and array", function () {
		const expected = 'public static get id(){ return {name: "id", type: "string", array: true};}';
		expect(builder.setName('id').setType('string').setArray().build()).toEqual(expected);
  });

});

describe("The ReflectBuilder ", function () {
	var builder;
	beforeEach(function () {
		builder = new ReflectBuilder();
  });

	it("create a reflect builder with empty field set", function () {
		const expected = "export class idReflect{\n\t\n}";
		expect(builder.setTypeName('id').build()).toEqual(expected);
  });

	it("create a reflect builder with one field", function () {
		const expected = "export class idReflect{\n\tfield1\n}";
		expect(builder.setTypeName('id').addField('field1').build()).toEqual(expected);
  });

		it("create a reflect builder with three fields", function () {
		const expected = "export class idReflect{\n\tfield1\n\tfield2\n\tfield3\n}";
		expect(builder.setTypeName('id').addField('field1').addField('field2').addField('field3').build()).toEqual(expected);
  });
});


describe('ast', () => {
	var astObj;

	beforeEach(() => {
		astObj = new RttiGenerator();
	});

	it('can handle the empty input', () => {
		expect(astObj.process('')).toBe('');
	});

	it('can handle the empty interface', () => {
		const emptyInterface = 'export interface Empty{}';
		const expected = "export class EmptyReflect{\n\t\n}";
		expectEqualIgnoreWhitespace(astObj.process(emptyInterface, 'test-module'), expected);
	});

	it('can handle the empty interface inside module', () => {
		const emptyInterface = 'export module TestModule { export interface Empty{}}';
		const expected = "import {TestModule} from './test-module'; export class EmptyReflect{\n\t\n}";
		expectEqualIgnoreWhitespace(astObj.process(emptyInterface, 'test-module'), expected);
	});

	it('can handle an interface with standard types', () => {
		const inputInterface = 'export interface Hello{ number : number; string : string; bool : boolean; }';
		const expected =
			`export class HelloReflect{
				public static get number(){ return {name: "number", type: "number"};}
				public static get string(){ return {name: "string", type: "string"};}
				public static get bool(){ return {name: "bool", type: "boolean"};}
			}`;
		expectEqualIgnoreWhitespace(astObj.process(inputInterface, 'test-module'), expected);
	});

	it('can handle an interface with array types', () => {
		const inputInterface = 'export interface Hello{ listItems: ExampleListItem[]; numberItems: number[]; bool : boolean[]; }';
		const expected =
			`export class HelloReflect{
				public static get listItems(){ return {name: "listItems", type: "object", reflect: ExampleListItemReflect, array: true};}
				public static get numberItems(){ return {name: "numberItems", type: "number", array: true};}
				public static get bool(){ return {name: "bool", type: "boolean", array: true};}
			}`;
		expectEqualIgnoreWhitespace(astObj.process(inputInterface, 'test-module'), expected);
	});

	it('can handle two interfaces with array types', () => {
		const inputInterface = 'export interface Hello{ listItems: ExampleListItem[];}export interface Bello{ listItems: ExampleListItem[];}';
		const expected =
			`export class HelloReflect{
				public static get listItems(){ return {name: "listItems", type: "object", reflect: ExampleListItemReflect, array: true};}
			}
			export class BelloReflect{
				public static get listItems(){ return {name: "listItems", type: "object", reflect: ExampleListItemReflect, array: true};}
			}`;
		expectEqualIgnoreWhitespace(astObj.process(inputInterface, 'test-module'), expected);
	});

	it('can handle an unsopported service interface', () => {
		const inputInterface = 'export interface Hello{ listItems: ExampleListItem[]; equals(param0: any): Promise<boolean>;}';
		const expected =
			`export class HelloReflect{
				public static get listItems(){ return {name: "listItems", type: "object", reflect: ExampleListItemReflect, array: true};}
			}`
		expectEqualIgnoreWhitespace(astObj.process(inputInterface, 'test-module'), expected);
	});

	it('can handle an interface before variable', () => {
		const inputInterface = 'export interface Hello{ listItems: ExampleListItem[];}export var rootUrl: string;';
		const expected =
			`export class HelloReflect{
				public static get listItems(){ return {name: "listItems", type: "object", reflect: ExampleListItemReflect, array: true};}
			}`;
		expectEqualIgnoreWhitespace(astObj.process(inputInterface, 'test-module'), expected);
	});

	it('can handle an interface before  enum', () => {
		const inputInterface = 'export interface Hello{ listItems: ExampleListItem[];}export enum Enum{}';
		const expected =
			`export class HelloReflect{
				public static get listItems(){ return {name: "listItems", type: "object", reflect: ExampleListItemReflect, array: true};}
			}`;
		expectEqualIgnoreWhitespace(astObj.process(inputInterface, 'test-module'), expected);
	});

	it('handles enum references', () => {
		const inputInterface = 'export module TestModule { export enum Enum{}; export interface Hello{ listItems: Enum;} }';
		const expected =
			`import {TestModule} from './test-module';
			 import Enum = TestModule.Enum;
			 export class HelloReflect{
				public static get listItems(){ return {name: "listItems", type: "object", constructor: Enum, enum: true};}
			}`;
		expectEqualIgnoreWhitespace(astObj.process(inputInterface, 'test-module'), expected);
	});

});
