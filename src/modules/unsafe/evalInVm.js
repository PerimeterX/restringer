const {VM} = require('vm2');
const assert = require('node:assert');
const {badValue} = require(__dirname + '/../config');
const logger = require(__dirname + '/../utils/logger');
const getObjType = require(__dirname + '/../utils/getObjType');
const generateHash = require(__dirname + '/../utils/generateHash');
const createNewNode = require(__dirname + '/../utils/createNewNode');

const badTypes = [        // Types of objects which can't be resolved in the deobfuscation context.
	'Promise',
];

const disableObjects = {  // APIs that should be disabled when running scripts in eval to avoid inconsistencies.
	Date: {},
	debugger: {},
};

const matchingObjectKeys = {
	[Object.keys(console).sort().join('')]: {type: 'Identifier', name: 'console'},
	[Object.keys(console).sort().slice(1).join('')]: {type: 'Identifier', name: 'console'}, // Alternative console without the 'Console' object
};

const trapStrings = [     // Rules for diffusing code traps.
	{
		trap: /while\s*\(\s*(true|1)\s*\)\s*\{\s*}/gi,
		replaceWith: 'while (0) {}',
	},
	{
		trap: /debugger/gi,
		replaceWith: 'debugge_',
	},
	{   // TODO: Add as many permutations of this in an efficient manner
		trap: /["']debu["']\s*\+\s*["']gger["']/gi,
		replaceWith: `"debu" + "gge_"`,
	},
];

const vmOptions = {
	timeout: 5 * 1000,
	sandbox: {...disableObjects},
	wasm: false,
};

let cache = {};
const maxCacheSize = 100;

/**
 * Eval a string in a ~safe~ VM environment
 * @param {string} stringToEval
 * @return {ASTNode|badValue} A node based on the eval result if successful; badValue string otherwise.
 */
function evalInVm(stringToEval) {
	const cacheName = `eval-${generateHash(stringToEval)}`;
	if (cache[cacheName] === undefined) {
		if (Object.keys(cache).length >= maxCacheSize) cache = {};
		cache[cacheName] = badValue;
		try {
			// Break known trap strings
			trapStrings.forEach(ts => stringToEval = stringToEval.replace(ts.trap, ts.replaceWith));
			const res = (new VM(vmOptions)).run(stringToEval);
			// noinspection JSUnresolvedVariable
			if (!res?.VMError && !badTypes.includes(getObjType(res))) {
				// If the result is a builtin object / function, return a matching identifier
				const objKeys = Object.keys(res).sort().join('');
				if (matchingObjectKeys[objKeys]) cache[cacheName] = matchingObjectKeys[objKeys];
				else {
					// To exclude results based on randomness or timing, eval again and compare results
					const res2 = (new VM(vmOptions)).run(stringToEval);
					assert.deepEqual(res, res2);
					cache[cacheName] = createNewNode(res);
				}
			}
		} catch (e) {
			logger.debug(`[-] Error in _evalInVm: ${e.message}`);
		}
	}
	return cache[cacheName];
}

module.exports = evalInVm;