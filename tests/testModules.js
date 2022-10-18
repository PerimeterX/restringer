const assert = require('node:assert');
const {Arborist} = require('flast');
const {runLoop} = require(__dirname + '/../src/modules').utils;

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
function testModuleOnce(testName, testFunc, source, expected, prepTest = defaultPrepTest, prepRes = defaultPrepRes) {
	process.stdout.write(`Testing ${testName}... `);
	console.time('PASS');
	const testInput = prepTest(source);
	const rawRes = testFunc(...testInput);
	const result = prepRes(rawRes);
	assert.equal(result, expected);
	console.timeEnd('PASS');
}

/**
 * Generic function for verifying source code is deobfuscated as expected.
 * @param testName {string} - The name of the test to be displayed.
 * @param testFunc {function} - The tested function.
 * @param source {string}   - The source code to be deobfuscated.
 * @param expected {string} - The expected output.
 * @param prepTest {function} - (optional) Function for preparing the test input.
 * @param prepRes {function} - (optional) Function for parsing the test output.
 */
function testModuleInLoop(testName, testFunc, source, expected, prepTest = null, prepRes = null) {
	process.stdout.write(`Testing ${testName}... `);
	console.time('PASS');
	const testInput = prepTest ? prepTest(source) : source;
	const rawResult = runLoop(testInput, [testFunc]);
	const result = prepRes ? prepRes(rawResult) : rawResult;
	assert.equal(result, expected);
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
			// Tests will have the `looped` flag if they only produce the desired result after consecutive runs
			if (!test.looped) testModuleOnce(`[${moduleName}] ${test.name}`.padEnd(90, '.'), require(test.func), test.source, test.expected, test.prepareTest, test.prepareResult);
			// Tests will have the `isUtil` flag if they do not return an Arborist instance (i.e. can't use runLoop)
			if (!test.isUtil) testModuleInLoop(`[${moduleName}] ${test.name} (looped)`.padEnd(90, '.'), require(test.func), test.source, test.expected, test.prepareTest, test.prepareResult);
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
