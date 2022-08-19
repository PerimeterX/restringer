const {VM} = require('vm2');
const {badValue, getObjType, createNewNode} = require(__dirname + '/../utils');

const badTypes = [        // Types of objects which can't be resolved in the deobfuscation context.
	'Promise',
];

const disableObjects = {  // APIs that should be disabled when running scripts in eval to avoid inconsistencies.
	Date: {},
	debugger: {},
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
};

const cache = {};

/**
 * Eval a string in a ~safe~ VM environment
 * @param {string} stringToEval
 * @param {object} logger (optional) logging functions.
 * @return {string|ASTNode} A node based on the eval result if successful; badValue string otherwise.
 */
function evalInVm(stringToEval, logger = {debugErr: () => {}}) {
	const cacheName = `eval-${stringToEval}`;
	if (cache[cacheName] === undefined) {
		cache[cacheName] = badValue;
		try {
			// Break known trap strings
			trapStrings.forEach(ts => stringToEval = stringToEval.replace(ts.trap, ts.replaceWith));
			const res = (new VM(vmOptions)).run(stringToEval);
			// noinspection JSUnresolvedVariable
			if (!res.VMError && !badTypes.includes(getObjType(res))) {
				// To exclude results based on randomness or timing, eval again and compare results
				const res2 = (new VM(vmOptions)).run(stringToEval);
				if (JSON.stringify(res) === JSON.stringify(res2)) {
					cache[cacheName] = createNewNode(res);
				}
			}
		} catch (e) {
			logger.debugErr(`[-] Error in _evalInVm: ${e}`, 1);
		}
	}
	return cache[cacheName];
}

module.exports = evalInVm;