/**
 * Logical expressions which only consist of && and || will be replaced with an if statement.
 * E.g. x && y(); -> if (x) y();
 * x || y(); -> if (!x) y();
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function replaceBooleanExpressionsWithIf(arb, candidateFilter = () => true) {
	const candidates = arb.ast.filter(n =>
		n.type === 'ExpressionStatement' &&
		(n.expression.operator === '&&' || n.expression.operator === '||') &&
		candidateFilter(n)
	);

	for (const c of candidates) {
		// || requires inverted logic (only execute the consequent if all operands are false)
		const testExpression =
			c.expression.operator === '||'
				? {
					type: 'UnaryExpression',
					operator: '!',
					argument: c.expression.left,
				}
				: c.expression.left;
		// wrap expression in statement so it results in e.g. if (x) y(); instead of if (x) (y());
		const consequentStatement = {
			type: 'ExpressionStatement',
			expression: c.expression.right,
		};
		const ifStatement = {
			type: 'IfStatement',
			test: testExpression,
			consequent: consequentStatement,
		};
		arb.markNode(c, ifStatement);
	}

	return arb;
}

module.exports = replaceBooleanExpressionsWithIf;
