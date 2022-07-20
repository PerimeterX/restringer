/**
 * Safe implementations of functions to be used during deobfuscation
 */

function atob(val) {
	return Buffer.from(val, 'base64').toString();
}

function btoa(val) {
	return Buffer.from(val).toString('base64');
}

module.exports = {
	atob,
	btoa,
};
