var ts = require('typescript');
const ReflectBuilder = require('./reflect-builder');
const FieldBuilder = require('./field-builder');
const RttiGenerator = require('./rtti-generator');

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

	it("create empty field builder", function () {
		expect(builder.build()).toEqual('');
  });

	it("create field builder with name and type", function () {
		const expected = 'public static get id(){ return {name: "id", type: "string"};}';
		expect(builder.setName('id').setType('string').build()).toEqual(expected);
  });

	it("create field builder with name only", function () {
		const expected = '';
		expect(builder.setName('id').build()).toEqual(expected);
  });

	it("create field builder with type only", function () {
		const expected = '';
		expect(builder.setType('string').build()).toEqual(expected);
  });

	it("create field builder with name and type and array", function () {
		const expected = 'public static get id(){ return {name: "id", type: "string[]"};}';
		expect(builder.setName('id').setType('string').setArray().build()).toEqual(expected);
  });

});

describe("The ReflectBuilder ", function () {
	var builder;
	beforeEach(function () {
		builder = new ReflectBuilder();
  });

	it("create empty reflect builder", function () {
		expect(builder.build()).toEqual('');
  });

	it("create a reflect builder with empty name", function () {
		expect(builder.addfield('fieldOne').build()).toEqual('');
  });

	it("create a reflect builder with empty field set", function () {
		const expected = "export class idReflect{\n\t\n}";
		expect(builder.setTypeName('id').build()).toEqual(expected);
  });

	it("create a reflect builder with one field", function () {
		const expected = "export class idReflect{\n\tfield1\n}";
		expect(builder.setTypeName('id').addfield('field1').build()).toEqual(expected);
  });

		it("create a reflect builder with three fields", function () {
		const expected = "export class idReflect{\n\tfield1\n\tfield2\n\tfield3\n}";
		expect(builder.setTypeName('id').addfield('field1').addfield('field2').addfield('field3').build()).toEqual(expected);
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
		expect(astObj.process(emptyInterface)).toBe(expected);
	});

	it('can handle the empty interface inside module', () => {
		const emptyInterface = 'export module HelloWorld { export interface Empty{}}';
		const expected = "export class EmptyReflect{\n\t\n}";
		expect(astObj.process(emptyInterface)).toBe(expected);
	});

	it('can handle an interface with standard types', () => {
		const inputInterface = 'export interface Hello{ number : number; string : string; bool : boolean; }';
		const expected =
			`export class HelloReflect{
				public static get number(){ return {name: "number", type: "number"};}
				public static get string(){ return {name: "string", type: "string"};}
				public static get bool(){ return {name: "bool", type: "boolean"};}
			}`;
		expectEqualIgnoreWhitespace(astObj.process(inputInterface), expected);
	});

	it('can handle an interface with array types', () => {
		const inputInterface = 'export interface Hello{ listItems: ExampleListItem[]; numberItems: number[]; bool : boolean[]; }';
		const expected =
			`export class HelloReflect{
				public static get listItems(){ return {name: "listItems", type: "ExampleListItem[]"};}
				public static get numberItems(){ return {name: "numberItems", type: "number[]"};}
				public static get bool(){ return {name: "bool", type: "boolean[]"};}
			}`;
		expectEqualIgnoreWhitespace(astObj.process(inputInterface), expected);
	});

	it('can handle two interface with array types', () => {
		const inputInterface = 'export interface Hello{ listItems: ExampleListItem[];}export interface Bello{ listItems: ExampleListItem[];}';
		const expected =
			`export class HelloReflect{
				public static get listItems(){ return {name: "listItems", type: "ExampleListItem[]"};}
			}
			export class BelloReflect{
				public static get listItems(){ return {name: "listItems", type: "ExampleListItem[]"};}
			}`;
		expectEqualIgnoreWhitespace(astObj.process(inputInterface), expected);
	});

	it('can handle an unsopported service interface', () => {
		const inputInterface = 'export interface Hello{ listItems: ExampleListItem[]; equals(param0: any): Promise<boolean>;}';
		const expected =
			`export class HelloReflect{
				public static get listItems(){ return {name: "listItems", type: "ExampleListItem[]"};}
			}`
		expectEqualIgnoreWhitespace(astObj.process(inputInterface), expected);
	});

	it('can handle an interface after variable', () => {
		const inputInterface = 'export interface Hello{ listItems: ExampleListItem[];}export var rootUrl: string;';
		const expected =
			`export class HelloReflect{
				public static get listItems(){ return {name: "listItems", type: "ExampleListItem[]"};}
			}`;
		expectEqualIgnoreWhitespace(astObj.process(inputInterface), expected);
	});

	it('can handle an interface after enum', () => {
		const inputInterface = 'export interface Hello{ listItems: ExampleListItem[];}export enum Enum{}';
		const expected =
			`export class HelloReflect{
				public static get listItems(){ return {name: "listItems", type: "ExampleListItem[]"};}
			}`;
		expectEqualIgnoreWhitespace(astObj.process(inputInterface), expected);
	});
});
