const {argsAreValid, parseArgs} = require(__dirname + '/../src/utils/parseArgs');
const consolelog = console.log;
module.exports = [
	{
		enabled: true,
		name: 'parseArgs - TP-1 - defaults',
		testFunc: () => {
			return parseArgs([]);
		},
		verifyFunc: () => {
			return {
				inputFilename: '',
				help: false,
				clean: false,
				quiet: false,
				verbose: false,
				outputToFile: false,
				maxIterations: false,
				outputFilename: '-deob.js'
			};
		},
	},
	{
		enabled: true,
		name: 'parseArgs - TP-2 - all on - short',
		testFunc: () => {
			return parseArgs(['input.js', '-h', '-c', '-q', '-v', '-o', '-m']);
		},
		verifyFunc: () => {
			return {
				inputFilename: 'input.js',
				help: true,
				clean: true,
				quiet: true,
				verbose: true,
				outputToFile: true,
				maxIterations: true,
				outputFilename: 'input.js-deob.js'
			};
		},
	},
	{
		enabled: true,
		name: 'parseArgs - TP-2 - all on - full',
		testFunc: () => {
			return parseArgs(['input.js', '--help', '--clean', '--quiet', '--verbose', '--output', '--max-iterations']);
		},
		verifyFunc: () => {
			return {
				inputFilename: 'input.js',
				help: true,
				clean: true,
				quiet: true,
				verbose: true,
				outputToFile: true,
				maxIterations: true,
				outputFilename: 'input.js-deob.js'
			};
		},
	},
	{
		enabled: true,
		name: 'parseArgs - TP-3 - custom outputFilename 1',
		testFunc: () => {
			return parseArgs(['input.js', '-o', 'customName.js']);
		},
		verifyFunc: () => {
			return {
				inputFilename: 'input.js',
				help: false,
				clean: false,
				quiet: false,
				verbose: false,
				outputToFile: true,
				maxIterations: false,
				outputFilename: 'customName.js'
			};
		},
	},
	{
		enabled: true,
		name: 'parseArgs - TP-3 - custom outputFilename 2',
		testFunc: () => {
			return parseArgs(['input.js', '-o=customName.js']);
		},
		verifyFunc: () => {
			return {
				inputFilename: 'input.js',
				help: false,
				clean: false,
				quiet: false,
				verbose: false,
				outputToFile: true,
				maxIterations: false,
				outputFilename: 'customName.js'
			};
		},
	},
	{
		enabled: true,
		name: 'parseArgs - TP-3 - custom outputFilename 3',
		testFunc: () => {
			return parseArgs(['input.js', '--output=customName.js']);
		},
		verifyFunc: () => {
			return {
				inputFilename: 'input.js',
				help: false,
				clean: false,
				quiet: false,
				verbose: false,
				outputToFile: true,
				maxIterations: false,
				outputFilename: 'customName.js'
			};
		},
	},
	{
		enabled: true,
		name: 'parseArgs - TP-4 - max iterations short 1',
		testFunc: () => {
			return parseArgs(['input.js', '-m=2']);
		},
		verifyFunc: () => {
			return {
				inputFilename: 'input.js',
				help: false,
				clean: false,
				quiet: false,
				verbose: false,
				outputToFile: false,
				maxIterations: 2,
				outputFilename: 'input.js-deob.js'
			};
		},
	},
	{
		enabled: true,
		name: 'parseArgs - TP-4 - max iterations short 2',
		testFunc: () => {
			return parseArgs(['input.js', '-m', '2']);
		},
		verifyFunc: () => {
			return {
				inputFilename: 'input.js',
				help: false,
				clean: false,
				quiet: false,
				verbose: false,
				outputToFile: false,
				maxIterations: 2,
				outputFilename: 'input.js-deob.js'
			};
		},
	},
	{
		enabled: true,
		name: 'parseArgs - TP-4 - max iterations full 1',
		testFunc: () => {
			return parseArgs(['input.js', '--max-iterations=2']);
		},
		verifyFunc: () => {
			return {
				inputFilename: 'input.js',
				help: false,
				clean: false,
				quiet: false,
				verbose: false,
				outputToFile: false,
				maxIterations: 2,
				outputFilename: 'input.js-deob.js'
			};
		},
	},
	{
		enabled: true,
		name: 'parseArgs - TP-4 - max iterations full 2',
		testFunc: () => {
			return parseArgs(['input.js', '--max-iterations', '2']);
		},
		verifyFunc: () => {
			return {
				inputFilename: 'input.js',
				help: false,
				clean: false,
				quiet: false,
				verbose: false,
				outputToFile: false,
				maxIterations: 2,
				outputFilename: 'input.js-deob.js'
			};
		},
	},
	{
		enabled: true,
		name: 'argsAreValid - TP-1 - just input filename',
		testFunc: () => {
			console.log = () => {};   // Mute log
			const res = argsAreValid(parseArgs(['input.js']));
			console.log = consolelog;
			return res;
		},
		verifyFunc: () => true,
	},
	{
		enabled: true,
		name: 'argsAreValid - TP-2 - all on (no quiet, no help)',
		testFunc: () => {
			console.log = () => {};   // Mute log
			const res = argsAreValid(parseArgs(['input.js', '-m=2', '-o', 'outputfile.js', '--verbose', '-c']));
			console.log = consolelog;
			return res;
		},
		verifyFunc: () => true,
	},
	{
		enabled: true,
		name: 'argsAreValid - TP-3 - invalidate when showing help',
		testFunc: () => {
			console.log = () => {};   // Mute log
			const res = argsAreValid(parseArgs(['input.js', '-m=2', '-o', 'outputfile.js', '--verbose', '-c', '-h']));
			console.log = consolelog;
			return res;
		},
		verifyFunc: () => false,
	},
	{
		enabled: true,
		name: 'argsAreValid - TN-1 - missing input filename',
		testFunc: () => {
			console.log = () => {};   // Mute log
			const res = argsAreValid(parseArgs([]));
			console.log = consolelog;
			return res;
		},
		verifyFunc: () => false,
	},
	{
		enabled: true,
		name: 'argsAreValid - TN-2 - mutually exclusive -v and -q',
		testFunc: () => {
			console.log = () => {};   // Mute log
			const res = argsAreValid(parseArgs(['input.js', '-v', '-q']));
			console.log = consolelog;
			return res;
		},
		verifyFunc: () => false,
	},
	{
		enabled: true,
		name: 'argsAreValid - TN-3 - max iterations without value',
		testFunc: () => {
			console.log = () => {};   // Mute log
			const res = argsAreValid(parseArgs(['input.js', '-m']));
			console.log = consolelog;
			return res;
		},
		verifyFunc: () => false,
	},
	{
		enabled: true,
		name: 'argsAreValid - TN-4 - max iterations invalid value 1',
		testFunc: () => {
			console.log = () => {};   // Mute log
			const res = argsAreValid(parseArgs(['input.js', '-m', 'a']));
			console.log = consolelog;
			return res;
		},
		verifyFunc: () => false,
	},

];