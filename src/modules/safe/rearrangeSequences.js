/**
 * Moves up all expressions except the last one of a returned sequence or in an if statement.
 * E.g. return a(), b(); -> a(); return b();
 * if (a(), b()); -> a(); if (b());
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function rearrangeSequences(arb, candidateFilter = () => true) {
	const candidates = arb.ast.filter(n =>
		(
			n.type === 'ReturnStatement' && n.argument?.type === 'SequenceExpression' ||
			n.type === 'IfStatement' && n.test.type === 'SequenceExpression'
		) &&
		candidateFilter(n)
	);

	for (const c of candidates) {
		const parent = c.parentNode;
		const { expressions } = c.argument || c.test;

		const statements = expressions.slice(0, -1).map(e => ({
			type: 'ExpressionStatement',
			expression: e
		}));

		const replacementNode = c.type === 'IfStatement' ? {
			type: 'IfStatement',
			test: expressions[expressions.length - 1],
			consequent: c.consequent,
			alternate: c.alternate
		} : {
			type: 'ReturnStatement',
			argument: expressions[expressions.length - 1]
		};

		if (parent.type === 'BlockStatement') {
			const currentIdx = parent.body.indexOf(c);
			const replacementParent = {
				type: 'BlockStatement',
				body: [
					...parent.body.slice(0, currentIdx),
					...statements,
					replacementNode,
					...parent.body.slice(currentIdx + 1)
				],
			};
			arb.markNode(parent, replacementParent);
		} else {
			const replacementParent = {
				type: 'BlockStatement',
				body: [
					...statements,
					replacementNode
				]
			};
			arb.markNode(c, replacementParent);
		}
	}

	return arb;
}

module.exports = rearrangeSequences;