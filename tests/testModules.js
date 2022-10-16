const assert = require('assert');
const {Arborist} = require('flast');

const tests = {
	modulesTests: __dirname + '/modules-tests',
};

const defaultPrepTest = c => [new Arborist(c)];
const defaultPrepRes = arb => {arb.applyChanges(); return arb.script;};

/**
 * Generic function for verifying source code is deobfuscated as expected.
 * @param testName {string} - The name of the test to be displayed.
 * @param testFunc {function} - The tested function.
 * @param source {string}   - The source code to be deobfuscated.
 * @param expected {string} - The expected output.
 * @param prepTest {function} - (optional) Function for preparing the test input.
 * @param prepRes {function} - (optional) Function for parsing the test output.
 */
function testModule(testName, testFunc, source, expected, prepTest = defaultPrepTest, prepRes = defaultPrepRes) {
	process.stdout.write(`Testing ${testName}... `);
	console.time('PASS');
	const testInput = prepTest(source);
	const rawRes = testFunc(...testInput);
	const result = prepRes(rawRes);
	assert(result === expected,
		`\n\tFAIL: deobfuscation result !== expected:\n-------------\n${result}\n\t!==\n${expected}\n-------------`);
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
			testModule(`[${moduleName}] ${test.name}`.padEnd(90, '.'), require(test.func), test.source, test.expected, test.prepareTest, test.prepareResult);
		} else {
			skippedTests++;
			console.log(`Testing [${moduleName}] ${test.name}...`.padEnd(101, '.') + ` SKIPPED: ${test.reason}`);
		}
	}
}
if (skippedTests > 0) {
	process.stdout.write(`Completed ${allTests - skippedTests}/${allTests} (${skippedTests} skipped) modules `);
} else process.stdout.write(`Completed ${allTests} modules `);
console.timeEnd('tests in');
