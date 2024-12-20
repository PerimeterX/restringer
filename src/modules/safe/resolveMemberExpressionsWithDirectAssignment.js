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
	const relevantNodes = [
		...(arb.ast[0].typeMap.MemberExpression || []),
	];
	rnLoop: for (let i = 0; i < relevantNodes.length; i++) {
		const n = relevantNodes[i];
		if (n.object.declNode &&
			n.parentNode.type === 'AssignmentExpression' &&
			n.parentNode.right.type === 'Literal' &&
			candidateFilter(n)) {
			const prop = n.property?.value || n.property?.name;
			const valueUses = [];
			for (let j = 0; j < n.object.declNode.references.length; j++) {
				/** @type {ASTNode} */
				const ref = n.object.declNode.references[j];
				if (ref.parentNode !== n && ref.parentNode.type === 'MemberExpression' &&
					prop === ref.parentNode.property[ref.parentNode.property.computed ? 'value' : 'name']) {
					// Skip if the value is reassigned
					if (ref.parentNode.parentNode.type === 'UpdateExpression' ||
						(ref.parentNode.parentNode.type === 'AssignmentExpression' && ref.parentNode.parentKey === 'left')) continue rnLoop;
					valueUses.push(ref);
				}
			}
			if (valueUses.length) {
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