import {Arborist} from 'flast';
import assert from 'node:assert';
import {describe, it} from 'node:test';

/**
 * @param {Arborist} arb
 */
function applyEachProcessor(arb) {
	return proc => {
		if (typeof proc === 'function') {
			arb = proc(arb);
			arb.applyChanges();
		}
	};
}

/**
 * @param {Arborist} arb
 * @param {{preprocessors, postprocessors}} processors
 * @return {Arborist}
 */
function applyProcessors(arb, processors) {
	processors.preprocessors.forEach(applyEachProcessor(arb));
	processors.postprocessors.forEach(applyEachProcessor(arb));
	return arb;
}

describe('Processors tests: Augmented Array', async () => {
	const targetProcessors = (await import('../src/processors/augmentedArray.js'));
	it('TP-1', () => {
		const code = `const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'a', 'b', 'c'];
(function (targetArray, numberOfShifts) {
  var augmentArray = function (counter) {
    while (--counter) {
        targetArray['push'](targetArray['shift']());
    }
  };
  augmentArray(++numberOfShifts);
}(arr, 3));`;
		const expected  = `const arr = [\n  4,\n  5,\n  6,\n  7,\n  8,\n  9,\n  10,\n  'a',\n  'b',\n  'c',\n  1,\n  2,\n  3\n];`;
		let arb = new Arborist(code);
		arb = applyProcessors(arb, targetProcessors);
		assert.strictEqual(arb.script, expected);
	});
});
describe('Processors tests: Caesar Plus', async () => {
	const targetProcessors = (await import('../src/processors/caesarp.js'));
	// TODO: Fix test
	it.skip('TP-1: FIX ME', () => {
		const code = `(function() {
	const a = document.createElement('div');
	const b = 'Y29uc29sZS5sb2co';
	const c = 'IlJFc3RyaW5nZXIiKQ==';
	a.innerHTML = b + c;
	const atb = window.atob || function (val) {return Buffer.from(val, 'base64').toString()};
	let dbt = {};
	const abc = a.innerHTML;
	dbt['toString'] = ''.constructor.constructor(atb(abc));
	dbt = dbt + "this will execute dbt's toString method";
})();`;
		const expected  = `console.log("REstringer")`;
		let arb = new Arborist(code);
		arb = applyProcessors(arb, targetProcessors);
		assert.strictEqual(arb.script, expected);
	});
});
describe('Processors tests: Function to Array', async () => {
	const targetProcessors = (await import('../src/processors/functionToArray.js'));
	it('TP-1: Independent call', () => {
		const code = `function getArr() {return ['One', 'Two', 'Three']} const a = getArr(); console.log(a[0] + ' + ' + a[1] + ' = ' + a[2]);`;
		const expected  = `function getArr() {\n  return [\n    'One',\n    'Two',\n    'Three'\n  ];\n}\nconst a = [\n  'One',\n  'Two',\n  'Three'\n];\nconsole.log(a[0] + ' + ' + a[1] + ' = ' + a[2]);`;
		let arb = new Arborist(code);
		arb = applyProcessors(arb, targetProcessors);
		assert.strictEqual(arb.script, expected);
	});
	it('TP-2: IIFE', () => {
		const code = `const a = (function(){return ['One', 'Two', 'Three']})(); console.log(a[0] + ' + ' + a[1] + ' = ' + a[2]);`;
		const expected  = `const a = [\n  'One',\n  'Two',\n  'Three'\n];\nconsole.log(a[0] + ' + ' + a[1] + ' = ' + a[2]);`;
		let arb = new Arborist(code);
		arb = applyProcessors(arb, targetProcessors);
		assert.strictEqual(arb.script, expected);
	});
	it('TN-1', () => {
		const code = `function getArr() {return ['One', 'Two', 'Three']} console.log(getArr()[0] + ' + ' + getArr()[1] + ' = ' + getArr()[2]);`;
		const expected  = code;
		let arb = new Arborist(code);
		arb = applyProcessors(arb, targetProcessors);
		assert.strictEqual(arb.script, expected);
	});
});
describe('Processors tests: Obfuscator.io', async () => {
	const targetProcessors = (await import('../src/processors/obfuscatorIo.js'));
	it('TP-1', () => {
		const code = `var a = {
  'removeCookie': function () {
    return 'dev';
  }
}`;
		const expected  = `var a = { 'removeCookie': 'function () {return "bypassed!"}' };`;
		let arb = new Arborist(code);
		arb = applyProcessors(arb, targetProcessors);
		assert.strictEqual(arb.script, expected);
	});
	it('TP-2', () => {
		const code = `var a = function (f) {
  this['JoJo'] = function () {
    return 'newState';
  }
}`;
		const expected  = `var a = function (f) {
  this['JoJo'] = 'function () {return "bypassed!"}';
};`;
		let arb = new Arborist(code);
		arb = applyProcessors(arb, targetProcessors);
		assert.strictEqual(arb.script, expected);
	});
});
