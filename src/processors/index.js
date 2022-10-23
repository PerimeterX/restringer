/**
 * Mapping specific obfuscation type to their processors, which are lazily loaded.
 */
module.exports = {
	'caesar_plus': () => require(__dirname + '/caesarp.js'),
	'obfuscator.io': () => require(__dirname + '/obfuscatorIo.js'),
	'augmented_array_replacements': () => require(__dirname + '/augmentedArray.js'),
	'function_to_array_replacements': () => require(__dirname + '/functionToArray.js'),
	'proxied_augmented_array_replacements': () => require(__dirname + '/augmentedArray.js'),
	'augmented_array_function_replacements': () => require(__dirname + '/augmentedArray.js'),
	'proxied_augmented_array_function_replacements': () => require(__dirname + '/augmentedArray.js'),
};
