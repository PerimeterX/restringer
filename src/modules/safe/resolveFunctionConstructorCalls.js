import {generateFlatAST} from 'flast';

/**
 * Typical for packers, function constructor calls where the last argument
 * is a code snippet, should be replaced with the code nodes.
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function resolveFunctionConstructorCalls(arb, candidateFilter = () => true) {
	const relevantNodes = [
		...(arb.ast[0].typeMap.CallExpression || []),
	];
	nodeLoop: for (let i = 0; i < relevantNodes.length; i++) {
		const n = relevantNodes[i];
		if (n.callee?.type === 'MemberExpression' &&
		(n.callee.property?.name || n.callee.property?.value) === 'constructor' &&
			candidateFilter(n)) {
			let args = '';
			let code = '';
			if (n.arguments.length > 1) {
				for (let j = 0; j < n.arguments.length; j++) {
					if (n.arguments[j].type !== 'Literal') continue nodeLoop;
					if (code) args += (args.length ? ', ' : '') + code;
					code = n.arguments[j].value;
				}
			} else code = n.arguments[0].value;
			// Wrap the code in a valid anonymous function in the same way Function.constructor would.
			// Give the anonymous function any arguments it may require.
			// Wrap the function in an expression to make it a valid code (since it's anonymous).
			// Generate an AST without nodeIds (to avoid duplicates with the rest of the code).
			// Extract just the function expression from the AST.
			try {
				const codeNode = generateFlatAST(`(function (${args}) {${code}})`,
					{detailed: false, includeSrc: false})[2];
				if (codeNode) arb.markNode(n, codeNode);
			} catch {}
		}
	}
	return arb;
}

export default resolveFunctionConstructorCalls;