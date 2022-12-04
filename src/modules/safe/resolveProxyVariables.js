const areReferencesModified = require(__dirname + '/../utils/areReferencesModified');

/**
 * Replace proxied variables with their intended target.
 * E.g.
 * const a2b = atob;         // This line will be removed
 * console.log(a2b('NDI=')); // This will be replaced with `console.log(atob('NDI='));`
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function resolveProxyVariables(arb, candidateFilter = () => true) {
	const candidates = [
		...new Set(arb.ast.filter(n =>
			n.type === 'VariableDeclarator' &&
			n?.init?.type === 'Identifier' &&
			candidateFilter(n)))
	];

	for (const c of candidates) {
		const refs = c.id.references || [];
		// Remove proxy assignments if there are no more references
		if (!refs.length) arb.markNode(c);
		else if (areReferencesModified(arb.ast, refs)) continue;
		else for (const ref of refs) {
			arb.markNode(ref, c.init);
		}
	}
	return arb;
}

module.exports = resolveProxyVariables;