const areReferencesModified = require(__dirname + '/../utils/areReferencesModified');

/**
 * Replace proxied variables with their intended target.
 * E.g.
 * const a2b = atob;         // This line will be removed
 * console.log(a2b('NDI=')); // This will be replaced with `console.log(atob('NDI='));`
 * @param {Arborist} arb
 * @return {Arborist}
 */
function resolveProxyVariables(arb) {
	const candidates = [...new Set(arb.ast.filter(n =>
		n.type === 'VariableDeclarator' &&
		n?.init?.type === 'Identifier'))];
	for (const c of candidates) {
		const refs = c.id.references || [];
		// Remove proxy assignments if there are no further proxies assigned
		if (!refs.find(n => ['right', 'init'].includes(n.parentKey) &&
			['AssignmentExpression', 'VariableDeclarator'].includes(n.parentNode.type))) arb.markNode(c);
		if (areReferencesModified(arb.ast, refs)) continue;
		for (const ref of refs) {
			arb.markNode(ref, c.init);
		}
	}
	return arb;
}

module.exports = resolveProxyVariables;