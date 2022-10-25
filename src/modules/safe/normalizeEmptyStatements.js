/**
 * Remove unrequired empty statements.
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function normalizeEmptyStatements(arb, candidateFilter = () => true) {
	const candidates = arb.ast.filter(n =>
		n.type === 'EmptyStatement' &&
		candidateFilter(n));

	for (const c of candidates) {
		// A for loop is sometimes used to assign variables without providing a loop body, just an empty statement.
		// If we delete that empty statement the syntax breaks
		// e.g. for (var i = 0, b = 8;;); - this is a valid for statement.
		if (!/For.*Statement/.test(c.parentNode.type)) arb.markNode(c);
	}
	return arb;
}

module.exports = normalizeEmptyStatements;