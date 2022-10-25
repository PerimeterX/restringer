/**
 * Functions which only return a single literal or identifier will have their references replaced with the actual return value.
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function replaceFunctionShellsWithWrappedValue(arb, candidateFilter = () => true) {
	const candidates = arb.ast.filter(n =>
		n.type === 'FunctionDeclaration' &&
		n.body?.body?.length &&
		n.body.body[0].type === 'ReturnStatement' &&
		['Literal', 'Identifier'].includes(n.body.body[0].argument?.type) &&
		candidateFilter(n));

	for (const c of candidates) {
		const replacementNode = c.body.body[0].argument;
		for (const ref of (c.id?.references || [])) {
			arb.markNode(ref.parentNode, replacementNode);
		}
	}
	return arb;
}

module.exports = replaceFunctionShellsWithWrappedValue;