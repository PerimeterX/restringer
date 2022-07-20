const availableTests = {
	Deobfuscation: __dirname + '/testDeobfuscations',
	'Obfuscated Sample': __dirname + '/testObfuscatedSamples',
};
console.time('\nAll tests completed in');
for (const [testName, testFile] of Object.entries(availableTests)) {
	console.log(`\n----------> ${testName} <----------`);
	require(testFile);
}
console.timeEnd('\nAll tests completed in');
