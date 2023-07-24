const {badValue} = require(__dirname + '/../config');
const logger = require(__dirname + '/../utils/logger');
const Sandbox = require(__dirname + '/../utils/sandbox');
const evalInVm = require(__dirname + '/../utils/evalInVm');
const createNewNode = require(__dirname + '/../utils/createNewNode');
const safeImplementations = require(__dirname + '/../utils/safeImplementations');
const {skipBuiltinFunctions, skipIdentifiers, skipProperties} = require(__dirname + '/../config');

const availableSafeImplementations = Object.keys(safeImplementations);

function isCallWithOnlyLiteralArguments(node) {
	return node.type === 'CallExpression' && !node.arguments.find(a => a.type !== 'Literal');
}

function isBuiltinIdentifier(node) {
	return node.type === 'Identifier' && !node.declNode && !skipBuiltinFunctions.includes(node.name);
}

function isSafeCall(node) {
	return node.type === 'CallExpression' && availableSafeImplementations.includes((node.callee.name));
}

function isBuiltinMemberExpression(node) {
	return node.type === 'MemberExpression' &&
	!node.object.declNode &&
	!skipBuiltinFunctions.includes(node.object?.name) &&
	!skipIdentifiers.includes(node.object?.name) &&
	!skipProperties.includes(node.property?.name || node.property?.value);
}

function isUnwantedNode(node) {
	return Boolean(node.callee?.declNode || node?.callee?.object?.declNode ||
		'ThisExpression' === (node.callee?.object?.type || node.callee?.type) ||
		'constructor' === (node.callee?.property?.name || node.callee?.property?.value));
}

/**
 * Resolve calls to builtin functions (like atob or String(), etc...).
 * Use safe implmentations of known functions when available.
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function resolveBuiltinCalls(arb, candidateFilter = () => true) {
	let sharedSb;
	for (let i = 0; i < arb.ast.length; i++) {
		const n = arb.ast[i];
		if (!isUnwantedNode(n) && candidateFilter(n) && (isSafeCall(n) ||
			(isCallWithOnlyLiteralArguments(n) && (isBuiltinIdentifier(n.callee) || isBuiltinMemberExpression(n.callee)))
		)) {
			try {
				const safeImplementation = safeImplementations[n.callee.name];
				if (safeImplementation) {
					const args = n.arguments.map(a => a.value);
					const tempValue = safeImplementation(...args);
					if (tempValue) {
						arb.markNode(n, createNewNode(tempValue));
					}
				} else {
					sharedSb = sharedSb || new Sandbox();
					const replacementNode = evalInVm(n.src, sharedSb);
					if (replacementNode !== badValue) arb.markNode(n, replacementNode);
				}
			} catch (e) {
				logger.debug(e.message);
			}
		}
	}
	return arb;
}

module.exports = resolveBuiltinCalls;