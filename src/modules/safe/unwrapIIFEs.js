/**
 * Replace IIFEs that are unwrapping a function with the unwraped function.
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function unwrapIIFEs(arb, candidateFilter = () => true) {
	const candidates = arb.ast.filter(n =>
		n.type === 'CallExpression' &&
		!n.arguments.length &&
		['ArrowFunctionExpression', 'FunctionExpression'].includes(n.callee.type) &&
		!n.callee.id &&
		// IIFEs with a single return statement
		(((
			n.callee.body.type !== 'BlockStatement' ||
			(
				n.callee.body.body.length === 1 &&
				n.callee.body.body[0].type === 'ReturnStatement')
		) &&
		n.parentKey === 'init') ||
		// Generic IIFE wrappers
		(n.parentKey === 'ExpressionStatement' ||
			n.parentKey === 'argument' &&
			n.parentNode.type === 'UnaryExpression')) &&
		candidateFilter(n));

	for (const c of candidates) {
		let targetNode = c;
		let replacementNode = c.callee.body;
		if (replacementNode.type === 'BlockStatement') {
			let targetChild = replacementNode;
			// IIFEs with a single return statement
			if (replacementNode.body?.length === 1 && replacementNode.body[0].argument) replacementNode = replacementNode.body[0].argument;
			// IIFEs with multiple statements or expressions
			else while (targetNode && !targetNode.body) {
				targetChild = targetNode;
				targetNode = targetNode.parentNode;
			}
			if (!targetNode || !targetNode.body) targetNode = c;
			else {
				// Place the wrapped code instead of the wrapper node
				replacementNode = {
					...targetNode,
					body: [...targetNode.body.filter(n => n !== targetChild), ...replacementNode.body],
				};
			}
		}
		arb.markNode(targetNode, replacementNode);
	}
	return arb;
}

module.exports = unwrapIIFEs;