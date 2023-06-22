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
	for (let i = 0; i < arb.ast.length; i++) {
		const n = arb.ast[i];
		if (n.type === 'IfStatement' &&
		n.test.type === 'Literal' &&
		candidateFilter(n)) {
			if (n.test.value) {
				if (n.consequent) arb.markNode(n, n.consequent);
				else arb.markNode(n);
			} else {
				if (n.alternate) arb.markNode(n, n.alternate);
				else arb.markNode(n);
			}
		}
	}
	return arb;
}

module.exports = resolveDeterministicIfStatements;