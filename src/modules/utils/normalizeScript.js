const runLoop = require(__dirname + '/runLoop');
const normalizeComputed = require(__dirname + '/../safe/normalizeComputed');
const normalizeEmptyStatements = require(__dirname + '/../safe/normalizeEmptyStatements');
const normalizeRedundantNotOperator = require(__dirname + '/../unsafe/normalizeRedundantNotOperator');

/**
 * Make the script more readable without actually deobfuscating or affecting its functionality.
 * @param {string} script
 * @return {string} The normalized script.
 */
function normalizeScript(script) {
	return runLoop(script, [
		normalizeComputed,
		normalizeRedundantNotOperator,
		normalizeEmptyStatements,
	]);
}

module.exports = normalizeScript;