/**
 * Functions which only return a single literal or identifier will have their references replaced with the actual return value.
 * @param {Arborist} arb
 * @return {Arborist}
 */
function replaceFunctionShellsWithWrappedValue(arb) {
	const candidates = arb.ast.filter(n =>
		n.type === 'FunctionDeclaration' &&
		n.body?.body?.length === 1 &&
		n.body.body[0].type === 'ReturnStatement' &&
		['Literal', 'Identifier'].includes(n.body.body[0].argument?.type));
	for (const c of candidates) {
		const replacementNode = c.body.body[0].argument;
		for (const ref of (c.id?.references || [])) {
			arb.markNode(ref.parentNode, replacementNode);
		}
	}
	return arb;
}

module.exports = replaceFunctionShellsWithWrappedValue;