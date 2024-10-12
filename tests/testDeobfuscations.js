import * as assert from 'node:assert';
import {REstringer} from '../index.js';

const tests = {
	genericDeobfuscationTests: './deobfuscation-tests.js',
};

/**
 * Generic function for verifying source code is deobfuscated as expected.
 * @param testName {string} - The name of the test to be displayed
 * @param source {string}   - The source code to be deobfuscated
 * @param expected {string} - The expected output
 */
function testCodeSample(testName, source, expected) {
	process.stdout.write(`${testName}... `);
	console.time('PASS');
	const restringer = new REstringer(source);
	restringer.logger.setLogLevel(restringer.logger.logLevels.NONE);
	restringer.deobfuscate();
	assert.equal(restringer.script, expected);
	console.timeEnd('PASS');
}

let allTests = 0;
let skippedTests = 0;
console.time('tests in');
for (const [moduleName, moduleTests] of Object.entries(tests)) {
	const loadedTests = (await import(moduleTests)).default;
	for (const test of loadedTests) {
		allTests++;
		if (test.enabled) {
			testCodeSample(`[${moduleName}] ${test.name}`.padEnd(90, '.'), test.source, test.expected);
		} else {
			skippedTests++;
			console.log(`[${moduleName}] ${test.name}...`.padEnd(101, '.') + ` SKIPPED: ${test.reason}`);
		}
	}
}
if (skippedTests > 0) {
	process.stdout.write(`Completed ${allTests - skippedTests}/${allTests} (${skippedTests} skipped) deobfuscation `);
} else process.stdout.write(`Completed ${allTests} deobfuscation `);
console.timeEnd('tests in');
