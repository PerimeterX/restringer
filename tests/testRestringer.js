const availableTests = {
	Utils: __dirname + '/testUtils',
	Modules: __dirname + '/testModules',
	Processors: __dirname + '/testProcessors',
	Deobfuscation: __dirname + '/testDeobfuscations',
	'Obfuscated Sample': __dirname + '/testObfuscatedSamples',
};

console.time('\nAll tests completed in');
// let exception = '';
for (const [testName, testFile] of Object.entries(availableTests)) {
	const padLength = Math.floor((120 - testName.length - 4) / 2);
	console.log(`\n${'>'.padStart(padLength, '-')} ${testName} ${'<'.padEnd(padLength, '-')}`);
	require(testFile);
}
console.timeEnd('\nAll tests completed in');
