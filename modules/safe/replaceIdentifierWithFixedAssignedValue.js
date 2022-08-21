const areReferencesModified = require(__dirname + '/../utils/areReferencesModified');

/**
 * When an identifier holds a static literal value, replace all references to it with the value.
 * @param {Arborist} arb
 * @return {Arborist}
 */
function replaceIdentifierWithFixedAssignedValue(arb) {
	const candidates = arb.ast.filter(n =>
		n?.declNode?.parentNode?.init?.type === 'Literal' &&
		!(n.parentKey === 'property' && n.parentNode.type === 'ObjectExpression'));
	for (const c of candidates) {
		const valueNode = c.declNode.parentNode.init;
		const refs = c.declNode.references;
		if (!areReferencesModified(arb.ast, refs)) {
			for (const ref of refs) {
				arb.markNode(ref, valueNode);
			}
		}
	}
	return arb;
}

module.exports = replaceIdentifierWithFixedAssignedValue;