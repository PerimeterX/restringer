const {generateCode, parseCode} = require('flast');

const badValue = '--BAD-VAL--';   // Internal value used to indicate eval failed

/**
 * @param {*} unknownObject
 * @return {string} The type of whatever object is provided if possible; empty string otherwise.
 */
function getObjType(unknownObject) {
	const match = ({}).toString.call(unknownObject).match(/\[object (.*)]/);
	return match ? match[1] : '';
}


/**
 * Create a node from a value by its type.
 * @param {*} value The value to be parsed into an ASTNode.
 * @param {object} logger (optional) logging functions.
 * @returns {ASTNode|string} The newly created node if successful; badValue string otherwise.
 */
function createNewNode(value, logger = {debugErr: () => {}}) {
	let newNode = badValue;
	try {
		if (![undefined, null].includes(value) && value.__proto__.constructor.name === 'Node') value = generateCode(value);
		switch (getObjType(value)) {
			case 'String':
			case 'Number':
			case 'Boolean':
				if (['-', '+', '!'].includes(String(value)[0]) && String(value).length > 1) {
					newNode = {
						type: 'UnaryExpression',
						operator: String(value)[0],
						argument: createNewNode(String(value).substring(1)),
					};
				} else if (['Infinity', 'NaN'].includes(String(value))) {
					newNode = {
						type: 'Identifier',
						name: String(value),
					};
				} else {
					newNode = {
						type: 'Literal',
						value: value,
						raw: String(value),
					};
				}
				break;
			case 'Array': {
				const elements = [];
				for (const el of Array.from(value)) {
					elements.push(createNewNode(el));
				}
				newNode = {
					type: 'ArrayExpression',
					elements,
				};
				break;
			}
			case 'Object': {
				const properties = [];
				for (const [k, v] of Object.entries(value)) {
					const key = createNewNode(k);
					const val = createNewNode(v);
					if ([key, val].includes(badValue)) {
						// noinspection ExceptionCaughtLocallyJS
						throw Error();
					}
					properties.push({
						type: 'Property',
						key,
						value: val,
					});
				}
				newNode = {
					type: 'ObjectExpression',
					properties,
				};
				break;
			}
			case 'Undefined':
				newNode = {
					type: 'Identifier',
					name: 'undefined',
				};
				break;
			case 'Null':
				newNode = {
					type: 'Literal',
					raw: 'null',
				};
				break;
			case 'Function': // Covers functions and classes
				try {
					newNode = parseCode(value).body[0];
				} catch {}  // Probably a native function
		}
	} catch (e) {
		logger.debugErr(`[-] Unable to create a new node: ${e}`, 1);
	}
	return newNode;
}

module.exports = {
	badValue,
	getObjType,
	createNewNode,
};