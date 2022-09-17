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
		if (c.parentNode.body?.length > 1) {
			if (c.body.length === 1) arb.markNode(c, c.body[0]);
			else {
				const currentIdx = c.parentNode.body.indexOf(c);
				const replacementNode = {
					type: 'BlockStatement',
					body: [...c.parentNode.body.slice(0, currentIdx), ...c.body, ...c.parentNode.body.slice(currentIdx + 1)],
				};
				arb.markNode(c.parentNode, replacementNode);
			}
		}
		else arb.markNode(c.parentNode, c);
	}
	return arb;
}

module.exports = consolidateNestedBlockStatements;