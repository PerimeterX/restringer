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
	const relevantNodes = [
		...(arb.ast[0].typeMap.VariableDeclaration || []),
	];
	for (let i = 0; i < relevantNodes.length; i++) {
		const n = relevantNodes[i];
		if (n.declarations.length > 1 &&
		!n.parentNode.type.match(/For.*Statement/) &&
		candidateFilter(n)) {
			const decls = [];
			for (const d of n.declarations) {
				decls.push({
					type: 'VariableDeclaration',
					kind: n.kind,
					declarations: [d],
				});
			}
			// Since we're inserting new nodes, we'll need to replace the parent node
			let replacementNode;
			if (Array.isArray(n.parentNode[n.parentKey])) {
				const replacedArr = n.parentNode[n.parentKey];
				const idx = replacedArr.indexOf(n);
				replacementNode = {
					...n.parentNode,
					[n.parentKey]: replacedArr.slice(0, idx).concat(decls).concat(replacedArr.slice(idx + 1)),
				};
			} else {
				// If the parent node isn't ready to accept multiple nodes, inject a block statement to hold them.
				replacementNode = {
					...n.parentNode,
					[n.parentKey]: {
						type: 'BlockStatement',
						body: decls,
					},
				};
			}
			arb.markNode(n.parentNode, replacementNode);
		}
	}
	return arb;
}

export default separateChainedDeclarators;