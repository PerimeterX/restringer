const evalInVm = require(__dirname + '/evalInVm');
const {badValue} = require(__dirname + '/../config');
const logger = require(__dirname + '/../utils/logger');
const createNewNode = require(__dirname + '/../utils/createNewNode');
const safeImplementations = require(__dirname + '/../utils/safeImplementations');
const {skipBuiltinFunctions, skipIdentifiers, skipProperties} = require(__dirname + '/../config');

/**
 * Resolve calls to builtin functions (like atob or String(), etc...).
 * Use safe implmentations of known functions when available.
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function resolveBuiltinCalls(arb, candidateFilter = () => true) {
	const availableSafeImplementations = Object.keys(safeImplementations);
	const callsWithOnlyLiteralArugments = arb.ast.filter(n =>
		n.type === 'CallExpression' &&
		!n.arguments.find(a => a.type !== 'Literal') &&
		candidateFilter(n));

	const candidates = callsWithOnlyLiteralArugments.filter(n =>
		n.callee.type === 'Identifier' &&
		!n.callee.declNode &&
		!skipBuiltinFunctions.includes(n.callee.name));

	candidates.push(...callsWithOnlyLiteralArugments.filter(n =>
		n.callee.type === 'MemberExpression' &&
		!n.callee.object.declNode &&
		!skipBuiltinFunctions.includes(n.callee.object?.name) &&
		!skipIdentifiers.includes(n.callee.object?.name) &&
		!skipProperties.includes(n.callee.property?.name || n.callee.property?.value)));

	candidates.push(...arb.ast.filter(n =>
		n.type === 'CallExpression' &&
		availableSafeImplementations.includes((n.callee.name))));

	for (const c of candidates) {
		try {
			const callee = c.callee;
			if (callee?.declNode || callee?.object?.declNode) continue;
			const safeImplementation = safeImplementations[callee.name];
			if (safeImplementation) {
				const args = c.arguments.map(a => a.value);
				const tempValue = safeImplementation(...args);
				if (tempValue) {
					arb.markNode(c, createNewNode(tempValue));
				}
			} else {
				const newNode = evalInVm(c.src);
				if (newNode !== badValue) arb.markNode(c, newNode);
			}
		} catch (e) {
			logger.debug(e.message);
		}
	}
	return arb;
}

module.exports = resolveBuiltinCalls;