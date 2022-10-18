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
 * @return {Arborist}
 */
function resolveInjectedPrototypeMethodCalls(arb) {
	const candidates = arb.ast.filter(n =>
		n.type === 'AssignmentExpression' &&
		n.left.type === 'MemberExpression' &&
		(n.left.object.property?.name || n.left.object.property?.value) === 'prototype' &&
		n.operator === '=' &&
		(/FunctionExpression/.test(n.right?.type) || n.right?.type === 'Identifier'));
	for (const c of candidates) {
		const methodName = c.left.property?.name || c.left.property?.value;
		const context = getDeclarationWithContext(c);
		const references = arb.ast.filter(n =>
			n.type === 'CallExpression' &&
			n.callee.type === 'MemberExpression' &&
			(n.callee.property?.name || n.callee.property?.value) === methodName);
		for (const ref of references) {
			const refContext = [
				...new Set([
					...getDeclarationWithContext(ref.callee),
					...getDeclarationWithContext(ref.callee?.object),
					...getDeclarationWithContext(ref.callee?.property),
				]),
			];
			const src = `${createOrderedSrc([...context, ...refContext])}\n${ref.src}`;
			const newNode = evalInVm(src);
			if (newNode !== badValue) arb.markNode(ref, newNode);
		}
	}
	return arb;
}

module.exports = resolveInjectedPrototypeMethodCalls;