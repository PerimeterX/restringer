/**
 * Safe implementations of functions to be used during deobfuscation
 */

module.exports = {
	atob: require(__dirname + '/safe-atob'),
	btoa: require(__dirname + '/safe-btoa'),
};
