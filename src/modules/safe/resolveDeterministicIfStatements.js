/**
 * Replace if statements which will always resolve the same way with their relevant consequent or alternative.
 * E.g.
 * if (true) do_a(); else do_b(); if (false) do_c(); else do_d();
 * ==>
 * do_a(); do_d();
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function resolveDeterministicIfStatements(arb, candidateFilter = () => true) {
	const candidates = arb.ast.filter(n =>
		n.type === 'IfStatement' &&
		n.test.type === 'Literal' &&
		candidateFilter(n));

	for (const c of candidates) {
		if (c.test.value) {
			if (c.consequent) arb.markNode(c, c.consequent);
			else arb.markNode(c);
		} else {
			if (c.alternate) arb.markNode(c, c.alternate);
			else arb.markNode(c);
		}
	}
	return arb;
}

module.exports = resolveDeterministicIfStatements;