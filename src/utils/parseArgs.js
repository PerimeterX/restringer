function printHelp() {
	return `
REstringer - a JavaScript deobfuscator

Usage: restringer input_filename [-h] [-c] [-q|-v] [-m M] [-o [output_filename]]

positional arguments:
	input_filename    The obfuscated JS file

optional arguments:
  -h, --help                      Show this help message and exit.
  -c, --clean                     Remove dead nodes from script after deobfuscation is complete (unsafe).
  -q, --quiet                     Suppress output to stdout. Output result only to stdout if the -o option is not set.
                                  Does not go with the -v option.
  -m, --max-iterations M          Run at most M iterations
  -v, --verbose                   Show more debug messages while deobfuscating. Does not go with the -q option.
  -o, --output [output_filename]  Write deobfuscated script to output_filename. 
                                  Use <input_filename>-deob.js if no filename is provided.`;
}

function parseArgs(args) {
	let opts;
	try {
		const inputFilename = args[0] && args[0][0] !== '-' ? args[0] : '';
		opts = {
			inputFilename,
			help: args.includes('-h') || args.includes('--help'),
			clean: args.includes('-c') || args.includes('--clean'),
			quiet: args.includes('-q') || args.includes('--quiet'),
			verbose: args.includes('-v') || args.includes('--verbose'),
			outputToFile: args.includes('-o') || args.includes('--output'),
			maxIterations: args.includes('-m') || args.includes('--max-iterations'),
			outputFilename: `${inputFilename}-deob.js`,
		};
		if (opts.outputToFile) {
			const outFileIdx = (~args.indexOf('-o') ? args.indexOf('-o') : args.indexOf('--output')) + 1;
			if (args[outFileIdx] && args[outFileIdx][0] !== '-') opts.outputFilename = opts[outFileIdx];
		}
		if (opts.maxIterations) {
			const maxItersIdx = (~args.indexOf('-m') ? args.indexOf('-m') : args.indexOf('--max-iterations')) + 1;
			if (args[maxItersIdx] && args[maxItersIdx][0] !== '-') opts.maxIterations = Number(args[maxItersIdx]);
		}
	} catch {}
	return opts;
}

/**
 * If the arguments are invalid print the correct error message and return false.
 * @param {object} args The parsed arguments
 * @returns {boolean} true if all arguments are valid; false otherwise.
 */
function argsAreValid(args) {
	if (args.help) console.log(printHelp());
	else if (!args.inputFilename) console.log(`Error: Input filename must be provided`);
	else if (args.verbose && args.quiet) console.log(`Error: Don't set both -q and -v at the same time *smh*`);
	else if (args.maxIterations === true) console.log(`Error: --max-iterations requires a number (e.g. --max-iterations 12)`);
	else return true;
	return false;
}

// noinspection JSUnusedGlobalSymbols
module.exports = {
	argsAreValid,
	parseArgs,
	printHelp,
};