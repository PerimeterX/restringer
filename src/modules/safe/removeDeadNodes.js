const relevantParents = [
	'VariableDeclarator',
	'AssignmentExpression',
	'FunctionDeclaration',
	'ClassDeclaration',
];

/**
 * Remove nodes code which is only declared but never used.
 * NOTE: This is a dangerous operation which shouldn't run by default, invokations of the so-called dead code
 * may be dynamically built during execution. Handle with care.
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function removeDeadNodes(arb, candidateFilter = () => true) {
	const relevantNodes = [
		...(arb.ast[0].typeMap.Identifier || []),
	];
	for (let i = 0; i < relevantNodes.length; i++) {
		const n = relevantNodes[i];
		if (relevantParents.includes(n.parentNode.type) &&
		(!n?.declNode?.references?.length && !n?.references?.length) &&
		candidateFilter(n)) {
			const parent = n.parentNode;
			// Do not remove root nodes as they might be referenced in another script
			if (parent.parentNode.type === 'Program') continue;
			arb.markNode(parent?.parentNode?.type === 'ExpressionStatement' ? parent.parentNode : parent);
		}
	}
	return arb;
}

export default removeDeadNodes;