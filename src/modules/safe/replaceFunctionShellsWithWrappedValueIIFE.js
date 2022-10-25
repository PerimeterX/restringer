/**
 * Functions which only return a single literal or identifier will have their references replaced with the actual return value.
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function replaceFunctionShellsWithWrappedValueIIFE(arb, candidateFilter = () => true) {
	const candidates = arb.ast.filter(n =>
		n.type === 'FunctionExpression' &&
		n.parentKey === 'callee' &&
		!n.parentNode.arguments.length &&
		n.body?.body?.length &&
		n.body.body[0].type === 'ReturnStatement' &&
		['Literal', 'Identifier'].includes(n.body.body[0].argument?.type) &&
		candidateFilter(n))
		.map(n => n.parentNode);

	for (const c of candidates) {
		arb.markNode(c, c.callee.body.body[0].argument);
	}
	return arb;
}

module.exports = replaceFunctionShellsWithWrappedValueIIFE;