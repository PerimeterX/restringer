import {REstringer} from '../src/restringer.js';
import assert from 'node:assert';
import {describe, it} from 'node:test';

function getDeobfuscatedCode(code) {
	const restringer = new REstringer(code);
	restringer.logger.setLogLevel(restringer.logger.logLevels.NONE);
	restringer.deobfuscate();
	return restringer.script;
}

describe('Deobfuscation tests', () => {
	it('Augmented Array Replacements', () => {
		const code = `const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'a', 'b', 'c'];
(function(targetArray, numberOfShifts) {
    var augmentArray = function(counter) {
        while (--counter) {
            targetArray['push'](targetArray['shift']());
        }
    };
    augmentArray(++numberOfShifts);
})(arr, 3);
console.log(arr[7], arr[8]);`;
		const expected  = `const arr = [
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  'a',
  'b',
  'c',
  1,
  2,
  3
];
console.log('a', 'b');`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it('Compute definite binary expressions', () => {
		const code = `"2" + 3 - "5" * 0 + "1"`;
		const expected  = `'231';`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Don't replace modified member expressions`, () => {
		const code = `var l = [];
const b = l.length * 2;
const c = l.length + 1;
var v = l[b];
l[b] = l[c];
l[c] = v;`;
		const expected  = `var l = [];
const b = l.length * 2;
const c = l.length + 1;
var v = l[b];
l[b] = l[c];
l[c] = v;`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Don't replace member expressions on empty arrays`, () => {
		const code = `const a = []; a.push(3); console.log(a, a.length);`;
		const expected  = `const a = []; a.push(3); console.log(a, a.length);`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it.skip(`TODO: Fix. Normalize Script Correctly`, () => {
		const code = `"\x22" + "\x20" + "\x5c\x5c" + "\x0a" + "\b" + "\x09" + "\x0d" + "\u0000";`;
		const expected  = `'" \\\\\\\\\\n\\b\\t\\r\x00';`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Parse template literals into string literals`, () => {
		const code = 'console.log(`https://${"url"}.${"com"}/`);';
		const expected  = `console.log('https://url.com/');`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Remove nested block statements`, () => {
		const code = `{{freeNested;}} {{{freeNested2}}}`;
		const expected  = `freeNested;\nfreeNested2;`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Remove redundant logical expressions`, () => {
		const code = `if (true || 0) do_a(); else do_b(); if (false && 1) do_c(); else do_d();`;
		const expected  = `do_a();\ndo_d();`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Remove redundant not operators`, () => {
		const code = `const a = !true; const b = !!!false;`;
		const expected  = `const a = false;\nconst b = true;`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Replace augmented function with corrected array`, () => {
		const code = `(function(a, b){const myArr=a();for(let i=0;i<b;i++)myArr.push(myArr.shift());})(arr,1);function arr(){var a1=[2, 1];arr=function(){return a1;};return arr();}const a = arr();console.log(a[0], a[1]);`;
		const expected  = `function arr() {\n  return [\n    1,\n    2\n  ];\n}\nconst a = [\n  1,\n  2\n];\nconsole.log(1, 2);`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Replace deterministic if statement`, () => {
		const code = `if(true){a;}if(false){b}if(false||c){c}if(true&&d){d}`;
		const expected  = `a;\nif (c) {\n  c;\n}\nif (d) {\n  d;\n}`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Replace function calls with unwrapped identifier - arrow functions`, () => {
		const code = `const x = () => String; x().fromCharCode(97);`;
		const expected  = `const x = () => String;\n'a';`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Replace function calls with unwrapped identifier - function declarations`, () => {
		const code = `function x() {return String}\nx().fromCharCode(97);`;
		const expected  = `function x() {
  return String;
}
'a';`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Replace function evals - eval(string)`, () => {
		const code = `eval("console.log");`;
		const expected  = `console.log;`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Replace function evals in call expressions - eval(string)(args)`, () => {
		const code = `eval("atob")("c3VjY2Vzcw==");`;
		const expected  = `'success';`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Replace identifier with fixed assigned value`, () => {
		const code = `const a = 'value'; function v(arg) {console.log(a, a[0], a.indexOf('e'));}`;
		const expected  = `const a = 'value';
function v(arg) {
  console.log('value', 'v', 4);
}`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Replace literal proxies`, () => {
		const code = `const b='hello'; console.log(b + ' world');`;
		const expected  = `const b = 'hello';\nconsole.log('hello world');`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Replace local calls proxy - arrow functions`, () => {
		const code = `const a = n => ['hello', 'world'][n]; function c() {const b = a; return b(0) + ' ' + b(1);}`;
		const expected  = `const a = n => [
  'hello',
  'world'
][n];
function c() {
  return 'hello world';
}`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it.skip(`TODO: FIX Replace local calls proxy - function declarations`, () => {
		// TODO: For some reason running this test sometimes breaks isolated-vm with the error:
		// Assertion failed: (environment != nullptr), function GetCurrent, file environment.h, line 202.
		const code = `function a(n) { return ['hello', 'world'][n]; } function c() {const b = a; return b(0) + ' ' + b(1);}`;
		const expected  = `function a(n) {
  return [
    'hello',
    'world'
  ][n];
}
function c() {
  return 'hello world';
}`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Replace local calls with values - immediate`, () => {
		const code = `function localCall() {return 'value'} localCall()`;
		const expected  = `function localCall() {
  return 'value';
}
'value';`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Replace local calls with values - nested`, () => {
		const code = `const three = 3;
const one = 1;
function a() {return three;}
function b() {return one;}
function c(a1, b1) {return a1 + b1}
c(a(), b());`;
		const expected  = `const three = 3;
const one = 1;
function a() {
  return 3;
}
function b() {
  return 1;
}
function c(a1, b1) {
  return a1 + b1;
}
4;`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Replace local member expressions property reference with value`, () => {
		const code = `const a = {a: "hello "}; a.b = "world"; console.log(a.a + a.b);`;
		const expected  = `const a = { a: 'hello ' };
a.b = 'world';
console.log('hello world');`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Replace local member expressions proxy - chained proxies`, () => {
		const code = `const a = ["hello"], b = a[0], c = b; console.log(c);`;
		const expected  = `const a = ['hello'];\nconst b = 'hello';\nconst c = 'hello';\nconsole.log('hello');`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Replace local member expressions proxy - member assignment`, () => {
		const code = `const a = ["hello"], b = a[0];`;
		const expected  = `const a = ['hello'];\nconst b = 'hello';`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Replace member expression references with values`, () => {
		const code = `const a = ["hello", " ", "world"]; console.log(a[0] + a[1] + a[2]);`;
		const expected  = `const a = [
  'hello',
  ' ',
  'world'
];
console.log('hello world');`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Replace reference proxy`, () => {
		const code = `const a = ['hello', ' world'], b = a[0], c = a; console.log(b + c[1]);`;
		const expected  = `const a = [
  'hello',
  ' world'
];
const b = 'hello';
console.log('hello world');`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Replace wrapped functions with return statement`, () => {
		const code = `function A(a,b){return function() {return a+b;}.apply(this, arguments);}`;
		const expected  = `function A(a, b) {
  return a + b;
}`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Resolve builtin call expressions: btoa & atob`, () => {
		const code = `atob('dGVzdA=='); btoa('test');`;
		const expected  = `'test';\n'dGVzdA==';`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Resolve definite member expressions`, () => {
		const code = `'1234567890'[3]`;
		const expected  = `'4';`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Resolve deterministic conditional expressions`, () => {
		const code = `(true ? 'o' : 'x') + (false ? 'X' : 'k');`;
		const expected  = `'ok';`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Resolve directly assigned member expressions`, () => {
		const code = `function a() {} a.b = 3; a.c = '5'; console.log(a.b + a.c);`;
		const expected  = `function a() {
}
a.b = 3;
a.c = '5';
console.log('35');`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Resolve external references with context`, () => {
		const code = `const a = [1, 2, 3]; (function(arr) {arr.forEach((x, i, arr) => arr[i] = x * 10)})(a); function b() {const c = [...a]; return c[0] + 3;}`;
		const expected  = `const a = [
  1,
  2,
  3
];
(function (arr) {
  arr.forEach((x, i, arr) => arr[i] = x * 10);
}(a));
function b() {
  const c = [...a];
  return 13;
}`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Resolve function constructor calls`, () => {
		const code = `function a() {} const b = a.constructor('', "return a()"); const c = b.constructor('a', 'b', 'return a + b');`;
		const expected  = `function a() {
}
const b = function () {
  return a();
};
const c = function (a, b) {
  return a + b;
};`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Resolve injected prototype method calls`, () => {
		const code = `String.prototype.secret = function() {return 'secret ' + this}; 'hello'.secret();`;
		const expected  = `String.prototype.secret = function () {
  return 'secret ' + this;
};
'secret hello';`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Resolve member expression local references with unary expressions correctly`, () => {
		const code = `const a = ['-example', '-3', '-Infinity']; a[0]; a[1]; a[2];`;
		const expected  = `const a = [\n  '-example',\n  '-3',\n  '-Infinity'\n];\n'-example';\n-'3';\n-Infinity;`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Resolve member expression references with context`, () => {
		const code = `const a = [1, 2, 3]; (function(arr) {arr.forEach((x, i, arr) => arr[i] = x * 3)})(a); const b = a[0];`;
		const expected  = `const a = [
  1,
  2,
  3
];
(function (arr) {
  arr.forEach((x, i, arr) => arr[i] = x * 3);
}(a));
const b = 3;`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Unwrap function shells`, () => {
		const code = `function O() {return function () {return clearInterval;}.apply(this, arguments);}`;
		const expected  = `function O() {
  return clearInterval;
}`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Verify correct context for function declaration`, () => {
		const code = `function a(v) {return v + '4'}; if (a(0)) {console.log(a(18));}`;
		const expected  = `function a(v) {\n  return v + '4';\n}\nconsole.log('184');`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Verify correct context for function variable`, () => {
		const code = `let a = function (v) {return v + '4'}; if (a(0)) {console.log(a(18));}`;
		const expected  = `let a = function (v) {\n  return v + '4';\n};\nconsole.log('184');`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Verify correct replacement of member expressions with literals`, () => {
		const code = `const n = 3, b = 'B';
const a = {b: 'hello'};
a.n = 15;
console.log(a.n, a.b);`;
		const expected  = `const n = 3;
const b = 'B';
const a = { b: 'hello' };
a.n = 15;
console.log(15, 'hello');`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
	it(`Verify random values remain untouched`, () => {
		const code = `const a = new Date(); const b = Date.now(); const c = Math.random(); const d = 4; console.log(a + b + c + d);`;
		const expected  = `const a = new Date();
const b = Date.now();
const c = Math.random();
const d = 4;
console.log(a + b + c + 4);`;
		const result = getDeobfuscatedCode(code);
		assert.strictEqual(result, expected);
	});
});