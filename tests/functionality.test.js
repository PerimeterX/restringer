import assert from 'node:assert';
import {describe, it} from 'node:test';
import {REstringer} from '../src/restringer.js';


describe('Functionality tests', () => {
	it('Set max iterations', () => {
		const code = `eval('eval("eval(3)")')`;
		const restringer = new REstringer(code);
		restringer.logger.setLogLevelNone();
		restringer.maxIterations.value = 3;
		restringer.deobfuscate();
		assert.strictEqual(restringer.script, 'eval(3);');
	});
	it('REstringer.__version__ is populated', () => {
		assert.ok(REstringer.__version__);
	});
});
