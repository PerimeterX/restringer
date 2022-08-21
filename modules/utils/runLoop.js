const {defaultMaxIterations} = require(__dirname + '/../config');
const {Arborist, generateFlatAST, generateCode} = require('flast');
const generateScriptHash = require(__dirname + '/generateScriptHash');

/**
 * Run functions which modify the script in a loop until they are no long effective or the maximum number of cycles is reached.
 * @param {string} script The target script to run the functions on.
 * @param {function[]} funcs
 * @param {object?} logger (optional) logging functions.
 * @param {number?} maxIterations (optional) Stop the loop after this many iterations at most.
 * @return {string} The possibly modified script.
 */
function runLoop(script, funcs, maxIterations = defaultMaxIterations, logger = {log: () => {}, error: () => {}}) {
	let scriptSnapshot = '';
	let iterationsCounter = 0;
	try {
		let arborist = new Arborist(generateFlatAST(script), logger.log);
		while (scriptSnapshot !== script && iterationsCounter < maxIterations) {
			const cycleStartTime = Date.now();
			scriptSnapshot = script;
			const scriptHash = generateScriptHash(script);
			arborist.ast.forEach(n => n.scriptHash = scriptHash);   // Mark each node with the script hash to distinguish cache of different scripts.
			let lastNumberOfChanges = 0;
			// eslint-disable-next-line no-unused-vars
			for (const func of funcs) {
				const funcStartTime = +new Date();
				try {
					logger.log(`\t[!] Running ${func.name}...`, 1);
					arborist = func(arborist);
					const numberOfNewChanges = Object.keys(arborist.markedForReplacement).length + arborist.markedForDeletion.length;
					if (numberOfNewChanges > lastNumberOfChanges) {
						logger.log(`\t[+] ${func.name} committed ${numberOfNewChanges - lastNumberOfChanges} new changes!`);
						lastNumberOfChanges = numberOfNewChanges;
					}
				} catch (e) {
					logger.error(`[-] Error in ${func.name} (iteration #${iterationsCounter}): ${e}\n${e.stack}`);
				} finally {
					logger.log(`\t\t[!] Running ${func.name} completed in ` +
						`${((+new Date() - funcStartTime) / 1000).toFixed(3)} seconds`, 1);
				}
			}
			const changesMade = arborist.applyChanges() || 0;
			if (changesMade) {
				script = generateCode(arborist.ast[0]);
			}
			++iterationsCounter;
			logger.log(`[+] ==> Cycle ${iterationsCounter} completed in ${(Date.now() - cycleStartTime) / 1000} seconds` +
				` with ${changesMade ? changesMade : 'no'} changes (${arborist.ast.length} nodes)`);
			if (maxIterations) break;
		}
	} catch (e) {
		logger.error(`[-] Error on loop #${iterationsCounter}: ${e}\n${e.stack}`);
	}
	return script;
}

module.exports = runLoop;