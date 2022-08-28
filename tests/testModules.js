const assert = require('assert');
const {generateFlatAST, generateCode, Arborist} = require('flast');

const tests = {
	modulesTests: __dirname + '/modules-tests',
};

/**
 * Generic function for verifying source code is deobfuscated as expected.
 * @param testName {string} - The name of the test to be displayed.
 * @param testFunc {function} - The tested function.
 * @param source {string}   - The source code to be deobfuscated.
 * @param expected {string} - The expected output.
 */
function testModule(testName, testFunc, source, expected) {
	process.stdout.write(`Testing ${testName}... `);
	console.time('PASS');
	const arborist = new Arborist(generateFlatAST(source));
	testFunc(arborist);
	arborist.applyChanges();
	const result = generateCode(arborist.ast[0]);
	assert((result === expected ||
			result.replace(/'/g, '"') === expected.replace(/'/g, '"') ||
			result.replace(/"/g, `'`) === expected.replace(/"/g, `'`)),
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
			testModule(`[${moduleName}] ${test.name}`.padEnd(90, '.'), require(test.func), test.source, test.expected);
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
