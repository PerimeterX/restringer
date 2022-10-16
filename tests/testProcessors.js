const assert = require('assert');
const {generateFlatAST, generateCode, Arborist} = require('flast');

const tests = {
	processorsTests: __dirname + '/processors-tests',
};

const defaultPrepTest = c => [new Arborist(c)];
const defaultPrepRes = arb => {arb.applyChanges(); return arb.script;};

/**
 * Generic function for verifying source code is deobfuscated as expected.
 * @param {string} testName - The name of the test to be displayed.
 * @param {function} testProcs - The tested processors.
 * @param {string} source - The source code to be deobfuscated.
 * @param {string} expected - The expected output.
 * @param {function} prepTest - (optional) Function for preparing the test input.
 * @param {function} prepRes - (optional) Function for parsing the test output.
 */
function testProcessor(testName, testProcs, source, expected, prepTest = defaultPrepTest, prepRes = defaultPrepRes) {
	process.stdout.write(`Testing ${testName}... `);
	console.time('PASS');
	const testInput = prepTest(source);
	let rawRes = testInput;
	testProcs.preprocessors.forEach(proc => rawRes = proc(...(Array.isArray(rawRes) ? rawRes : [rawRes])));
	testProcs.postprocessors.forEach(proc => rawRes = proc(...(Array.isArray(rawRes) ? rawRes : [rawRes])));
	const result = prepRes(rawRes);
	assert(result === expected,
		`\n\tFAIL: deobfuscation result !== expected:\n-------------\n${result}\n\t!==\n${expected}\n-------------`);
	console.timeEnd('PASS');
}

let allTests = 0;
let skippedTests = 0;
console.time('tests in');
for (const [processorName, procTests] of Object.entries(tests)) {
	const loadedTests = require(procTests);
	for (const test of loadedTests) {
		allTests++;
		if (test.enabled) {
			testProcessor(`[${processorName}] ${test.name}`.padEnd(90, '.'), require(test.processors), test.source, test.expected, test.prepareTest, test.prepareResult);
		} else {
			skippedTests++;
			console.log(`Testing [${processorName}] ${test.name}...`.padEnd(101, '.') + ` SKIPPED: ${test.reason}`);
		}
	}
}
if (skippedTests > 0) {
	process.stdout.write(`Completed ${allTests - skippedTests}/${allTests} (${skippedTests} skipped) processors `);
} else process.stdout.write(`Completed ${allTests} processors `);
console.timeEnd('tests in');
