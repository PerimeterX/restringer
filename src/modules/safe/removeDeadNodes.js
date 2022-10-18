const relevantParents = ['VariableDeclarator', 'AssignmentExpression', 'FunctionDeclaration', 'ClassDeclaration'];

/**
 * Remove nodes code which is only declared but never used.
 * NOTE: This is a dangerous operation which shouldn't run by default, invokations of the so-called dead code
 * may be dynamically built during execution. Handle with care.
 * @param {Arborist} arb
 * @return {Arborist}
 */
function removeDeadNodes(arb) {
	const candidates = arb.ast.filter(n =>
		n.type === 'Identifier' &&
		relevantParents.includes(n.parentNode.type) &&
		(!n?.declNode?.references?.length && !n?.references?.length))
		.map(n => n.parentNode);

	for (const c of candidates) {
		// Do not remove root nodes as they might be referenced in another script
		if (c.parentNode.type === 'Program') continue;
		arb.markNode(c?.parentNode?.type === 'ExpressionStatement' ? c.parentNode : c);
	}
	return arb;
}

module.exports = removeDeadNodes;