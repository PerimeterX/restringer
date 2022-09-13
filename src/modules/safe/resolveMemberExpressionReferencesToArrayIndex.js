/**
 * Resolve member expressions to their targeted index in an array.
 * E.g.
 * const a = [1, 2, 3];  b = a[0]; c = a[2];
 * ==>
 * const a = [1, 2, 3]; b = 1; c = 3;
 * @param {Arborist} arb
 * @param {object} logger
 * @return {Arborist}
 */
function resolveMemberExpressionReferencesToArrayIndex(arb, logger) {
	const minArrayLength = 20;
	const candidates = arb.ast.filter(n =>
		n.type === 'VariableDeclarator' &&
		n.init?.type === 'ArrayExpression' &&
		n.id?.references &&
		n.init.elements.length > minArrayLength);
	for (const c of candidates) {
		const refs = c.id.references.map(n => n.parentNode);
		for (const ref of refs) {
			if ((ref.parentNode.type === 'AssignmentExpression' && ref.parentKey === 'left') || ref.type !== 'MemberExpression') continue;
			else if ((ref.property && ref.property.type !== 'Literal') || Number.isNaN(parseInt(ref.property?.value))) continue;
			try {
				arb.markNode(ref, c.init.elements[parseInt(ref.property.value)]);
			} catch (e) {
				logger.error(`[-] Unable to mark node for replacement: ${e}`, 1);
			}
		}
	}
	return arb;
}

module.exports = resolveMemberExpressionReferencesToArrayIndex;