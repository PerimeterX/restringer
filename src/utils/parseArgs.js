function printHelp() {
	return `
REstringer - a JavaScript deobfuscator

Usage: restringer input_filename [-h] [-c] [-q|-v] [-o [output_filename]]

positional arguments:
	input_filename    The obfuscated JS file

optional arguments:
  -h, --help                      Show this help message and exit.
  -c, --clean                     Remove dead nodes from script after deobfuscation is complete (unsafe).
  -q, --quiet                     Suppress output to stdout. Output result only to stdout if the -o option is not set.
                                  Does not go with the -v option.
  -v, --verbose                   Show more debug messages while deobfuscating. Does not go with the -q option.
  -o, --output [output_filename]  Write deobfuscated script to output_filename. 
                                  Use <input_filename>-deob.js if no filename is provided.`;
}

function parseArgs(args) {
	let opts;
	try {
		const inputFilename = args.splice(0, 1)[0];
		opts = {
			inputFilename,
			help: args.includes('-h') || args.includes('--help'),
			clean: args.includes('-c') || args.includes('--clean'),
			quiet: args.includes('-q') || args.includes('--quiet'),
			verbose: args.includes('-v') || args.includes('--verbose'),
			outputToFile: args.includes('-o') || args.includes('--output'),
			outputFilename: `${inputFilename}-deob.js`,
		};
		if (opts.outputToFile) {
			const outFileIdx = (~args.indexOf('-o') ? args.indexOf('-o') : args.indexOf('--output')) + 1;
			if (args[outFileIdx] && args[outFileIdx][0] !== '-') opts.outputFilename = opts[outFileIdx];
		}
	} catch {}
	return opts;
}

module.exports = {
	parseArgs,
	printHelp,
};