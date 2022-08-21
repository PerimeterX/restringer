/**
 * Calls to functions which only return an identifier will be replaced with the identifier itself.
 * E.g.
 * function a() {return String}
 * a()(val) // <-- will be replaced with String(val)
 * @param {Arborist} arb
 * @return {Arborist}
 */
function replaceCallExpressionsWithUnwrappedIdentifier(arb) {
	const candidates = arb.ast.filter(n =>
		n.type === 'CallExpression' &&
		n.callee?.declNode &&
		((n.callee.declNode.parentNode.type === 'VariableDeclarator' &&
				/FunctionExpression/.test(n.callee.declNode.parentNode?.init?.type)) ||
			(n.callee.declNode.parentNode.type === 'FunctionDeclaration' &&
				n.callee.declNode.parentKey === 'id')));
	for (const c of candidates) {
		const declBody = c.callee.declNode.parentNode?.init?.body || c.callee.declNode.parentNode?.body;
		if (!Array.isArray(declBody)) {
			// Cases where an arrow function has no block statement
			if (declBody.type === 'Identifier' || (declBody.type === 'CallExpression' && !declBody.arguments.length)) {
				for (const ref of c.callee.declNode.references) {
					arb.markNode(ref.parentNode, declBody);
				}
			}
		} else if (declBody.length === 1) {
			// TODO: complete
			//       Cases where there's only a single return statement in the block statement
		}
	}
	return arb;
}

module.exports = replaceCallExpressionsWithUnwrappedIdentifier;