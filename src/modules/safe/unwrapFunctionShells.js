/**
 * Remove functions which only return another function.
 * If params or id on the outer scope are used in the inner function - replace them on the inner function.
 * E.g.
 * function a(x) {
 *   return function() {return x + 3}
 * }
 * // will be replaced with
 * function a(x) {return x + 3}
 * @param {Arborist} arb
 * @return {Arborist}
 */
function unwrapFunctionShells(arb) {
	const candidates = arb.ast.filter(n =>
		['FunctionDeclaration', 'FunctionExpression'].includes(n.type) &&
		n.body?.body?.length === 1 &&
		n.body.body[0].type === 'ReturnStatement' &&
		(n.body.body[0].argument?.callee?.property?.name || n.body.body[0].argument?.callee?.property?.value) === 'apply' &&
		n.body.body[0].argument.arguments?.length === 2 &&
		n.body.body[0].argument.callee.object.type === 'FunctionExpression');

	for (const c of candidates) {
		const replacementNode = c.body.body[0].argument.callee.object;
		if (c.id && !replacementNode.id) replacementNode.id = c.id;
		if (c.params.length && !replacementNode.params.length) replacementNode.params.push(...c.params);
		arb.markNode(c, replacementNode);
	}
	return arb;
}

module.exports = unwrapFunctionShells;