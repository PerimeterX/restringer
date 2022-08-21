/**
 * @param {*} unknownObject
 * @return {string} The type of whatever object is provided if possible; empty string otherwise.
 */
function getObjType(unknownObject) {
	const match = ({}).toString.call(unknownObject).match(/\[object (.*)]/);
	return match ? match[1] : '';
}

module.exports = getObjType;