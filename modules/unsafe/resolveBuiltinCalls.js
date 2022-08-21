const evalInVm = require(__dirname + '/evalInVm');
const logger = require(__dirname + '/../utils/logger');
const createNewNode = require(__dirname + '/../utils/createNewNode');
const safeImplementations = require(__dirname + '/../utils/safeImplementations');
const {skipBuiltinFunctions, skipIdentifiers, skipProperties} = require(__dirname + '/../config');

/**
 * Resolve calls to builtin functions (like atob or String(), etc...).
 * Use safe implmentations of known functions when available.
 * @param {Arborist} arb
 * @return {Arborist}
 */
function resolveBuiltinCalls(arb) {
	const availableSafeImplementations = Object.keys(safeImplementations);
	const callsWithOnlyLiteralArugments = arb.ast.filter(n =>
		n.type === 'CallExpression' &&
		!n.arguments.filter(a => a.type !== 'Literal').length);
	const candidates = callsWithOnlyLiteralArugments.filter(n =>
		n.callee.type === 'Identifier' &&
		!n.callee.declNode &&
		!skipBuiltinFunctions.includes(n.callee.name));
	candidates.push(...callsWithOnlyLiteralArugments.filter(n =>
		n.callee.type === 'MemberExpression' &&
		!n.callee.object.declNode &&
		!skipIdentifiers.includes(n.callee.object?.name) &&
		!skipProperties.includes(n.callee.property?.name || n.callee.property?.value)));
	candidates.push(...this._ast.filter(n =>
		n.type === 'CallExpression' &&
		availableSafeImplementations.includes((n.callee.name))));
	for (const c of candidates) {
		try {
			const callee = c.callee;
			const safeImplementation = safeImplementations[callee.name];
			if (safeImplementation) {
				const args = c.arguments.map(a => a.value);
				const tempValue = safeImplementation(...args);
				if (tempValue) {
					arb.markNode(c, createNewNode(tempValue, logger));
				}
			} else {
				const newNode = evalInVm(c.src, logger);
				arb.markNode(c, newNode);
			}
		} catch {}
	}
	return arb;
}

module.exports = resolveBuiltinCalls;