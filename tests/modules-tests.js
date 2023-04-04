const {generateFlatAST} = require('flast');
const {badValue} = require(__dirname + '/../src/modules/config');

module.exports = [
	// Safe
	{
		enabled: true,
		name: 'removeRedundantBlockStatements - TP-1',
		func: __dirname + '/../src/modules/safe/removeRedundantBlockStatements',
		source: `if (a) {{do_a();}}`,
		expected: `if (a) {\n  do_a();\n}`,
	},
	{
		enabled: true,
		name: 'removeRedundantBlockStatements - TP-2',
		func: __dirname + '/../src/modules/safe/removeRedundantBlockStatements',
		source: `if (a) {{do_a();}{do_b();}}`,
		expected: `if (a) {\n  do_a();\n  do_b();\n}`,
	},
	{
		enabled: true,
		name: 'removeRedundantBlockStatements - TP-3',
		func: __dirname + '/../src/modules/safe/removeRedundantBlockStatements',
		source: `if (a) {{do_a();}{do_b(); do_c();}{do_d();}}`,
		expected: `if (a) {\n  do_a();\n  do_b();\n  do_c();\n  do_d();\n}`,
	},
	{
		enabled: true,
		name: 'removeRedundantBlockStatements - TP-3',
		func: __dirname + '/../src/modules/safe/removeRedundantBlockStatements',
		source: `if (a) {{do_a();} do_b();}`,
		expected: `if (a) {\n  do_a();\n  do_b();\n}`,
	},
	{
		enabled: true,
		looped: true,
		name: 'removeRedundantBlockStatements - TP-4',
		func: __dirname + '/../src/modules/safe/removeRedundantBlockStatements',
		source: `if (a) {{{{{do_a();}}}} do_b();}`,
		expected: `if (a) {\n  do_a();\n  do_b();\n}`,
	},
	{
		enabled: true,
		name: 'normalizeComputed - TP-1',
		func: __dirname + '/../src/modules/safe/normalizeComputed',
		source: `hello['world'][0]['%32']['valid']`,
		expected: `hello.world[0]['%32'].valid;`,
	},
	{
		enabled: true,
		name: 'normalizeEmptyStatements - TP-1',
		func: __dirname + '/../src/modules/safe/normalizeEmptyStatements',
		source: `;;var a = 3;;`,
		expected: `var a = 3;`,
	},
	{
		enabled: true,
		name: 'normalizeEmptyStatements - TN-1',
		func: __dirname + '/../src/modules/safe/normalizeEmptyStatements',
		source: `for (;;);`,
		expected: `for (;;);`,
	},
	{
		enabled: true,
		name: 'parseTemplateLiteralsIntoStringLiterals - TP-1',
		func: __dirname + '/../src/modules/safe/parseTemplateLiteralsIntoStringLiterals',
		source: '`hello ${"world"}!`;',
		expected: `'hello world!';`,
	},
	{
		enabled: true,
		name: 'rearrangeSequences - TP-1',
		func: __dirname + '/../src/modules/safe/rearrangeSequences',
		source: `function f() { return a(), b(), c(); }`,
		expected: `function f() {\n  a();\n  b();\n  return c();\n}`,
	},
	{
		enabled: true,
		name: 'rearrangeSequences - TP-2',
		func: __dirname + '/../src/modules/safe/rearrangeSequences',
		source: `function f() { if (x) return a(), b(), c(); else d(); }`,
		expected: `function f() {\n  if (x) {\n    a();\n    b();\n    return c();\n  } else\n    d();\n}`,
	},
	{
		enabled: true,
		name: 'rearrangeSequences - TP-3',
		func: __dirname + '/../src/modules/safe/rearrangeSequences',
		source: `function f() { if (a(), b()) c(); }`,
		expected: `function f() {\n  a();\n  if (b())\n    c();\n}`,
	},
	{
		enabled: true,
		name: 'rearrangeSequences - TP-4',
		func: __dirname + '/../src/modules/safe/rearrangeSequences',
		source: `function f() { if (x) if (a(), b()) c(); }`,
		expected: `function f() {\n  if (x) {\n    a();\n    if (b())\n      c();\n  }\n}`,
	},
	{
		enabled: true,
		name: 'rearrangeSwitches - TP-1',
		func: __dirname + '/../src/modules/safe/rearrangeSwitches',
		source: `(() => {let a = 1;\twhile (true) {switch (a) {case 3: return console.log(3); case 2: console.log(2); a = 3; break;
case 1: console.log(1); a = 2; break;}}})();`,
		expected: `(() => {
  let a = 1;
  while (true) {
    {
      console.log(1);
      a = 2;
      console.log(2);
      a = 3;
      return console.log(3);
    }
  }
})();`,
	},
	{
		enabled: true,
		name: 'removeDeadNodes - TP-1',
		func: __dirname + '/../src/modules/safe/removeDeadNodes',
		source: 'var a = 3, b = 12; console.log(b);',
		expected: `var b = 12;\nconsole.log(b);`,
	},
	{
		enabled: true,
		name: 'replaceCallExpressionsWithUnwrappedIdentifier - TP-1',
		func: __dirname + '/../src/modules/safe/replaceCallExpressionsWithUnwrappedIdentifier',
		source: `const a = () => btoa; a()('yo');`,
		expected: `const a = () => btoa;\nbtoa('yo');`,
	},
	{
		enabled: true,
		name: 'replaceCallExpressionsWithUnwrappedIdentifier - TP-2',
		func: __dirname + '/../src/modules/safe/replaceCallExpressionsWithUnwrappedIdentifier',
		source: `function a() {return btoa;} a()('yo');`,
		expected: `function a() {\n  return btoa;\n}\nbtoa('yo');`,
	},
	{
		enabled: true,
		name: 'replaceEvalCallsWithLiteralContent - TP-1',
		func: __dirname + '/../src/modules/safe/replaceEvalCallsWithLiteralContent',
		source: `eval('console.log("hello world")');`,
		expected: `console.log('hello world');`,
	},
	{
		enabled: true,
		name: 'replaceEvalCallsWithLiteralContent - TP-2',
		func: __dirname + '/../src/modules/safe/replaceEvalCallsWithLiteralContent',
		source: `eval('a; b;');`,
		expected: `{\n  a;\n  b;\n}`,
	},
	{
		enabled: true,
		name: 'replaceEvalCallsWithLiteralContent - TP-3',
		func: __dirname + '/../src/modules/safe/replaceEvalCallsWithLiteralContent',
		source: `function q() {return (eval('a, b;'));}`,
		expected: `function q() {\n  return a, b;\n}`,
	},
	{
		enabled: true,
		name: 'replaceEvalCallsWithLiteralContent - TP-4',
		func: __dirname + '/../src/modules/safe/replaceEvalCallsWithLiteralContent',
		source: `eval('()=>1')();`,
		expected: `(() => 1)();`,
	},
	{
		enabled: true,
		name: 'replaceEvalCallsWithLiteralContent - TP-5',
		func: __dirname + '/../src/modules/safe/replaceEvalCallsWithLiteralContent',
		source: `eval('3 * 5') + 1;`,
		expected: `3 * 5 + 1;`,
	},
	{
		enabled: true,
		name: 'replaceEvalCallsWithLiteralContent - TP-6',
		func: __dirname + '/../src/modules/safe/replaceEvalCallsWithLiteralContent',
		source: `console.log(eval('1;'));`,
		expected: `console.log(1);`,
	},
	{
		enabled: true,
		name: 'replaceFunctionShellsWithWrappedValue - TP-1',
		func: __dirname + '/../src/modules/safe/replaceFunctionShellsWithWrappedValue',
		source: `function a() {return String}\na()(val);`,
		expected: `function a() {\n  return String;\n}\nString(val);`,
	},
	{
		enabled: true,
		name: 'replaceFunctionShellsWithWrappedValue - TN-1',
		func: __dirname + '/../src/modules/safe/replaceFunctionShellsWithWrappedValue',
		source: `function a() {\n  return 0;\n}\nconst o = { key: a }`,
		expected: `function a() {\n  return 0;\n}\nconst o = { key: a }`,
	},
	{
		enabled: true,
		name: 'replaceFunctionShellsWithWrappedValue - TN-2',
		func: __dirname + '/../src/modules/safe/replaceFunctionShellsWithWrappedValue',
		source: `function a() {\n  return 0;\n}\nconsole.log(a);`,
		expected: `function a() {\n  return 0;\n}\nconsole.log(a);`,
	},
	{
		enabled: true,
		name: 'replaceFunctionShellsWithWrappedValueIIFE - TP-1',
		func: __dirname + '/../src/modules/safe/replaceFunctionShellsWithWrappedValueIIFE',
		source: `(function a() {return String}\n)()(val);`,
		expected: `String(val);`,
	},
	{
		enabled: true,
		name: 'replaceIdentifierWithFixedAssignedValue - TP-1',
		func: __dirname + '/../src/modules/safe/replaceIdentifierWithFixedAssignedValue',
		source: `const a = 3; const b = a * 2; console.log(b + a);`,
		expected: `const a = 3;\nconst b = 3 * 2;\nconsole.log(b + 3);`,
	},
	{
		enabled: true,
		name: 'replaceIdentifierWithFixedAssignedValue - TN-1',
		func: __dirname + '/../src/modules/safe/replaceIdentifierWithFixedAssignedValue',
		source: `var a = 3; for (a in [1, 2]) console.log(a);`,
		expected: `var a = 3; for (a in [1, 2]) console.log(a);`,
	},
	{
		enabled: true,
		name: 'replaceIdentifierWithFixedAssignedValue - TN-2',
		func: __dirname + '/../src/modules/safe/replaceIdentifierWithFixedAssignedValue',
		source: `var a = 3; for (a of [1, 2]) console.log(a);`,
		expected: `var a = 3; for (a of [1, 2]) console.log(a);`,
	},
	{
		enabled: true,
		name: 'replaceIdentifierWithFixedValueNotAssignedAtDeclaration - TP-1',
		func: __dirname + '/../src/modules/safe/replaceIdentifierWithFixedValueNotAssignedAtDeclaration',
		source: `let a; a = 3; const b = a * 2; console.log(b + a);`,
		expected: `let a;\na = 3;\nconst b = 3 * 2;\nconsole.log(b + 3);`,
	},
	{
		enabled: true,
		name: 'replaceNewFuncCallsWithLiteralContent - TP-1',
		func: __dirname + '/../src/modules/safe/replaceNewFuncCallsWithLiteralContent',
		source: `new Function("!function() {console.log('hello world')}()")();`,
		expected: `!function () {\n  console.log('hello world');\n}();`,
	},
	{
		enabled: true,
		name: 'replaceBooleanExpressionsWithIf - TP-1',
		func: __dirname + '/../src/modules/safe/replaceBooleanExpressionsWithIf',
		source: `x && y && z();`,
		expected: `if (x && y) {\n  z();\n}`,
	},
	{
		enabled: true,
		name: 'replaceBooleanExpressionsWithIf - TP-2',
		func: __dirname + '/../src/modules/safe/replaceBooleanExpressionsWithIf',
		source: `x || y || z();`,
		expected: `if (!(x || y)) {\n  z();\n}`,
	},
	{
		enabled: true,
		name: 'replaceSequencesWithExpressions - TP-1',
		func: __dirname + '/../src/modules/safe/replaceSequencesWithExpressions',
		source: `if (a) (b(), c());`,
		expected: `if (a) {\n  b();\n  c();\n}`,
	},
	{
		enabled: true,
		name: 'replaceSequencesWithExpressions - TP-2',
		func: __dirname + '/../src/modules/safe/replaceSequencesWithExpressions',
		source: `if (a) { (b(), c()); d() }`,
		expected: `if (a) {\n  b();\n  c();\n  d();\n}`,
	},
	{
		enabled: true,
		name: 'resolveDeterministicIfStatements - TP-1',
		func: __dirname + '/../src/modules/safe/resolveDeterministicIfStatements',
		source: `if (true) do_a(); else do_b(); if (false) do_c(); else do_d();`,
		expected: `do_a();\ndo_d();`,
	},
	{
		enabled: true,
		name: 'resolveFunctionConstructorCalls - TP-1',
		func: __dirname + '/../src/modules/safe/resolveFunctionConstructorCalls',
		source: `const func = Function.constructor('', "console.log('hello world!');");`,
		expected: `const func = function () {\n  console.log('hello world!');\n};`,
	},
	{
		enabled: true,
		name: 'resolveFunctionConstructorCalls - TP-2',
		func: __dirname + '/../src/modules/safe/resolveFunctionConstructorCalls',
		source: `a = Function.constructor('return /" + this + "/')().constructor('^([^ ]+( +[^ ]+)+)+[^ ]}');`,
		expected: `a = function () {\n  return /" + this + "/;\n}().constructor('^([^ ]+( +[^ ]+)+)+[^ ]}');`,
	},
	{
		enabled: true,
		name: 'resolveMemberExpressionReferencesToArrayIndex - TP-1',
		func: __dirname + '/../src/modules/safe/resolveMemberExpressionReferencesToArrayIndex',
		source: `const a = [1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,3];  b = a[0]; c = a[20];`,
		expected: `const a = [\n  1,\n  1,\n  1,\n  1,\n  1,\n  1,\n  1,\n  1,\n  1,\n  1,
  2,\n  2,\n  2,\n  2,\n  2,\n  2,\n  2,\n  2,\n  2,\n  2,\n  3\n];\nb = 1;\nc = 3;`,
	},
	{
		enabled: true,
		name: 'resolveMemberExpressionReferencesToArrayIndex - TN-1',
		func: __dirname + '/../src/modules/safe/resolveMemberExpressionReferencesToArrayIndex',
		source: `const a = [1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,3];  b = a['indexOf']; c = a['length'];`,
		expected: `const a = [1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,3];  b = a['indexOf']; c = a['length'];`,
	},
	{
		enabled: true,
		name: 'resolveMemberExpressionsWithDirectAssignment - TP-1',
		func: __dirname + '/../src/modules/safe/resolveMemberExpressionsWithDirectAssignment',
		source: `function a() {} a.b = 3; a.c = '5'; console.log(a.b + a.c);`,
		expected: `function a() {\n}\na.b = 3;\na.c = '5';\nconsole.log(3 + '5');`,
	},
	{
		enabled: true,
		name: 'resolveMemberExpressionsWithDirectAssignment - TN-1',
		func: __dirname + '/../src/modules/safe/resolveMemberExpressionsWithDirectAssignment',
		source: `const a = {}; a.b = ''; a.b = 3;`,
		expected: `const a = {}; a.b = ''; a.b = 3;`,
	},
	{
		enabled: true,
		name: 'resolveMemberExpressionsWithDirectAssignment - TN-2',
		func: __dirname + '/../src/modules/safe/resolveMemberExpressionsWithDirectAssignment',
		source: `const a = {}; a.b = 0; ++a.b + 2;`,
		expected: `const a = {}; a.b = 0; ++a.b + 2;`,
	},
	{
		enabled: true,
		name: 'resolveProxyCalls - TP-1',
		func: __dirname + '/../src/modules/safe/resolveProxyCalls',
		source: `function call1(a, b) {return a + b;} function call2(c, d) {return call1(c, d);} function call3(e, f) {return call2(e, f);}`,
		expected: `function call1(a, b) {\n  return a + b;\n}\nfunction call2(c, d) {\n  return call1(c, d);\n}\nfunction call3(e, f) {\n  return call1(e, f);\n}`,
	},
	{
		enabled: true,
		name: 'resolveProxyReferences - TP-1',
		func: __dirname + '/../src/modules/safe/resolveProxyReferences',
		source: `const a = ['']; const b = a; const c = b[0];`,
		expected: `const a = [''];\nconst b = a;\nconst c = a[0];`,
	},
	{
		enabled: true,
		looped: true,
		name: 'resolveProxyVariables - TP-1',
		func: __dirname + '/../src/modules/safe/resolveProxyVariables',
		source: `const a2b = atob; console.log(a2b('NDI='));`,
		expected: `console.log(atob('NDI='));`,
	},
	{
		enabled: true,
		looped: true,
		name: 'resolveProxyVariables - TP-2',
		func: __dirname + '/../src/modules/safe/resolveProxyVariables',
		source: `const a2b = atob, a = 3; console.log(a2b('NDI='));`,
		expected: `const a = 3;\nconsole.log(atob('NDI='));`,
	},
	{
		enabled: true,
		name: 'resolveRedundantLogicalExpressions - TP-1',
		func: __dirname + '/../src/modules/safe/resolveRedundantLogicalExpressions',
		source: `if (false && true) {} if (false || true) {} if (true && false) {} if (true || false) {}`,
		expected: `if (false) {\n}\nif (true) {\n}\nif (false) {\n}\nif (true) {\n}`,
	},
	{
		enabled: true,
		name: 'unwrapFunctionShells - TP-1',
		func: __dirname + '/../src/modules/safe/unwrapFunctionShells',
		source: `function a(x) {return function b() {return x + 3}.apply(this, arguments);}`,
		expected: `function b(x) {\n  return x + 3;\n}`,
	},
	{
		enabled: true,
		name: 'unwrapFunctionShells - TP-2',
		func: __dirname + '/../src/modules/safe/unwrapFunctionShells',
		source: `function a(x) {return function() {return x + 3}.apply(this, arguments);}`,
		expected: `function a(x) {\n  return x + 3;\n}`,
	},
	{
		enabled: true,
		name: 'unwrapIIFEs - TP-1 (arrow functions)',
		func: __dirname + '/../src/modules/safe/unwrapIIFEs',
		source: `var a = (() => {
      return b => {
        return c(b - 40);
      };
    })();`,
		expected: `var a = b => {\n  return c(b - 40);\n};`,
	},
	{
		enabled: true,
		name: 'unwrapIIFEs - TP-2 (function expression)',
		func: __dirname + '/../src/modules/safe/unwrapIIFEs',
		source: `var a = (function () {
  return b => c(b - 40);
})();`,
		expected: `var a = b => c(b - 40);`,
	},
	{
		enabled: true,
		name: 'unwrapIIFEs - TP-3 (inline unwrapping)',
		func: __dirname + '/../src/modules/safe/unwrapIIFEs',
		source: `!function() {
	var a = 'message';
	console.log(a);
}();`,
		expected: `var a = 'message';\nconsole.log(a);`,
	},
	{
		enabled: true,
		name: 'unwrapIIFEs - TN-1 (unary declarator init)',
		func: __dirname + '/../src/modules/safe/unwrapIIFEs',
		source: `var b = !function() {
	var a = 'message';
	console.log(a);
}();`,
		expected: `var b = !function() {\n\tvar a = 'message';\n\tconsole.log(a);\n}();`,
	},
	{
		enabled: true,
		name: 'unwrapIIFEs - TN-2 (unary assignment right)',
		func: __dirname + '/../src/modules/safe/unwrapIIFEs',
		source: `b = !function() {
	var a = 'message';
	console.log(a);
}();`,
		expected: `b = !function() {\n\tvar a = 'message';\n\tconsole.log(a);\n}();`,
	},
	{
		enabled: true,
		name: 'unwrapSimpleOperations - TP-1',
		func: __dirname + '/../src/modules/safe/unwrapSimpleOperations',
		source: `function add(b,c){return b + c;}
function minus(b,c){return b - c;}
function mul(b,c){return b * c;}
function div(b,c){return b / c;}
function power(b,c){return b ** c;}
function and(b,c){return b && c;}
function band(b,c){return b & c;}
function or(b,c){return b || c;}
function bor(b,c){return b | c;}
function xor(b,c){return b ^ c;}
add(1, 2);
minus(1, 2);
mul(1, 2);
div(1, 2);
power(1, 2);
and(1, 2);
band(1, 2);
or(1, 2);
bor(1, 2);
xor(1, 2);`,
		expected: `function add(b, c) {
  return b + c;
}
function minus(b, c) {
  return b - c;
}
function mul(b, c) {
  return b * c;
}
function div(b, c) {
  return b / c;
}
function power(b, c) {
  return b ** c;
}
function and(b, c) {
  return b && c;
}
function band(b, c) {
  return b & c;
}
function or(b, c) {
  return b || c;
}
function bor(b, c) {
  return b | c;
}
function xor(b, c) {
  return b ^ c;
}
1 + 2;
1 - 2;
1 * 2;
1 / 2;
1 ** 2;
1 && 2;
1 & 2;
1 || 2;
1 | 2;
1 ^ 2;`,
	},
	{
		enabled: true,
		name: 'separateChainedDeclarators - TP-1',
		func: __dirname + '/../src/modules/safe/separateChainedDeclarators',
		source: `const foo = 5, bar = 7;`,
		expected: `const foo = 5;\nconst bar = 7;`,
	},
	{
		enabled: true,
		name: 'separateChainedDeclarators - TP-2',
		func: __dirname + '/../src/modules/safe/separateChainedDeclarators',
		source: `const a = 1; let foo = 5, bar = 7;`,
		expected: `const a = 1;\nlet foo = 5;\nlet bar = 7;`,
	},
	{
		enabled: true,
		looped: true,
		name: 'separateChainedDeclarators - TP-3',
		func: __dirname + '/../src/modules/safe/separateChainedDeclarators',
		source: `!function() {var a, b = 2; let c, d = 3;}();`,
		expected: `!function () {\n  var a;\n  var b = 2;\n  let c;\n  let d = 3;\n}();`,
	},
	{
		enabled: true,
		looped: true,
		name: 'separateChainedDeclarators - TP-4',
		func: __dirname + '/../src/modules/safe/separateChainedDeclarators',
		source: `if (a) var b, c; while (true) var e = 3, d = 3;`,
		expected: `if (a) {\n  var b;\n  var c;\n}\nwhile (true) {\n  var e = 3;\n  var d = 3;\n}`,
	},
	{
		enabled: true,
		looped: true,
		name: 'separateChainedDeclarators - TN-1',
		func: __dirname + '/../src/modules/safe/separateChainedDeclarators',
		source: `for (let i, b = 2, c = 3;;);`,
		expected: `for (let i, b = 2, c = 3;;);`,
	},
	{
		enabled: true,
		name: 'simplifyCalls - TP-1',
		func: __dirname + '/../src/modules/safe/simplifyCalls',
		source: `func1.apply(this, [arg1, arg2]); func2.call(this, arg1, arg2);`,
		expected: `func1(arg1, arg2);\nfunc2(arg1, arg2);`,
	},

	// Unsafe
	{
		enabled: true,
		isUtil: true,
		name: 'evalInVm - TP-1',
		func: __dirname + '/../src/modules/unsafe/evalInVm',
		prepareTest: a => [a],
		prepareResult: b => b,
		source: `function a() {return console;} a();`,
		expected: {type: 'Identifier', name: 'console'},
	},
	{
		enabled: true,
		isUtil: true,
		name: 'evalInVm - TN-1',
		func: __dirname + '/../src/modules/unsafe/evalInVm',
		prepareTest: a => [a],
		prepareResult: b => b,
		source: `Math.random();`,
		expected: badValue,
	},
	{
		enabled: false,
		reason: 'TODO: Consider proper tests for function',
		name: 'evalWithDom - TP-1',
		func: __dirname + '/../src/modules/unsafe/evalWithDom',
		prepareTest: () => {},
		prepareResult: () => {},
		source: ``,
		expected: `function a(x) {\n  return x + 3;\n}`,
	},
	{
		enabled: true,
		name: 'normalizeRedundantNotOperator - TP-1',
		func: __dirname + '/../src/modules/unsafe/normalizeRedundantNotOperator',
		source: `!true || !false || !0 || !1 || !a || !'a' || ![] || !{} || !-1 || !!true || !!!true`,
		expected: `false || true || true || false || !a || false || false || false || false || true || false;`,
	},
	{
		enabled: false,
		reason: 'TODO: Consider proper tests for function',
		name: 'resolveAugmentedFunctionWrappedArrayReplacements - TP-1',
		func: __dirname + '/../src/modules/unsafe/resolveAugmentedFunctionWrappedArrayReplacements',
		source: `1`,
		expected: ``,
	},
	{
		enabled: true,
		name: 'resolveBuiltinCalls - TP-1',
		func: __dirname + '/../src/modules/unsafe/resolveBuiltinCalls',
		source: `atob('c29sdmVkIQ==');`,
		expected: `'solved!';`,
	},
	{
		enabled: true,
		name: 'resolveBuiltinCalls - TP-2',
		func: __dirname + '/../src/modules/unsafe/resolveBuiltinCalls',
		source: `btoa('solved!');`,
		expected: `'c29sdmVkIQ==';`,
	},
	{
		enabled: true,
		name: 'resolveBuiltinCalls - TP-3',
		func: __dirname + '/../src/modules/unsafe/resolveBuiltinCalls',
		source: `'ok'.split('');`,
		expected: `[\n  'o',\n  'k'\n];`,
	},
	{
		enabled: true,
		name: 'resolveBuiltinCalls - TN-1',
		func: __dirname + '/../src/modules/unsafe/resolveBuiltinCalls',
		source: `document.querySelector('div');`,
		expected: `document.querySelector('div');`,
	},
	{
		enabled: true,
		name: 'resolveBuiltinCalls - TN-2',
		func: __dirname + '/../src/modules/unsafe/resolveBuiltinCalls',
		source: `atob(x);`,
		expected: `atob(x);`,
	},
	{
		enabled: true,
		name: 'resolveBuiltinCalls - TN-3',
		func: __dirname + '/../src/modules/unsafe/resolveBuiltinCalls',
		source: `function atob() {return 1;} atob('test');`,
		expected: `function atob() {return 1;} atob('test');`,
	},
	{
		enabled: true,
		name: 'resolveDefiniteBinaryExpressions - TP-1',
		func: __dirname + '/../src/modules/unsafe/resolveDefiniteBinaryExpressions',
		source: `5 * 3; '2' + 2; '10' - 1; 'o' + 'k'; 'o' - 'k'; 3 - -1;`,
		expected: `15;\n'22';\n9;\n'ok';\nNaN;\n4;`,
	},
	{
		enabled: true,
		name: 'resolveDefiniteMemberExpressions - TP-1',
		func: __dirname + '/../src/modules/unsafe/resolveDefiniteMemberExpressions',
		source: `'123'[0]; 'hello'.length;`,
		expected: `'1';\n5;`,
	},
	{
		enabled: true,
		name: 'resolveDefiniteMemberExpressions - TN-1',
		func: __dirname + '/../src/modules/unsafe/resolveDefiniteMemberExpressions',
		source: `++[[]][0];`,
		expected: `++[[]][0];`,
	},
	{
		enabled: true,
		name: 'resolveDeterministicConditionalExpressions - TP-1',
		func: __dirname + '/../src/modules/unsafe/resolveDeterministicConditionalExpressions',
		source: `(true ? 1 : 2); (false ? 3 : 4);`,
		expected: `1;\n4;`,
	},
	{
		enabled: true,
		name: 'resolveDeterministicConditionalExpressions - TN-1',
		func: __dirname + '/../src/modules/unsafe/resolveDeterministicConditionalExpressions',
		source: `({} ? 1 : 2); ([].length ? 3 : 4);`,
		expected: `({} ? 1 : 2); ([].length ? 3 : 4);`,
	},
	{
		enabled: true,
		name: 'resolveEvalCallsOnNonLiterals - TP-1',
		func: __dirname + '/../src/modules/unsafe/resolveEvalCallsOnNonLiterals',
		source: `eval(function(a) {return a}('atob'));`,
		expected: `atob;`,
	},
	{
		enabled: true,
		name: 'resolveEvalCallsOnNonLiterals - TP-2',
		func: __dirname + '/../src/modules/unsafe/resolveEvalCallsOnNonLiterals',
		source: `eval([''][0]);`,
		expected: `''`,
	},
	{
		enabled: true,
		name: 'resolveFunctionToArray - TP-1',
		func: __dirname + '/../src/modules/unsafe/resolveFunctionToArray',
		source: `function a() {return [1];}\nconst b = a();`,
		expected: `function a() {\n  return [1];\n}\nconst b = [1];`,
	},
	{
		enabled: true,
		name: 'resolveInjectedPrototypeMethodCalls - TP-1',
		func: __dirname + '/../src/modules/unsafe/resolveInjectedPrototypeMethodCalls',
		source: `String.prototype.secret = function () {return 'secret ' + this;}; 'hello'.secret();`,
		expected: `String.prototype.secret = function () {\n  return 'secret ' + this;\n};\n'secret hello';`,
	},
	{
		enabled: true,
		name: 'resolveLocalCalls - TP-1',
		func: __dirname + '/../src/modules/unsafe/resolveLocalCalls',
		source: `function add(a, b) {return a + b;} add(1, 2);`,
		expected: `function add(a, b) {\n  return a + b;\n}\n3;`,
	},
	{
		enabled: true,
		name: 'resolveLocalCalls - TP-2',
		func: __dirname + '/../src/modules/unsafe/resolveLocalCalls',
		source: `const add = (a, b) => a + b; add(1, 2);`,
		expected: `const add = (a, b) => a + b;\n3;`,
	},
	{
		enabled: true,
		name: 'resolveLocalCalls - TP-2',
		func: __dirname + '/../src/modules/unsafe/resolveLocalCalls',
		source: `const atob = (a, b) => a + b; atob('got-');`,
		expected: `const atob = (a, b) => a + b;\n'got-undefined';`,
	},
	{
		enabled: true,
		name: 'resolveLocalCalls - TN-1',
		func: __dirname + '/../src/modules/unsafe/resolveLocalCalls',
		source: `add(1, 2);`,
		expected: `add(1, 2);`,
	},
	{
		enabled: true,
		name: 'resolveLocalCalls - TN-2',
		func: __dirname + '/../src/modules/unsafe/resolveLocalCalls',
		source: `btoa('a');`,
		expected: `btoa('a');`,
	},
	{
		enabled: true,
		name: 'resolveLocalCalls - TN-3',
		func: __dirname + '/../src/modules/unsafe/resolveLocalCalls',
		source: `function a() {} a();`,
		expected: `function a() {} a();`,
	},
	{
		enabled: true,
		name: 'resolveMinimalAlphabet - TP-1',
		func: __dirname + '/../src/modules/unsafe/resolveMinimalAlphabet',
		source: `+true; -true; +false; -false; +[]; ~true; ~false; ~[]; +[3]; +['']; -[4]; ![]; +[[]];`,
		expected: `1;\n-'1';\n0;\n-0;\n0;\n-'2';\n-'1';\n-'1';\n3;\n0;\n-'4';\nfalse;\n0;`,
	},
	{
		enabled: true,
		name: 'resolveMinimalAlphabet - TP-2',
		func: __dirname + '/../src/modules/unsafe/resolveMinimalAlphabet',
		source: `[] + []; [+[]]; (![]+[]); +[!+[]+!+[]];`,
		expected: `'';\n[0];\n'false';\n2;`,
	},
	{
		enabled: true,
		name: 'resolveMinimalAlphabet - TN-1',
		func: __dirname + '/../src/modules/unsafe/resolveMinimalAlphabet',
		source: `-false; -[]; +{}; -{}; -'a'; ~{}; -['']; +[1, 2]; +this; +[this];`,
		expected: `-0;\n-0;\n+{};\n-{};\nNaN;\n~{};\n-0;\nNaN;\n+this;\n+[this];`,
	},

	// Utils
	{
		enabled: true,
		isUtil: true,
		name: 'areReferencesModified - TP-1',
		func: __dirname + '/../src/modules/utils/areReferencesModified',
		prepareTest: src => {
			const ast = generateFlatAST(src);
			return [ast, ast.find(n => n.src === 'a = 1').id.references];
		},
		prepareResult: b => b,
		source: `let a = 1; let b = 2 + a, c = a + 3; a++;`,
		expected: true,
	},
	{
		enabled: true,
		isUtil: true,
		name: 'areReferencesModified - TP-2',
		func: __dirname + '/../src/modules/utils/areReferencesModified',
		prepareTest: src => {
			const ast = generateFlatAST(src);
			return [ast, ast.find(n => n.src === 'a = 1').id.references];
		},
		prepareResult: b => b,
		source: `let a = 1; let b = 2 + a, c = (a += 2) + 3;`,
		expected: true,
	},
	{
		enabled: true,
		isUtil: true,
		name: 'areReferencesModified - TN-1',
		func: __dirname + '/../src/modules/utils/areReferencesModified',
		prepareTest: src => {
			const ast = generateFlatAST(src);
			return [ast, ast.find(n => n.src === 'a = 1').id.references];
		},
		prepareResult: b => b,
		source: `const a = 1; let b = 2 + a, c = a + 3;`,
		expected: false,
	},
];