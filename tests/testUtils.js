const assert = require('node:assert');

const tests = {
	Utils: __dirname + '/utils-tests',
};

/**
 * Generic function for verifying a utility function is behaving as expected.
 * @param testName {string} - The name of the test to be displayed
 * @param testFunc {function}   - The source code to be used
 * @param verifyFunc {function} - The expected output
 */
function testCodeSample(testName, testFunc, verifyFunc) {
	process.stdout.write(`${testName}... `);
	console.time('PASS');
	const results = testFunc();
	const expected = verifyFunc();
	assert.deepEqual(results, expected);
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
			testCodeSample(`[${moduleName}] ${test.name}`.padEnd(90, '.'), test.testFunc, test.verifyFunc);
		} else {
			skippedTests++;
			console.log(`[${moduleName}] ${test.name}...`.padEnd(101, '.') + ` SKIPPED: ${test.reason}`);
		}
	}
}
if (skippedTests > 0) {
	process.stdout.write(`Completed ${allTests - skippedTests}/${allTests} (${skippedTests} skipped) utility `);
} else process.stdout.write(`Completed ${allTests} utility `);
console.timeEnd('tests in');
