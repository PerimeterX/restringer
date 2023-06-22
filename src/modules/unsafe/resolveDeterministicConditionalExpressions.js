const evalInVm = require(__dirname + '/../utils/evalInVm');

/**
 * Evaluate resolvable (independent) conditional expressions and replace them with their unchanged resolution.
 * E.g.
 * 'a' ? do_a() : do_b(); // <-- will be replaced with just do_a():
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function resolveDeterministicConditionalExpressions(arb, candidateFilter = () => true) {
	const candidates = arb.ast.filter(n =>
		n.type === 'ConditionalExpression' &&
		n.test.type === 'Literal' &&
		candidateFilter(n));

	for (const c of candidates) {
		const newNode = evalInVm(`Boolean(${c.test.src});`);
		if (newNode.type === 'Literal') {
			arb.markNode(c, newNode.value ? c.consequent : c.alternate);
		}
	}
	return arb;
}

module.exports = resolveDeterministicConditionalExpressions;