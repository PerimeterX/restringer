/**
 * Remove unrequired empty statements.
 * @param {Arborist} arb
 * @return {Arborist}
 */
function normalizeEmptyStatements(arb) {
	const candidates = arb.ast.filter(n => n.type === 'EmptyStatement');
	for (const c of candidates) {
		// A for loop is sometimes used to assign variables without providing a loop body, just an empty statement.
		// If we delete that empty statement the syntax breaks
		// e.g. for (var i = 0, b = 8;;); - this is a valid for statement.
		if (!/For.*Statement/.test(c.parentNode.type)) arb.markNode(c);
	}
	return arb;
}

module.exports = normalizeEmptyStatements;