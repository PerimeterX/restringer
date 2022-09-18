/**
 * Functions which only return a single literal or identifier will have their references replaced with the actual return value.
 * @param {Arborist} arb
 * @return {Arborist}
 */
function replaceFunctionShellsWithWrappedValueIIFE(arb) {
	const candidates = arb.ast.filter(n =>
		n.type === 'FunctionExpression' &&
		n.parentKey === 'callee' &&
		!n.parentNode.arguments.length &&
		n.body?.body?.length === 1 &&
		n.body.body[0].type === 'ReturnStatement' &&
		['Literal', 'Identifier'].includes(n.body.body[0].argument?.type))
		.map(n => n.parentNode);
	for (const c of candidates) {
		const replacementNode = c.callee.body.body[0].argument;
		arb.markNode(c, replacementNode);
	}
	return arb;
}

module.exports = replaceFunctionShellsWithWrappedValueIIFE;