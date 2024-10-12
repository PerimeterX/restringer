const availableTests = {
	Utils: './testUtils.js',
	Modules: './testModules.js',
	Processors: './testProcessors.js',
	Deobfuscation: './testDeobfuscations.js',
	'Obfuscated Sample': './testObfuscatedSamples.js',
};

console.time('\nAll tests completed in');
// let exception = '';
for (const [testName, testFile] of Object.entries(availableTests)) {
	const padLength = Math.floor((120 - testName.length - 4) / 2);
	console.log(`\n${'>'.padStart(padLength, '-')} ${testName} ${'<'.padEnd(padLength, '-')}`);
	await import(testFile);
}
console.timeEnd('\nAll tests completed in');
