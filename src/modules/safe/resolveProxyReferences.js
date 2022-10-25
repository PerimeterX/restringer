const getDescendants = require(__dirname + '/../utils/getDescendants');
const areReferencesModified = require(__dirname + '/../utils/areReferencesModified');
const getMainDeclaredObjectOfMemberExpression = require(__dirname + '/../utils/getMainDeclaredObjectOfMemberExpression');

/**
 * Replace variables which only point at other variables and do not change, with their target.
 * E.g.
 * const a = [...];
 * const b = a;
 * const c = b[0];  // <-- will be replaced with `const c = a[0];`
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function resolveProxyReferences(arb, candidateFilter = () => true) {
	const candidates = arb.ast.filter(n =>
		(n.type === 'VariableDeclarator' &&
			['Identifier', 'MemberExpression'].includes(n.id.type) &&
			['Identifier', 'MemberExpression'].includes(n.init?.type)) &&
		!/For.*Statement/.test(n.parentNode?.parentNode?.type) &&
		candidateFilter(n));

	for (const c of candidates) {
		const relevantIdentifier = getMainDeclaredObjectOfMemberExpression(c.id)?.declNode || c.id;
		const refs = relevantIdentifier.references || [];
		const replacementNode = c.init;
		const replacementMainIdentifier = getMainDeclaredObjectOfMemberExpression(c.init)?.declNode;
		if (replacementMainIdentifier && replacementMainIdentifier === relevantIdentifier) continue;
		// Exclude changes in the identifier's own init
		if (getDescendants(c.init).find(n => n.declNode === relevantIdentifier)) continue;
		if (refs.length && !areReferencesModified(arb.ast, refs) && !areReferencesModified(arb.ast, [replacementNode])) {
			for (const ref of refs) {
				arb.markNode(ref, replacementNode);
			}
		}
	}
	return arb;
}

module.exports = resolveProxyReferences;