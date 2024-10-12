/**
 * @param {string} val
 * @return {string}
 */
function atob(val) {
	return Buffer.from(val, 'base64').toString();
}

export {atob};