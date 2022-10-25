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
	const candidates = arb.ast.filter(n =>
		n.type === 'MemberExpression' &&
		n.object.declNode &&
		n.parentNode.type === 'AssignmentExpression' &&
		n.parentNode.right.type === 'Literal' &&
		candidateFilter(n));

	for (const c of candidates) {
		const prop = c.property?.value || c.property?.name;
		const valueUses = c.object.declNode.references.filter(n =>
			n.parentNode.type === 'MemberExpression' &&
			(n.parentNode.property.computed ?
				n.parentNode.property?.value === prop :
				n.parentNode.property?.name === prop) &&
			n.parentNode !== c)
			.map(n => n.parentNode);
		if (valueUses.length) {
			// Skip if the value is reassigned
			if (valueUses.find(n => n.parentNode.type === 'AssignmentExpression' && n.parentKey === 'left')) continue;
			if (valueUses.find(n => n.parentNode.type === 'UpdateExpression')) continue;
			const replacementNode = c.parentNode.right;
			valueUses.forEach(n => arb.markNode(n, replacementNode));
		}
	}
	return arb;
}

module.exports = resolveMemberExpressionsWithDirectAssignment;