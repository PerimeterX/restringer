/**
 * Replace IIFEs that are unwrapping a function with the unwraped function.
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function unwrapIIFEs(arb, candidateFilter = () => true) {
	const candidates = arb.ast.filter(n =>
		n.type === 'CallExpression' &&
		!n.arguments.length &&
		['ArrowFunctionExpression', 'FunctionExpression'].includes(n.callee.type) &&
		!n.callee.id &&
		(
			n.callee.body.type !== 'BlockStatement' ||
			(
				n.callee.body.body.length === 1 &&
				n.callee.body.body[0].type === 'ReturnStatement')
		) &&
		n.parentKey === 'init' &&
		candidateFilter(n));

	for (const c of candidates) {
		const replacementNode = c.callee.body.type !== 'BlockStatement' ? c.callee.body : c.callee.body.body[0].argument;
		arb.markNode(c, replacementNode);
	}
	return arb;
}

module.exports = unwrapIIFEs;