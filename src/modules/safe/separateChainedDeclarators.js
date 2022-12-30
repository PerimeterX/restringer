/**
 * Separate multiple variable declarators under the same variable declaration into single variable declaration->variable declarator pairs.
 * E.g.
 *  const foo = 5, bar = 7;
 *  // will be separated into
 *  const foo = 5; const foo = 7;
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function separateChainedDeclarators(arb, candidateFilter = () => true) {
	const candidates = arb.ast.filter(n =>
		n.type === 'VariableDeclaration' &&
		n.declarations.length > 1 &&
		!n.parentNode.type.match(/For.*Statement/) &&
		candidateFilter(n));

	for (const c of candidates) {
		const decls = [];
		for (const d of c.declarations) {
			decls.push({
				type: 'VariableDeclaration',
				kind: c.kind,
				declarations: [d],
			});
		}
		// Since we're inserting new nodes, we'll need to replace the parent node
		let replacementNode;
		if (Array.isArray(c.parentNode[c.parentKey])) {
			const replacedArr = c.parentNode[c.parentKey];
			const idx = replacedArr.indexOf(c);
			replacementNode = {
				...c.parentNode,
				[c.parentKey]: replacedArr.slice(0, idx).concat(decls).concat(replacedArr.slice(idx + 1)),
			};
		} else {
			// If the parent node isn't ready to accept multiple nodes, inject a block statement to hold them.
			replacementNode = {
				...c.parentNode,
				[c.parentKey]: {
					type: 'BlockStatement',
					body: decls,
				},
			};
		}
		arb.markNode(c.parentNode, replacementNode);
	}
	return arb;
}

module.exports = separateChainedDeclarators;