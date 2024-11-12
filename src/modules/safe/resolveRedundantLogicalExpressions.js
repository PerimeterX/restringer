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
	const relevantNodes = [
		...(arb.ast[0].typeMap.IfStatement || []),
	];
	for (let i = 0; i < relevantNodes.length; i++) {
		const n = relevantNodes[i];
		if (n.test.type === 'LogicalExpression' &&
		candidateFilter(n)) {
			if (n.test.operator === '&&') {
				if (n.test.left.type === 'Literal') {
					if (n.test.left.value) {
						arb.markNode(n.test, n.test.right);
					} else {
						arb.markNode(n.test, n.test.left);
					}
				} else if (n.test.right.type === 'Literal') {
					if (n.test.right.value) {
						arb.markNode(n.test, n.test.left);
					} else {
						arb.markNode(n.test, n.test.right);
					}
				}
			} else if (n.test.operator === '||') {
				if (n.test.left.type === 'Literal') {
					if (n.test.left.value) {
						arb.markNode(n.test, n.test.left);
					} else {
						arb.markNode(n.test, n.test.right);
					}
				} else if (n.test.right.type === 'Literal') {
					if (n.test.right.value) {
						arb.markNode(n.test, n.test.right);
					} else {
						arb.markNode(n.test, n.test.left);
					}
				}
			}
		}
	}
	return arb;
}

export default resolveRedundantLogicalExpressions;