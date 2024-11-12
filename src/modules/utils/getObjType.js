/**
 * @param {*} unknownObject
 * @return {string} The type of whatever object is provided if possible; empty string otherwise.
 */
function getObjType(unknownObject) {
	return ({}).toString.call(unknownObject).slice(8, -1);
}

export {getObjType};