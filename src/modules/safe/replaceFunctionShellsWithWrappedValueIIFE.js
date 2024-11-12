/**
 * Functions which only return a single literal or identifier will have their references replaced with the actual return value.
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function replaceFunctionShellsWithWrappedValueIIFE(arb, candidateFilter = () => true) {
	for (let i = 0; i < arb.ast.length; i++) {
		const n = arb.ast[i];
		if (n.type === 'FunctionExpression' &&
		n.parentKey === 'callee' &&
		!n.parentNode.arguments.length &&
		n.body.body?.[0]?.type === 'ReturnStatement' &&
		['Literal', 'Identifier'].includes(n.body.body[0].argument?.type) &&
		candidateFilter(n)) {
			arb.markNode(n.parentNode, n.parentNode.callee.body.body[0].argument);
		}
	}
	return arb;
}

export default replaceFunctionShellsWithWrappedValueIIFE;