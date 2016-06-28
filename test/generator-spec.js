var ts = require('typescript');
const ReflectBuilder = require('../src//reflect-builder');
const FieldBuilder = require('../src/field-builder');
const RttiGenerator = require('../src/rtti-generator');
const TypeBuilder = require('../src/type-builder');

function squeezeWhitespaces(string) {
	return string.replace(/\s+/g, ' ').replace(/^\s+/g, '');
}
function expectEqualIgnoreWhitespace(actual, expected) {
	actual = actual.replace('import {PropertyDescriptor} from "typescript-rtti";', '');
	expect(squeezeWhitespaces(actual)).toBe(squeezeWhitespaces(expected));
}

describe("The FieldDefinitionBuilder ", function () {
	var builder;
	beforeEach(function () {
		builder = new FieldBuilder();
	});

	it("create field builder with name and type", function () {
		const expected = 'public static get id(): PropertyDescriptor { return {name: "id", type: {name: "string"}};}';
		expect(builder.setName('id').setTypeDesc(new TypeBuilder().setName('string').build()).build()).toEqual(expected);
  });

	it("create field builder with name and type and array", function () {
		const expected = 'public static get id(): PropertyDescriptor { return {name: "id", type: {name: "string", array: true}};}';
		expect(builder.setName('id').setTypeDesc(new TypeBuilder().setName('string').setArray().build()).build()).toEqual(expected);
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
		expectEqualIgnoreWhitespace(astObj.process(''), '');
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
				public static get number(): PropertyDescriptor { return {name: "number", type: {name: "number"}};}
				public static get string(): PropertyDescriptor { return {name: "string", type: {name: "string"}};}
				public static get bool(): PropertyDescriptor { return {name: "bool", type: {name: "boolean"}};}
			}`;
		expectEqualIgnoreWhitespace(astObj.process(inputInterface, 'test-module'), expected);
	});

	it('can handle an interface with array types', () => {
		const inputInterface = 'export interface Hello{ listItems: ExampleListItem[]; numberItems: number[]; bool : boolean[]; }';
		const expected =
			`export class HelloReflect{
				public static get listItems(): PropertyDescriptor { return {name: "listItems", type: {name: "object", reflect: ExampleListItemReflect, array: true}};}
				public static get numberItems(): PropertyDescriptor { return {name: "numberItems", type: {name: "number", array: true}};}
				public static get bool(): PropertyDescriptor { return {name: "bool", type: {name: "boolean", array: true}};}
			}`;
		expectEqualIgnoreWhitespace(astObj.process(inputInterface, 'test-module'), expected);
	});

	it('can handle two interfaces with array types', () => {
		const inputInterface = 'export interface Hello{ listItems: ExampleListItem[];}export interface Bello{ listItems: ExampleListItem[];}';
		const expected =
			`export class HelloReflect{
				public static get listItems(): PropertyDescriptor { return {name: "listItems", type: {name: "object", reflect: ExampleListItemReflect, array: true}};}
			}
			export class BelloReflect{
				public static get listItems(): PropertyDescriptor { return {name: "listItems", type: {name: "object", reflect: ExampleListItemReflect, array: true}};}
			}`;
		expectEqualIgnoreWhitespace(astObj.process(inputInterface, 'test-module'), expected);
	});

	it('can handle an unsupported service interface', () => {
		const inputInterface = 'export interface Hello{ listItems: ExampleListItem[]; equals(param0: any): Promise<boolean>;}';
		const expected =
			`export class HelloReflect{
				public static get listItems(): PropertyDescriptor { return {name: "listItems", type: {name: "object", reflect: ExampleListItemReflect, array: true}};}
			}`
		expectEqualIgnoreWhitespace(astObj.process(inputInterface, 'test-module'), expected);
	});

	it('can handle an interface before variable', () => {
		const inputInterface = 'export interface Hello{ listItems: ExampleListItem[];}export var rootUrl: string;';
		const expected =
			`export class HelloReflect{
				public static get listItems(): PropertyDescriptor { return {name: "listItems", type: {name: "object", reflect: ExampleListItemReflect, array: true}};}
			}`;
		expectEqualIgnoreWhitespace(astObj.process(inputInterface, 'test-module'), expected);
	});

	it('can handle an interface before  enum', () => {
		const inputInterface = 'export interface Hello{ listItems: ExampleListItem[];}export enum Enum{}';
		const expected =
			`export class HelloReflect{
				public static get listItems(): PropertyDescriptor { return {name: "listItems", type: {name: "object", reflect: ExampleListItemReflect, array: true}};}
			}`;
		expectEqualIgnoreWhitespace(astObj.process(inputInterface, 'test-module'), expected);
	});

	it('handles enum references', () => {
		const inputInterface = 'export module TestModule { export enum Enum{}; export interface Hello{ listItems: Enum;} }';
		const expected =
			`import {TestModule} from './test-module';
			 import Enum = TestModule.Enum;
			 export class HelloReflect{
				public static get listItems(): PropertyDescriptor { return {name: "listItems", type: {name: "object", constructor: Enum, enum: true}};}
			}`;
		expectEqualIgnoreWhitespace(astObj.process(inputInterface, 'test-module'), expected);
	});

});
