/**
 * Resolve the value of member expressions to objects which hold literals that were directly assigned to the expression.
 * E.g.
 * function a() {}
 * a.b = 3;
 * a.c = '5';
 * console.log(a.b + a.c);  // a.b + a.c will be replaced with '35'
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function resolveMemberExpressionsWithDirectAssignment(arb, candidateFilter = () => true) {
	for (let i = 0; i < arb.ast.length; i++) {
		const n = arb.ast[i];
		if (n.type === 'MemberExpression' &&
			n.object.declNode &&
			n.parentNode.type === 'AssignmentExpression' &&
			n.parentNode.right.type === 'Literal' &&
			candidateFilter(n)) {
			const prop = n.property?.value || n.property?.name;
			const valueUses = n.object.declNode.references.filter(ref =>
				ref.parentNode !== n && ref.parentNode.type === 'MemberExpression' &&
				prop === ref.parentNode.property[ref.parentNode.property.computed ? 'value' : 'name']);
			if (valueUses.length) {
				// Skip if the value is reassigned
				if (valueUses.some(v => v.parentNode.parentNode.type === 'UpdateExpression' ||
					(v.parentNode.parentNode.type === 'AssignmentExpression' && v.parentNode.parentKey === 'left'))) continue;
				const replacementNode = n.parentNode.right;
				for (let j = 0; j < valueUses.length; j++) {
					arb.markNode(valueUses[j].parentNode, replacementNode);
				}
			}
		}
	}
	return arb;
}

export default resolveMemberExpressionsWithDirectAssignment;