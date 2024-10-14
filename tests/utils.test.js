import assert from 'node:assert';
import {describe, it} from 'node:test';
import {argsAreValid, parseArgs} from '../src/utils/parseArgs.js';
const consolelog = console.log;

describe('parseArgs tests', () => {
	it('TP-1: Defaults', () => {
		assert.deepEqual(parseArgs([]), {
			inputFilename: '',
			help: false,
			clean: false,
			quiet: false,
			verbose: false,
			outputToFile: false,
			maxIterations: false,
			outputFilename: '-deob.js'
		});
	});
	it('TP-2: All on - short', () => {
		assert.deepEqual(parseArgs(['input.js', '-h', '-c', '-q', '-v', '-o', '-m']), {
			inputFilename: 'input.js',
			help: true,
			clean: true,
			quiet: true,
			verbose: true,
			outputToFile: true,
			maxIterations: true,
			outputFilename: 'input.js-deob.js'
		});
	});
	it('TP-3: All on - full', () => {
		assert.deepEqual(parseArgs(['input.js', '--help', '--clean', '--quiet', '--verbose', '--output', '--max-iterations']), {
			inputFilename: 'input.js',
			help: true,
			clean: true,
			quiet: true,
			verbose: true,
			outputToFile: true,
			maxIterations: true,
			outputFilename: 'input.js-deob.js'
		});
	});
	it('TP-4: Custom outputFilename split', () => {
		assert.deepEqual(parseArgs(['input.js', '-o', 'customName.js']), {
			inputFilename: 'input.js',
			help: false,
			clean: false,
			quiet: false,
			verbose: false,
			outputToFile: true,
			maxIterations: false,
			outputFilename: 'customName.js'
		});
	});
	it('TP-5: Custom outputFilename equals', () => {
		assert.deepEqual(parseArgs(['input.js', '-o=customName.js']), {
			inputFilename: 'input.js',
			help: false,
			clean: false,
			quiet: false,
			verbose: false,
			outputToFile: true,
			maxIterations: false,
			outputFilename: 'customName.js'
		});
	});
	it('TP-6: Custom outputFilename full', () => {
		assert.deepEqual(parseArgs(['input.js', '--output=customName.js']), {
			inputFilename: 'input.js',
			help: false,
			clean: false,
			quiet: false,
			verbose: false,
			outputToFile: true,
			maxIterations: false,
			outputFilename: 'customName.js'
		});
	});
	it('TP-7: Max iterations short equals', () => {
		assert.deepEqual(parseArgs(['input.js', '-m=2']), {
			inputFilename: 'input.js',
			help: false,
			clean: false,
			quiet: false,
			verbose: false,
			outputToFile: false,
			maxIterations: 2,
			outputFilename: 'input.js-deob.js'
		});
	});
	it('TP-8: Max iterations short split', () => {
		assert.deepEqual(parseArgs(['input.js', '-m', '2']), {
			inputFilename: 'input.js',
			help: false,
			clean: false,
			quiet: false,
			verbose: false,
			outputToFile: false,
			maxIterations: 2,
			outputFilename: 'input.js-deob.js'
		});
	});
	it('TP-9: Max iterations long equals', () => {
		assert.deepEqual(parseArgs(['input.js', '--max-iterations=2']), {
			inputFilename: 'input.js',
			help: false,
			clean: false,
			quiet: false,
			verbose: false,
			outputToFile: false,
			maxIterations: 2,
			outputFilename: 'input.js-deob.js'
		});
	});
	it('TP-10: Max iterations long split', () => {
		assert.deepEqual(parseArgs(['input.js', '--max-iterations', '2']), {
			inputFilename: 'input.js',
			help: false,
			clean: false,
			quiet: false,
			verbose: false,
			outputToFile: false,
			maxIterations: 2,
			outputFilename: 'input.js-deob.js'
		});
	});
});
describe('argsAreValid tests', () => {
	it('TP-1: Input filename only', () => {
		console.log = () => {};   // Mute log
		const result = argsAreValid(parseArgs(['input.js']));
		console.log = consolelog;
		assert.ok(result);
	});
	it('TP-2: All on, no quiet, no help', () => {
		console.log = () => {};   // Mute log
		const result = argsAreValid(parseArgs(['input.js', '-m=2', '-o', 'outputfile.js', '--verbose', '-c']));
		console.log = consolelog;
		assert.ok(result);
	});
	it('TP-3: Invalidate when printing help', () => {
		console.log = () => {};   // Mute log
		const result = argsAreValid(parseArgs(['input.js', '-m=2', '-o', 'outputfile.js', '--verbose', '-c', '-h']));
		console.log = consolelog;
		assert.strictEqual(result, false);
	});
	it('TN-1: Missing input filename', () => {
		console.log = () => {};   // Mute log
		const result = argsAreValid(parseArgs([]));
		console.log = consolelog;
		assert.strictEqual(result, false);
	});
	it('TN-2: Mutually exclusive verbose and quiet', () => {
		console.log = () => {};   // Mute log
		const result = argsAreValid(parseArgs(['input.js', '-v', '-q']));
		console.log = consolelog;
		assert.strictEqual(result, false);
	});
	it('TN-3: Max iterations missing value', () => {
		console.log = () => {};   // Mute log
		const result = argsAreValid(parseArgs(['input.js', '-m']));
		console.log = consolelog;
		assert.strictEqual(result, false);
	});
	it('TN-4: Max iterations invalid value NaN', () => {
		console.log = () => {};   // Mute log
		const result = argsAreValid(parseArgs(['input.js', '-m', 'a']));
		console.log = consolelog;
		assert.strictEqual(result, false);
	});
});