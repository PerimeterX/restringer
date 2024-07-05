const {logger} = require('flast').utils;

const minArrayLength = 20;

/**
 * Resolve member expressions to their targeted index in an array.
 * E.g.
 * const a = [1, 2, 3];  b = a[0]; c = a[2];
 * ==>
 * const a = [1, 2, 3]; b = 1; c = 3;
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function resolveMemberExpressionReferencesToArrayIndex(arb, candidateFilter = () => true) {
	for (let i = 0; i < arb.ast.length; i++) {
		const n = arb.ast[i];
		if (n.type === 'VariableDeclarator' &&
		n.init?.type === 'ArrayExpression' &&
		n.id?.references &&
		n.init.elements.length > minArrayLength &&
		candidateFilter(n)) {
			const refs = n.id.references.map(n => n.parentNode);
			for (const ref of refs) {
				if ((ref.parentNode.type === 'AssignmentExpression' && ref.parentKey === 'left') || ref.type !== 'MemberExpression') continue;
				if ((ref.property && ref.property.type !== 'Literal') || Number.isNaN(parseInt(ref.property?.value))) continue;
				try {
					arb.markNode(ref, n.init.elements[parseInt(ref.property.value)]);
				} catch (e) {
					logger.debug(`[-] Unable to mark node for replacement: ${e}`);
				}
			}
		}
	}
	return arb;
}

module.exports = resolveMemberExpressionReferencesToArrayIndex;