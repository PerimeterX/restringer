const areReferencesModified = require(__dirname + '/../utils/areReferencesModified');

/**
 * When an identifier holds a static literal value, replace all references to it with the value.
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function replaceIdentifierWithFixedAssignedValue(arb, candidateFilter = () => true) {
	for (let i = 0; i < arb.ast.length; i++) {
		const n = arb.ast[i];
		if (n?.declNode?.parentNode?.init?.type === 'Literal' &&
		!(n.parentKey === 'property' && n.parentNode.type === 'ObjectExpression') &&
		candidateFilter(n)) {
			const valueNode = n.declNode.parentNode.init;
			const refs = n.declNode.references;
			if (!areReferencesModified(arb.ast, refs)) {
				for (const ref of refs) {
					arb.markNode(ref, valueNode);
				}
			}
		}
	}
	return arb;
}

module.exports = replaceIdentifierWithFixedAssignedValue;