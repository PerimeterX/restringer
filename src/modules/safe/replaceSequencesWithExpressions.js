/**
 * All expressions within a sequence will be replaced by their own expression statement.
 * E.g. if (a) (b(), c()); -> if (a) { b(); c(); }
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function replaceSequencesWithExpressions(arb, candidateFilter = () => true) {
	const relevantNodes = [
		...(arb.ast[0].typeMap.ExpressionStatement || []),
	];
	for (let i = 0; i < relevantNodes.length; i++) {
		const n = relevantNodes[i];
		if (n.expression.type === 'SequenceExpression' &&
		candidateFilter(n)) {
			const parent = n.parentNode;
			const statements = n.expression.expressions.map(e => ({
				type: 'ExpressionStatement',
				expression: e
			}));
			if (parent.type === 'BlockStatement') {
				// Insert between other statements
				const currentIdx = parent.body.indexOf(n);
				/** @type {ASTNode} */
				const replacementNode = {
					type: 'BlockStatement',
					body: [
						...parent.body.slice(0, currentIdx),
						...statements,
						...parent.body.slice(currentIdx + 1)
					],
				};
				arb.markNode(parent, replacementNode);
			} else {
				// Replace expression with new block statement
				const blockStatement = {
					type: 'BlockStatement',
					body: statements
				};
				arb.markNode(n, blockStatement);
			}
		}
	}
	return arb;
}

export default replaceSequencesWithExpressions;