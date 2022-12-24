/**
 * Function To Array Replacements
 * The obfuscated script dynamically generates an array which is referenced throughout the script.
 */
const {
	unsafe: {
		resolveFunctionToArray,
	},
} = require(__dirname + '/../modules');


module.exports = {
	preprocessors: [resolveFunctionToArray],
	postprocessors: [],
};
