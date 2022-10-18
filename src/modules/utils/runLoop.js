const {Arborist} = require('flast');
const generateHash = require(__dirname + '/generateHash');
const logger = require(__dirname + '/../utils/logger');
const {defaultMaxIterations} = require(__dirname + '/../config');

let iterationsCounter = 0;

/**
 * Run functions which modify the script in a loop until they are no long effective or the maximum number of cycles is reached.
 * @param {string} script The target script to run the functions on.
 * @param {function[]} funcs
 * @param {number?} maxIterations (optional) Stop the loop after this many iterations at most.
 * @return {string} The possibly modified script.
 */
function runLoop(script, funcs, maxIterations = defaultMaxIterations) {
	let scriptSnapshot = '';
	let currentIteration = 0;
	try {
		let scriptHash = generateHash(script);
		let changesCounter = 0;
		let arborist = new Arborist(script, logger.log);
		while (arborist.ast.length && scriptSnapshot !== script && currentIteration < maxIterations) {
			const cycleStartTime = Date.now();
			scriptSnapshot = script;
			arborist.ast.forEach(n => n.scriptHash = scriptHash);   // Mark each node with the script hash to distinguish cache of different scripts.
			for (const func of funcs) {
				const funcStartTime = +new Date();
				try {
					logger.debug(`\t[!] Running ${func.name}...`);
					arborist = func(arborist);
					if (!arborist.ast.length) break;
					// If the hash doesn't exist it means the Arborist was replaced
					const numberOfNewChanges = arborist.getNumberOfChanges() + +!arborist.ast[0].scriptHash;
					if (numberOfNewChanges) {
						changesCounter += numberOfNewChanges;
						logger.log(`\t[+] ${func.name} committed ${numberOfNewChanges} new changes!`);
						arborist.applyChanges();
						script = arborist.script;
						scriptHash = generateHash(script);
						arborist.ast.forEach(n => n.scriptHash = scriptHash);
					}
				} catch (e) {
					logger.error(`[-] Error in ${func.name} (iteration #${iterationsCounter}): ${e}\n${e.stack}`);
				} finally {
					logger.debug(`\t\t[!] Running ${func.name} completed in ` +
						`${((+new Date() - funcStartTime) / 1000).toFixed(3)} seconds`);
				}
			}
			++currentIteration;
			++iterationsCounter;
			logger.log(`[+] ==> Cycle ${iterationsCounter} completed in ${(Date.now() - cycleStartTime) / 1000} seconds` +
				` with ${changesCounter ? changesCounter : 'no'} changes (${arborist.ast.length} nodes)`);
		}
		if (changesCounter) script = arborist.script;
	} catch (e) {
		logger.error(`[-] Error on loop #${iterationsCounter}: ${e}\n${e.stack}`);
	}
	return script;
}

module.exports = runLoop;