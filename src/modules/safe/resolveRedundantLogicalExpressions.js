/**
 * Remove redundant logical expressions which will always resolve in the same way.
 * E.g.
 * if (false && ...) do_a(); else do_b(); ==> do_b();
 * if (... || true) do_c(); else do_d(); ==> do_c();
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function resolveRedundantLogicalExpressions(arb, candidateFilter = () => true) {
	const candidates = arb.ast.filter(n =>
		n.type === 'IfStatement' &&
		n.test.type === 'LogicalExpression' &&
		candidateFilter(n));

	for (const c of candidates) {
		if (c.test.operator === '&&') {
			if (c.test.left.type === 'Literal') {
				if (c.test.left.value) {
					arb.markNode(c.test, c.test.right);
				} else {
					arb.markNode(c.test, c.test.left);
				}
			} else if (c.test.right.type === 'Literal') {
				if (c.test.right.value) {
					arb.markNode(c.test, c.test.left);
				} else {
					arb.markNode(c.test, c.test.right);
				}
			}
		} else if (c.test.operator === '||') {
			if (c.test.left.type === 'Literal') {
				if (c.test.left.value) {
					arb.markNode(c.test, c.test.left);
				} else {
					arb.markNode(c.test, c.test.right);
				}
			} else if (c.test.right.type === 'Literal') {
				if (c.test.right.value) {
					arb.markNode(c.test, c.test.right);
				} else {
					arb.markNode(c.test, c.test.left);
				}
			}
		}
	}
	return arb;
}

module.exports = resolveRedundantLogicalExpressions;