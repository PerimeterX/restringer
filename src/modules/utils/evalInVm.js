const Sandbox = require(__dirname + '/sandbox');
const assert = require('node:assert');
const {badValue} = require(__dirname + '/../config');
const logger = require(__dirname + '/../utils/logger');
const getObjType = require(__dirname + '/../utils/getObjType');
const generateHash = require(__dirname + '/../utils/generateHash');
const createNewNode = require(__dirname + '/../utils/createNewNode');

const badTypes = [        // Types of objects which can't be resolved in the deobfuscation context.
	'Promise',
];

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

let cache = {};
const maxCacheSize = 100;

/**
 * Eval a string in an ~isolated~ environment
 * @param {string} stringToEval
 * @param {Sandbox} [sb] (optional) an existing sandbox loaded with context.
 * @return {ASTNode|badValue} A node based on the eval result if successful; badValue string otherwise.
 */
function evalInVm(stringToEval, sb) {
	const cacheName = `eval-${generateHash(stringToEval)}`;
	if (cache[cacheName] === undefined) {
		if (Object.keys(cache).length >= maxCacheSize) cache = {};
		cache[cacheName] = badValue;
		try {
			// Break known trap strings
			for (let i = 0; i < trapStrings.length; i++) {
				const ts = trapStrings[i];
				stringToEval = stringToEval.replace(ts.trap, ts.replaceWith);
			}
			let vm = sb || new Sandbox();
			let res = vm.run(stringToEval);
			// noinspection JSUnresolvedVariable
			if (vm.isReference(res) && !badTypes.includes(getObjType(res))) {
				res = res.copySync();
				// If the result is a builtin object / function, return a matching identifier
				const objKeys = Object.keys(res).sort().join('');
				if (matchingObjectKeys[objKeys]) cache[cacheName] = matchingObjectKeys[objKeys];
				else {
					// To exclude results based on randomness or timing, eval again and compare results
					vm = sb || new Sandbox();
					const res2 = vm.run(stringToEval).copySync();
					assert.deepEqual(res.toString(), res2.toString());
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