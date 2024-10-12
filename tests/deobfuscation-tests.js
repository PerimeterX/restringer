export default [
	{
		enabled: true,
		name: 'Augmented Array Replacements',
		source: `const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'a', 'b', 'c'];
(function(targetArray, numberOfShifts) {
    var augmentArray = function(counter) {
        while (--counter) {
            targetArray['push'](targetArray['shift']());
        }
    };
    augmentArray(++numberOfShifts);
})(arr, 3);
console.log(arr[7], arr[8]);`,
		expected: `const arr = [
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
console.log('a', 'b');`,
	},
	{
		enabled: true,
		name: 'Compute Definite Binary Expressions',
		source: '"2" + 3 - "5" * 0 + "1"',
		expected: `'231';`,
	},
	{
		enabled: true,
		name: 'Do Not Replace Modified Member Expressions',
		source: `var l = [];
const b = l.length * 2;
const c = l.length + 1;
var v = l[b];
l[b] = l[c];
l[c] = v;`,
		expected: `var l = [];
const b = l.length * 2;
const c = l.length + 1;
var v = l[b];
l[b] = l[c];
l[c] = v;`,
	},
	{
		enabled: true,
		name: 'Do Not Replace Member Expressions On Empty Arrays',
		source: 'const a = []; a.push(3); console.log(a, a.length);',
		expected: `const a = []; a.push(3); console.log(a, a.length);`,
	},
	// TODO: Fix issue
	{
		enabled: false,
		reason: 'Unable to assign the correct expected result',
		name: 'Normalize Script Correctly',
		source: '"\x22" + "\x20" + "\x5c\x5c" + "\x0a" + "\b" + "\x09" + "\x0d" + "\u0000";',
		expected: `"\\" \\\\\\\\n\\b\\\\t\\\\r";`,
	},
	{
		enabled: true,
		name: 'Parse Template Literals Into String Literals',
		source: 'console.log(`https://${"url"}.${"com"}/`);',
		expected: `console.log('https://url.com/');`,
	},
	{
		enabled: true,
		name: 'Remove Nested Block Statements',
		source: '{{freeNested;}} {{{freeNested2}}}',
		expected: `freeNested;\nfreeNested2;`,
	},
	{
		enabled: true,
		name: 'Remove Redundant Logical Expressions',
		source: 'if (true || 0) do_a(); else do_b(); if (false && 1) do_c(); else do_d();',
		expected: `do_a();
do_d();`,
	},
	{
		enabled: true,
		name: 'Remove Redundant Not Operators',
		source: 'const a = !true; const b = !!!false;',
		expected: `const a = false;
const b = true;`,
	},
	{
		enabled: true,
		name: 'Replace Augmented Function with Corrected Array',
		source: `(function(a, b){const myArr=a();for(let i=0;i<b;i++)myArr.push(myArr.shift());})(arr,1);function arr(){var a1=[2, 1];arr=function(){return a1;};return arr();}const a = arr();console.log(a[0], a[1]);`,
		expected: `function arr() {\n  return [\n    1,\n    2\n  ];\n}\nconst a = [\n  1,\n  2\n];\nconsole.log(1, 2);`,
	},
	{
		enabled: true,
		name: 'Replace Deterministic If Statement',
		source: 'if(true){a;}if(false){b}if(false||c){c}if(true&&d){d}',
		expected: `a;\nif (c) {\n  c;\n}\nif (d) {\n  d;\n}`,
	},
	{
		enabled: true,
		name: 'Replace Function Calls With Unwrapped Identifier - Arrow Functions',
		source: 'const x = () => String; x().fromCharCode(97);',
		expected: `const x = () => String;
'a';`,
	},
	{
		enabled: true,
		name: 'Replace Function Calls With Unwrapped Identifier',
		source: 'function x() {return String}\nx().fromCharCode(97);',
		expected: `function x() {
  return String;
}
'a';`,
	},
	{
		enabled: true,
		name: 'Replace Function Evals - eval(string)',
		source: 'eval("console.log");',
		expected: `console.log;`,
	},
	{
		enabled: true,
		name: 'Replace Function Evals in Call Expressions - eval(string)(args)',
		source: 'eval("atob")("c3VjY2Vzcw==");',
		expected: `'success';`,
	},
	{
		enabled: true,
		name: 'Replace Identifier With Fixed Assigned Value',
		source: `const a = 'value'; function v(arg) {console.log(a, a[0], a.indexOf('e'));}`,
		expected: `const a = 'value';
function v(arg) {
  console.log('value', 'v', 4);
}`,
	},
	{
		enabled: true,
		name: 'Replace Literal Proxies',
		source: `const b='hello'; console.log(b + ' world');`,
		expected: `const b = 'hello';
console.log('hello world');`,
	},
	{
		enabled: true,
		name: 'Replace Local Calls Proxy - Arrow Functions',
		source: `const a = n => ['hello', 'world'][n]; function c() {const b = a; return b(0) + ' ' + b(1);}`,
		expected: `const a = n => [
  'hello',
  'world'
][n];
function c() {
  return 'hello world';
}`,
	},
	{
		enabled: true,
		name: 'Replace Local Calls Proxy',
		source: `function a(n) { return ['hello', 'world'][n]; } function c() {const b = a; return b(0) + ' ' + b(1);}`,
		expected: `function a(n) {
  return [
    'hello',
    'world'
  ][n];
}
function c() {
  return 'hello world';
}`,
	},
	{
		enabled: true,
		name: 'Replace Local Calls With Values',
		source: `function localCall() {return 'value'} localCall();`,
		expected: `function localCall() {
  return 'value';
}
'value';`,
	},
	{
		enabled: true,
		name: 'Replace Local Calls With Values 2',
		source: `const three = 3;
const one = 1;
function a() {return three;}
function b() {return one;}
function c(a1, b1) {return a1 + b1}
c(a(), b());`,
		expected: `const three = 3;
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
4;`,
	},
	{
		enabled: true,
		name: 'Replace Local Member Expressions Property Reference With Value',
		source: 'const a = {a: "hello "}; a.b = "world"; console.log(a.a + a.b);',
		expected: `const a = { a: 'hello ' };
a.b = 'world';
console.log('hello world');`,
	},
	{
		enabled: true,
		name: 'Replace Local Member Expressions Proxy - Chained Proxies',
		source: 'const a = ["hello"], b = a[0], c = b; console.log(c);',
		expected: `const a = ['hello'];\nconst b = 'hello';\nconst c = 'hello';\nconsole.log('hello');`,
	},
	{
		enabled: true,
		name: 'Replace Local Member Expressions Proxy - Member Assignment',
		source: 'const a = ["hello"], b = a[0];',
		expected: `const a = ['hello'];\nconst b = 'hello';`,
	},
	{
		enabled: true,
		name: 'Replace Member Expression Reference With Value',
		source: 'const a = ["hello", " ", "world"]; console.log(a[0] + a[1] + a[2]);',
		expected: `const a = [
  'hello',
  ' ',
  'world'
];
console.log('hello world');`,
	},
	{
		enabled: true,
		name: 'Replace Reference Proxy',
		source: `const a = ['hello', ' world'], b = a[0], c = a; console.log(b + c[1]);`,
		expected: `const a = [
  'hello',
  ' world'
];
const b = 'hello';
console.log('hello world');`,
	},
	{
		enabled: true,
		name: 'Replace Wrapped Functions With Return Statement',
		source: 'function A(a,b){return function() {return a+b;}.apply(this, arguments);}',
		expected: `function A(a, b) {
  return a + b;
}`,
	},
	{
		enabled: true,
		name: 'Resolve Builtin Call Expressions',
		source: `atob('dGVzdA=='); btoa('test');`,
		expected: `'test';
'dGVzdA==';`,
	},
	{
		enabled: true,
		name: 'Resolve Definite Member Expressions',
		source: `'1234567890'[3]`,
		expected: `'4';`,
	},
	{
		enabled: true,
		name: 'Resolve Deterministic Conditional Expressions',
		source: `(true ? 'o' : 'x') + (false ? 'X' : 'k');`,
		expected: `'ok';`,
	},
	{
		enabled: true,
		name: 'Resolve Directly Assigned Member Expressions',
		source: `function a() {} a.b = 3; a.c = '5'; console.log(a.b + a.c);`,
		expected: `function a() {
}
a.b = 3;
a.c = '5';
console.log('35');`,
	},
	{
		enabled: true,
		name: 'Resolve External References With Context',
		source: `const a = [1, 2, 3]; (function(arr) {arr.forEach((x, i, arr) => arr[i] = x * 10)})(a); function b() {const c = [...a]; return c[0] + 3;}`,
		expected: `const a = [
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
}`,
	},
	{
		enabled: true,
		name: 'Resolve Function Constructor Calls',
		source: `function a() {} const b = a.constructor('', "return a()"); const c = b.constructor('a', 'b', 'return a + b');`,
		expected: `function a() {
}
const b = function () {
  return a();
};
const c = function (a, b) {
  return a + b;
};`,
	},
	{
		enabled: true,
		name: 'Resolve Injected Prototype Method Calls',
		source: `String.prototype.secret = function() {return 'secret ' + this}; 'hello'.secret();`,
		expected: `String.prototype.secret = function () {
  return 'secret ' + this;
};
'secret hello';`,
	},
	{
		enabled: true,
		name: 'Resolve Member Expression Local References with Unary Expressions Correctly',
		source: `const a = ['-example', '-3', '-Infinity']; a[0]; a[1]; a[2];`,
		expected: `const a = [\n  '-example',\n  '-3',\n  '-Infinity'\n];\n'-example';\n-'3';\n-Infinity;`,
	},
	{
		enabled: true,
		name: 'Resolve Member Expression References With Context',
		source: `const a = [1, 2, 3]; (function(arr) {arr.forEach((x, i, arr) => arr[i] = x * 3)})(a); const b = a[0];`,
		expected: `const a = [
  1,
  2,
  3
];
(function (arr) {
  arr.forEach((x, i, arr) => arr[i] = x * 3);
}(a));
const b = 3;`,
	},
	{
		enabled: true,
		name: 'Unwrap Function Shells',
		source: `function O() {return function () {return clearInterval;}.apply(this, arguments);}`,
		expected: `function O() {
  return clearInterval;
}`,
	},
	{
		enabled: true,
		name: 'Verify Correct Context For Function Declaration',
		source: `function a(v) {return v + '4'}; if (a(0)) {console.log(a(18));}`,
		expected: `function a(v) {\n  return v + '4';\n}\nconsole.log('184');`,
	},
	{
		enabled: true,
		name: 'Verify Correct Context For Function Variable',
		source: `let a = function (v) {return v + '4'}; if (a(0)) {console.log(a(18));}`,
		expected: `let a = function (v) {\n  return v + '4';\n};\nconsole.log('184');`,
	},
	{
		enabled: true,
		name: 'Verify Correct Replacement Of Member Expressions With Literal',
		source: `const n = 3, b = 'B';
const a = {b: 'hello'};
a.n = 15;
console.log(a.n, a.b);`,
		expected: `const n = 3;
const b = 'B';
const a = { b: 'hello' };
a.n = 15;
console.log(15, 'hello');`,
	},
	{
		enabled: true,
		name: 'Verify Random Values Remain Untouched',
		source: 'const a = new Date(); const b = Date.now(); const c = Math.random(); const d = 4; console.log(a + b + c + d);',
		expected: `const a = new Date();
const b = Date.now();
const c = Math.random();
const d = 4;
console.log(a + b + c + 4);`,
	},
];