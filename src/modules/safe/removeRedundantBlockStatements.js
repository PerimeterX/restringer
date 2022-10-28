/**
 * Remove redundant block statements which have another block statement as their body.
 * E.g.
 * if (a) {{do_a();}} ===> if (a) {do_a();}
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function removeRedundantBlockStatements(arb, candidateFilter = () => true) {
	const candidates = arb.ast.filter(n =>
		n.type === 'BlockStatement' &&
		['BlockStatement', 'Program'].includes(n.parentNode.type) &&
		candidateFilter(n));

	for (const c of candidates) {
		const parent = c.parentNode;
		if (parent.body?.length > 1) {
			if (c.body.length === 1) arb.markNode(c, c.body[0]);
			else {
				const currentIdx = parent.body.indexOf(c);
				const replacementNode = {
					type: parent.type,
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
		if (parent.type === 'Program') break;   // No reason to continue if the root node will be replaced
	}
	return arb;
}

module.exports = removeRedundantBlockStatements;