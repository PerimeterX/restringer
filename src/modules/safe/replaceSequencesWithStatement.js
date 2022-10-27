/**
 * All expressions within a sequence will be replaced by their own expression statement.
 * E.g. if (a) (b(), c()); -> if (a) { b(); c(); }
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function replaceSequencesWithStatement(arb, candidateFilter = () => true) {
	const candidates = arb.ast.filter(n =>
		n.type === 'ExpressionStatement' &&
		n.expression.type === 'SequenceExpression' &&
		candidateFilter(n)
	);

	for (const c of candidates) {
		const parent = c.parentNode;
		const statements = c.expression.expressions.map(e => ({
			type: 'ExpressionStatement',
			expression: e
		}));

		if (parent.type === 'BlockStatement') {
			// Insert between other children
			const currentIdx = parent.body.indexOf(c);
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
			arb.markNode(c, blockStatement);
		}
	}

	return arb;
}

module.exports = replaceSequencesWithStatement;