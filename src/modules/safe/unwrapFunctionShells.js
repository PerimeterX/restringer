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
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function unwrapFunctionShells(arb, candidateFilter = () => true) {
	for (let i = 0; i < arb.ast.length; i++) {
		const n = arb.ast[i];
		if (['FunctionDeclaration', 'FunctionExpression'].includes(n.type) &&
		n.body?.body?.[0]?.type === 'ReturnStatement' &&
		(n.body.body[0].argument?.callee?.property?.name || n.body.body[0].argument?.callee?.property?.value) === 'apply' &&
		n.body.body[0].argument.arguments?.length === 2 &&
		n.body.body[0].argument.callee.object.type === 'FunctionExpression' &&
		candidateFilter(n)) {
			const replacementNode = n.body.body[0].argument.callee.object;
			if (n.id && !replacementNode.id) replacementNode.id = n.id;
			if (n.params.length && !replacementNode.params.length) replacementNode.params.push(...n.params);
			arb.markNode(n, replacementNode);
		}
	}
	return arb;
}

export default unwrapFunctionShells;