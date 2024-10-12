/**
 * @param {string} val
 * @return {string}
 */
function btoa(val) {
	return Buffer.from(val).toString('base64');
}

export {btoa};