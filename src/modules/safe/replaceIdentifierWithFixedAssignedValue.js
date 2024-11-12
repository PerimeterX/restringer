import {areReferencesModified} from '../utils/areReferencesModified.js';

/**
 * When an identifier holds a static literal value, replace all references to it with the value.
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function replaceIdentifierWithFixedAssignedValue(arb, candidateFilter = () => true) {
	const relevantNodes = [
		...(arb.ast[0].typeMap.Identifier || []),
	];
	for (let i = 0; i < relevantNodes.length; i++) {
		const n = relevantNodes[i];
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

export default replaceIdentifierWithFixedAssignedValue;