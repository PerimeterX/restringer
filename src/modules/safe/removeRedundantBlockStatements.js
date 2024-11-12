/**
 * Remove redundant block statements which either have another block statement as their body,
 * or are a direct child of the Program node.
 * E.g.
 * if (a) {{do_a();}} ===> if (a) {do_a();}
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function removeRedundantBlockStatements(arb, candidateFilter = () => true) {
	const relevantNodes = [
		...(arb.ast[0].typeMap.BlockStatement || []),
	];
	for (let i = 0; i < relevantNodes.length; i++) {
		const n = relevantNodes[i];
		if (['BlockStatement', 'Program'].includes(n.parentNode.type) &&
		candidateFilter(n)) {
			const parent = n.parentNode;
			if (parent.body?.length > 1) {
				if (n.body.length === 1) arb.markNode(n, n.body[0]);
				else {
					const currentIdx = parent.body.indexOf(n);
					const replacementNode = {
						type: parent.type,
						body: [
							...parent.body.slice(0, currentIdx),
							...n.body,
							...parent.body.slice(currentIdx + 1)
						],
					};
					arb.markNode(parent, replacementNode);
				}
			}
			else arb.markNode(parent, n);
			if (parent.type === 'Program') break;   // No reason to continue if the root node will be replaced
		}
	}
	return arb;
}

export default removeRedundantBlockStatements;