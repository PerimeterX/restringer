/**
 *
 * @param {ASTNode} targetNode
 * @param {function} condition
 * @param {boolean} [returnNode] Return the node that matches the condition
 * @return {boolean|ASTNode}
 */
function doesDescendantMatchCondition(targetNode, condition, returnNode = false) {
	const stack = [targetNode];
	while (stack.length) {
		const currentNode = stack.pop();
		if (condition(currentNode)) return returnNode ? currentNode : true;
		if (currentNode.childNodes?.length) stack.push(...currentNode.childNodes);
	}
	return false;
}

export {doesDescendantMatchCondition};