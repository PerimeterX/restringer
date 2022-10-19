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
		const parent = c.parentNode;
		if (parent.body?.length > 1) {
			if (c.body.length === 1) arb.markNode(c, c.body[0]);
			else {
				const currentIdx = parent.body.indexOf(c);
				const replacementNode = {
					type: 'BlockStatement',
					body: [
						...parent.body.slice(0, currentIdx),
						...c.body,
						...parent.body.slice(currentIdx + 1)
					],
				};
				arb.markNode(parent, replacementNode);
			}
		}
		else arb.markNode(parent, c);
	}
	return arb;
}

module.exports = consolidateNestedBlockStatements;