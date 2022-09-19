const {generateFlatAST} = require('flast');

/**
 * Typical for packers, function constructor calls where the last argument
 * is a code snippet, should be replaced with the code nodes.
 * @param {Arborist} arb
 * @return {Arborist}
 */
function resolveFunctionConstructorCalls(arb) {
	const candidates = arb.ast.filter(n =>
		n.type === 'CallExpression' &&
		n.callee?.type === 'MemberExpression' &&
		[n.callee.property?.name, n.callee.property?.value].includes('constructor') &&
		n.arguments.length && n.arguments.slice(-1)[0].type === 'Literal');
	for (const c of candidates) {
		// TODO: Without the next line we get an anonymous function. Is that bad?
		if (!['VariableDeclarator', 'AssignmentExpression'].includes(c.parentNode.type)) continue;
		let args = '';
		if (c.arguments.length > 1) {
			const originalArgs = c.arguments.slice(0, -1);
			if (originalArgs.filter(n => n.type !== 'Literal').length) continue;
			args = originalArgs.map(n => n.value).join(', ');
		}
		// Wrap the code in a valid anonymous function in the same way Function.constructor would.
		// Give the anonymous function any arguments it may require.
		// Wrap the function in an expression to make it a valid code (since it's anonymous).
		// Generate an AST without nodeIds (to avoid duplicates with the rest of the code).
		// Extract just the function expression from the AST.
		const codeNode = generateFlatAST(`(function (${args}) {${c.arguments.slice(-1)[0].value}})`, {detailed: false})[2];
		if (codeNode) arb.markNode(c, codeNode);
	}
	return arb;
}

module.exports = resolveFunctionConstructorCalls;