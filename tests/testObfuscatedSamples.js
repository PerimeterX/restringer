const fs = require('fs');
const assert = require('assert');
const obfuscatedSamples = require(__dirname + '/obfuscated-samples');
const {REstringer} = require(__dirname + '/..');


const resourcePath = __dirname + '/resources';

function testSampleDeobfuscation(testSampleName, testSampleFilename) {
	process.stdout.write(`Testing '${testSampleName}' obfuscated sample...`.padEnd(60, '.'));
	console.time(' PASS');
	const obfuscatedSource = fs.readFileSync(testSampleFilename, 'utf-8');
	const deobfuscatedTarget = fs.readFileSync(`${testSampleFilename}-deob.js`, 'utf-8')
		.replace(/[\n\r]/g, ' ').replace(/\s{2,}/g, ' ');
	const restringer = new REstringer(obfuscatedSource);
	restringer.deobfuscate();
	const deobfuscationResult = restringer.script.replace(/[\n\r]/g, ' ').replace(/\s{2,}/g, ' ');
	assert(deobfuscationResult === deobfuscatedTarget,
		`Deobfuscation result of '${testSampleName}' does not match the expected result!\nEXPECTED:\n${deobfuscatedTarget}\n\nOUTPUT:\n${deobfuscationResult}`);
	console.timeEnd(' PASS');
}

let counter = 0;
console.time('tests in');
for (const [sampleName, sampleFilename] of Object.entries(obfuscatedSamples)) {
	counter++;
	testSampleDeobfuscation(`${sampleName}`, `${resourcePath}/${sampleFilename}`);
}
process.stdout.write(`Completed ${counter} obfuscation sample `);
console.timeEnd('tests in');