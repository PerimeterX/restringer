/**
 * Replace proxied variables with their intended target.
 * E.g.
 * const a2b = atob;
 * console.log(a2b('NDI=')); // will be replaced with `console.log(atob('NDI='));`
 * @param {Arborist} arb
 * @return {Arborist}
 */
function resolveProxyVariables(arb) {
	const candidates = [...new Set(arb.ast.filter(n =>
		n.type === 'Identifier' &&
		n.parentKey === 'callee' &&
		n.declNode?.parentNode?.type === 'VariableDeclarator' &&
		n.declNode.parentKey === 'id' &&
		n.declNode.parentNode?.init?.type === 'Identifier')
		.map(n => n.declNode.parentNode))];
	for (const c of candidates) {
		const refs = c.id.references;
		if (!refs || refs.parentKey === 'left') continue;
		for (const ref of refs) {
			arb.markNode(ref, c.init);
		}
	}
	return arb;
}

module.exports = resolveProxyVariables;