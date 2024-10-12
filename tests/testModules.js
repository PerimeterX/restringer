import * as assert from 'node:assert';
import {Arborist, utils} from 'flast';
const {logger, applyIteratively} = utils;

const tests = {
	modulesTests: './modules-tests.js',
};

const defaultPrepTest = c => [new Arborist(c)];
const defaultPrepRes = arb => {arb.applyChanges(); return arb.script;};

/**
 * Generic function for verifying source code is deobfuscated as expected.
 * @param testName {string} - The name of the test to be displayed.
 * @param testFuncImp {string} - The tested function import name.
 * @param source {string}   - The source code to be deobfuscated.
 * @param expected {string} - The expected output.
 * @param prepTest {function} - (optional) Function for preparing the test input.
 * @param prepRes {function} - (optional) Function for parsing the test output.
 */
async function testModuleOnce(testName, testFuncImp, source, expected, prepTest = defaultPrepTest, prepRes = defaultPrepRes) {
	process.stdout.write(`${testName}... `);
	console.time('PASS');
	const testInput = prepTest(source);
	let testFunc = (await import(testFuncImp)).default || await import(testFuncImp);
	if (testFunc[Symbol.toStringTag] === 'Module') testFunc = testFunc[Object.getOwnPropertyNames(testFunc)[0]];
	const rawRes = testFunc(...testInput);
	const result = prepRes(rawRes);
	assert.deepEqual(result, expected);
	console.timeEnd('PASS');
}

/**
 * Generic function for verifying source code is deobfuscated as expected.
 * @param testName {string} - The name of the test to be displayed.
 * @param testFuncImp {string} - The tested function import name.
 * @param source {string}   - The source code to be deobfuscated.
 * @param expected {string} - The expected output.
 * @param prepTest {function} - (optional) Function for preparing the test input.
 * @param prepRes {function} - (optional) Function for parsing the test output.
 */
async function testModuleInLoop(testName, testFuncImp, source, expected, prepTest = null, prepRes = null) {
	process.stdout.write(`${testName}... `);
	console.time('PASS');
	const testInput = prepTest ? prepTest(source) : source;
	let testFunc = (await import(testFuncImp)).default || await import(testFuncImp);
	if (testFunc[Symbol.toStringTag] === 'Module') testFunc = testFunc[Object.getOwnPropertyNames(testFunc)[0]];
	const rawResult = applyIteratively(testInput, [testFunc]);
	const result = prepRes ? prepRes(rawResult) : rawResult;
	assert.deepEqual(result, expected);
	console.timeEnd('PASS');
}

let allTests = 0;
let skippedTests = 0;
logger.setLogLevel(logger.logLevels.NONE);
console.time('tests in');
for (const [moduleName, moduleTests] of Object.entries(tests)) {
	const loadedTests = (await import(moduleTests)).default;
	for (const test of loadedTests) {
		allTests++;
		if (test.enabled) {
			// Tests will have the `looped` flag if they only produce the desired result after consecutive runs
			if (!test.looped) await testModuleOnce(`[${moduleName}] ${test.name}`.padEnd(90, '.'), test.func, test.source, test.expected, test.prepareTest, test.prepareResult);
			// Tests will have the `isUtil` flag if they do not return an Arborist instance (i.e. can't use applyIteratively)
			if (!test.isUtil) await testModuleInLoop(`[${moduleName}] ${test.name} (looped)`.padEnd(90, '.'), test.func, test.source, test.expected, test.prepareTest, test.prepareResult);
		} else {
			skippedTests++;
			console.log(`[${moduleName}] ${test.name}...`.padEnd(101, '.') + ` SKIPPED: ${test.reason}`);
		}
	}
}
if (skippedTests > 0) {
	process.stdout.write(`Completed ${allTests - skippedTests}/${allTests} (${skippedTests} skipped) modules `);
} else process.stdout.write(`Completed ${allTests} modules `);
console.timeEnd('tests in');
