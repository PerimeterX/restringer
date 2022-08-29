const availableTests = {
	Modules: __dirname + '/testModules',
	Deobfuscation: __dirname + '/testDeobfuscations',
	'Obfuscated Sample': __dirname + '/testObfuscatedSamples',
};
console.time('\nAll tests completed in');
let exception = '';
for (const [testName, testFile] of Object.entries(availableTests)) {
	console.log(`\n----------> ${testName} <----------`);
	try {
		require(testFile);
	} catch (e) {
		exception = e.message;
		break;
	}
}
console.timeEnd('\nAll tests completed in');
if (exception) {
	console.error(exception);
	process.exit(1);
}