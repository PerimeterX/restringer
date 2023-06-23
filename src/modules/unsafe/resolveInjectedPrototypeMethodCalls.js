const {badValue} = require(__dirname + '/../config');
const getVM = require(__dirname + '/../utils/getVM');
const logger = require(__dirname + '/../utils/logger');
const evalInVm = require(__dirname + '/../utils/evalInVm');
const createOrderedSrc = require(__dirname + '/../utils/createOrderedSrc');
const getDeclarationWithContext = require(__dirname + '/../utils/getDeclarationWithContext');

/**
 * Resolve call expressions which are defined on an object's prototype and are applied to an object's instance.
 * E.g.
 * String.prototype.secret = function() {return 'secret ' + this}
 * 'hello'.secret(); // <-- will be resolved to 'secret hello'.
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function resolveInjectedPrototypeMethodCalls(arb, candidateFilter = () => true) {
	for (let i = 0; i < arb.ast.length; i++) {
		const n = arb.ast[i];
		if (n.type === 'AssignmentExpression' &&
		n.left.type === 'MemberExpression' &&
		(n.left.object.property?.name || n.left.object.property?.value) === 'prototype' &&
		n.operator === '=' &&
		(/FunctionExpression|Identifier/.test(n.right?.type)) &&
		candidateFilter(n)) {
			try {
				const methodName = n.left.property?.name || n.left.property?.value;
				const context = getDeclarationWithContext(n);
				const contextVM = getVM();
				contextVM.run(createOrderedSrc(context));
				for (let j = 0; j < arb.ast.length; j++) {
					const ref = arb.ast[j];
					if (ref.type === 'CallExpression' &&
						ref.callee.type === 'MemberExpression' &&
						(ref.callee.property?.name || ref.callee.property?.value) === methodName) {
						const replacementNode = evalInVm(`\n${createOrderedSrc([ref])}`, contextVM);
						if (replacementNode !== badValue) arb.markNode(ref, replacementNode);
					}
				}
			} catch (e) {
				logger.debug(`[-] Error in resolveInjectedPrototypeMethodCalls: ${e.message}`);
			}
		}
	}
	return arb;
}

module.exports = resolveInjectedPrototypeMethodCalls;