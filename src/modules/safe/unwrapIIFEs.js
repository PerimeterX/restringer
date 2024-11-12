/**
 * Replace IIFEs that are unwrapping a function with the unwraped function.
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function unwrapIIFEs(arb, candidateFilter = () => true) {
	const relevantNodes = [
		...(arb.ast[0].typeMap.CallExpression || []),
	];
	candidatesLoop: for (let i = 0; i < relevantNodes.length; i++) {
		const n = relevantNodes[i];
		if (!n.arguments.length &&
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
		candidateFilter(n)) {
			let targetNode = n;
			let replacementNode = n.callee.body;
			if (replacementNode.type === 'BlockStatement') {
				let targetChild = replacementNode;
				// IIFEs with a single return statement
				if (replacementNode.body?.[0]?.argument) replacementNode = replacementNode.body[0].argument;
				// IIFEs with multiple statements or expressions
				else while (targetNode && !targetNode.body) {
					// Skip cases where IIFE is used to initialize or set a value
					if (targetNode.parentKey === 'init' || targetNode.type === 'AssignmentExpression' ) continue candidatesLoop;
					targetChild = targetNode;
					targetNode = targetNode.parentNode;
				}
				if (!targetNode?.body?.filter) targetNode = n;
				else {
					// Place the wrapped code instead of the wrapper node
					replacementNode = {
						...targetNode,
						body: [...targetNode.body.filter(t => t !== targetChild), ...replacementNode.body],
					};
				}
			}
			arb.markNode(targetNode, replacementNode);
		}
	}
	return arb;
}

export default unwrapIIFEs;