const assert = require('assert');
const {REstringer} = require(__dirname + '/..');

const tests = {
	genericDeobfuscationTests: __dirname + '/deobfuscation-tests',
};

/**
 * Generic function for verifying source code is deobfuscated as expected.
 * @param testName {string} - The name of the test to be displayed
 * @param source {string}   - The source code to be deobfuscated
 * @param expected {string} - The expected output
 */
function testCodeSample(testName, source, expected) {
	process.stdout.write(`Testing ${testName}... `);
	console.time('PASS');
	const restringer = new REstringer(source);
	restringer.deobfuscate();
	assert((restringer.script === expected ||
			restringer.script.replace(/'/g, '"') === expected.replace(/'/g, '"') ||
			restringer.script.replace(/"/g, `'`) === expected.replace(/"/g, `'`)),
	`\n\tFAIL: deobfuscation result !== expected:\n-------------\n${restringer.script}\n\t!==\n${expected}\n-------------`);
	console.timeEnd('PASS');
}

let allTests = 0;
let skippedTests = 0;
console.time('tests in');
for (const [moduleName, moduleTests] of Object.entries(tests)) {
	const loadedTests = require(moduleTests);
	for (const test of loadedTests) {
		allTests++;
		if (test.enabled) {
			testCodeSample(`[${moduleName}] ${test.name}`.padEnd(90, '.'), test.source, test.expected);
		} else {
			skippedTests++;
			console.log(`Testing [${moduleName}] ${test.name}...`.padEnd(101, '.') + ` SKIPPED: ${test.reason}`);
		}
	}
}
if (skippedTests > 0) {
	process.stdout.write(`Completed ${allTests - skippedTests}/${allTests} (${skippedTests} skipped) deobfuscation `);
} else process.stdout.write(`Completed ${allTests} deobfuscation `);
console.timeEnd('tests in');
