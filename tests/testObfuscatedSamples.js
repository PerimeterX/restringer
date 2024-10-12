import * as fs from 'node:fs';
import * as assert from 'node:assert';
import {REstringer} from '../src/restringer.js';
import {parseCode, generateCode} from 'flast';
import {obfuscatedSamples} from './obfuscated-samples.js';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const resourcePath = './resources';
const cwd = fileURLToPath(import.meta.url).split('/').slice(0, -1).join('/');

function normalizeCode(code) {
	let normalized;
	try {
		normalized = generateCode(parseCode(code));
	} catch {
		normalized = code.replace(/[\n\r]/g, ' ');
		normalized = normalized.replace(/\s{2,}/g, ' ');
	}
	return normalized;
}

function testSampleDeobfuscation(testSampleName, testSampleFilename) {
	process.stdout.write(`'${testSampleName}' obfuscated sample...`.padEnd(60, '.'));
	console.time(' PASS');
	const obfuscatedSource = fs.readFileSync(join(cwd, testSampleFilename), 'utf-8');
	const deobfuscatedTarget = normalizeCode(fs.readFileSync(`${join(cwd, testSampleFilename)}-deob.js`, 'utf-8'));
	const restringer = new REstringer(obfuscatedSource);
	restringer.logger.setLogLevel(restringer.logger.logLevels.NONE);
	restringer.deobfuscate();
	const deobfuscationResult = normalizeCode(restringer.script);
	assert.equal(deobfuscationResult, deobfuscatedTarget, `Unexpected output for ${testSampleName}`);
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