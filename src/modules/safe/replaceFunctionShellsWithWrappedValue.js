/**
 * Functions which only return a single literal or identifier will have their references replaced with the actual return value.
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function replaceFunctionShellsWithWrappedValue(arb, candidateFilter = () => true) {
	for (let i = 0; i < arb.ast.length; i++) {
		const n = arb.ast[i];
		if (n.type === 'FunctionDeclaration' &&
		n.body.body?.[0]?.type === 'ReturnStatement' &&
		['Literal', 'Identifier'].includes(n.body.body[0]?.argument?.type) &&
		candidateFilter(n)) {
			const replacementNode = n.body.body[0].argument;
			for (const ref of (n.id?.references || [])) {
				// Make sure the function is called and not just referenced in another call expression
				if (ref.parentNode.type === 'CallExpression' && ref.parentNode.callee === ref) {
					arb.markNode(ref.parentNode, replacementNode);
				}
			}
		}
	}
	return arb;
}

export default replaceFunctionShellsWithWrappedValue;