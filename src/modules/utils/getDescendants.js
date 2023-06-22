/**
 * @param {ASTNode} targetNode
 * @return {ASTNode[]} A flat array of all decendants of the target node
 */
function getDescendants(targetNode) {
	/** @type {ASTNode[]} */
	const offsprings = [];
	/** @type {ASTNode[]} */
	const stack = [targetNode];
	while (stack.length) {
		const currentNode = stack.pop();
		const childNodes = currentNode.childNodes || [];
		for (let i = 0; i < childNodes.length; i++) {
			const childNode = childNodes[i];
			if (!offsprings.includes(childNode)) {
				offsprings.push(childNode);
				stack.push(childNode);
			}
		}
	}
	return offsprings;
}

module.exports = getDescendants;