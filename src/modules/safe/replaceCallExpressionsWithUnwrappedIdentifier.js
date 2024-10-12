/**
 * Calls to functions which only return an identifier will be replaced with the identifier itself.
 * E.g.
 * function a() {return String}
 * a()(val) // <-- will be replaced with String(val)
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function replaceCallExpressionsWithUnwrappedIdentifier(arb, candidateFilter = () => true) {
	for (let i = 0; i < arb.ast.length; i++) {
		const n = arb.ast[i];
		if (n.type === 'CallExpression' &&
		((n.callee?.declNode?.parentNode?.type === 'VariableDeclarator' &&
				/FunctionExpression/.test(n.callee.declNode.parentNode?.init?.type)) ||
			(n.callee?.declNode?.parentNode?.type === 'FunctionDeclaration' &&
				n.callee.declNode.parentKey === 'id')) &&
		candidateFilter(n)) {
			const declBody = n.callee.declNode.parentNode?.init?.body || n.callee.declNode.parentNode?.body;
			if (!Array.isArray(declBody)) {
				// Cases where an arrow function has no block statement
				if (declBody.type === 'Identifier' || (declBody.type === 'CallExpression' && !declBody.arguments.length)) {
					for (const ref of n.callee.declNode.references) {
						arb.markNode(ref.parentNode, declBody);
					}
				} else if (declBody.type === 'BlockStatement' && declBody.body.length === 1 && declBody.body[0].type === 'ReturnStatement') {
					const arg = declBody.body[0].argument;
					if (arg.type === 'Identifier' || (arg.type === 'CallExpression' && !arg.arguments?.length)) {
						arb.markNode(n, arg);
					}
				}
			}
		}
	}
	return arb;
}

export default replaceCallExpressionsWithUnwrappedIdentifier;