/**
 * Remove redundant block statements which have another block statement as their body.
 * E.g.
 * if (a) {{do_a();}} ===> if (a) {do_a();}
 * @param {Arborist} arb
 * @return {Arborist}
 */
function consolidateNestedBlockStatements(arb) {
	const candidates = arb.ast.filter(n =>
		n.type === 'BlockStatement' &&
		n.parentNode.type === 'BlockStatement');
	for (const c of candidates) {
		arb.markNode(c.parentNode, c);
	}
	return arb;
}

module.exports = consolidateNestedBlockStatements;