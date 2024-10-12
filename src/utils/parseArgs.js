export function printHelp() {
	return `
REstringer - a JavaScript deobfuscator

Usage: restringer input_filename [-h] [-c] [-q | -v] [-m M] [-o [output_filename]]

positional arguments:
	input_filename                  The obfuscated JS file

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

export function parseArgs(args) {
	let opts;
	try {
		const inputFilename = args[0] && args[0][0] !== '-' ? args[0] : '';
		const argsStr = args.join(' ');
		opts = {
			inputFilename,
			help: /(^|\s)(-h|--help)/.test(argsStr),
			clean: /(^|\s)(-c|--clean)/.test(argsStr),
			quiet: /(^|\s)(-q|--quiet)/.test(argsStr),
			verbose: /(^|\s)(-v|--verbose)/.test(argsStr),
			outputToFile: /(^|\s)(-o|--output)/.test(argsStr),
			maxIterations: /(^|\s)(-m|--max-iterations)/.test(argsStr),
			outputFilename: `${inputFilename}-deob.js`,
		};
		for (let i = 1; i < args.length; i++) {
			if (opts.outputToFile && /-o|--output/.exec(args[i])) {
				if (args[i].includes('=')) opts.outputFilename = args[i].split('=')[1];
				else if (args[i + 1] && args[i + 1][0] !== '-') opts.outputFilename = args[i + 1];
				break;
			} else if (opts.maxIterations && /-m|--max-iterations/.exec(args[i])) {
				if (args[i].includes('=')) opts.maxIterations = Number(args[i].split('=')[1]);
				else if (args[i + 1] && args[i + 1][0] !== '-') opts.maxIterations = Number(args[i + 1]);
			}
		}
	} catch {}
	return opts;
}

/**
 * If the arguments are invalid print the correct error message and return false.
 * @param {object} args The parsed arguments
 * @returns {boolean} true if all arguments are valid; false otherwise.
 */
export function argsAreValid(args) {
	if (args.help) console.log(printHelp());
	else if (!args.inputFilename) console.log(`Error: Input filename must be provided`);
	else if (args.verbose && args.quiet) console.log(`Error: Don't set both -q and -v at the same time *smh*`);
	else if (args.maxIterations !== false && Number.isNaN(parseInt(args.maxIterations))) console.log(`Error: --max-iterations requires a number larger than 0 (e.g. --max-iterations 12)`);
	else return true;
	return false;
}