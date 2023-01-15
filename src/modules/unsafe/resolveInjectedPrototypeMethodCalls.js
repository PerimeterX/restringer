const evalInVm = require(__dirname + '/evalInVm');
const {badValue} = require(__dirname + '/../config');
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
	const candidates = arb.ast.filter(n =>
		n.type === 'AssignmentExpression' &&
		n.left.type === 'MemberExpression' &&
		(n.left.object.property?.name || n.left.object.property?.value) === 'prototype' &&
		n.operator === '=' &&
		(/FunctionExpression|Identifier/.test(n.right?.type)) &&
		candidateFilter(n));

	for (const c of candidates) {
		const methodName = c.left.property?.name || c.left.property?.value;
		const context = getDeclarationWithContext(c);
		const references = arb.ast.filter(n =>
			n.type === 'CallExpression' &&
			n.callee.type === 'MemberExpression' &&
			(n.callee.property?.name || n.callee.property?.value) === methodName);

		for (const ref of references) {
			const src = `${createOrderedSrc(context)}\n${createOrderedSrc([ref])}`;
			const newNode = evalInVm(src);
			if (newNode !== badValue) arb.markNode(ref, newNode);
		}
	}
	return arb;
}

module.exports = resolveInjectedPrototypeMethodCalls;