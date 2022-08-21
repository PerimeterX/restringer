/**
 * @param {ASTNode} targetNode
 * @return {ASTNode[]} A flat array of all decendants of the target node
 */
function getDescendants(targetNode) {
	const offsprings = [];
	const stack = [targetNode];
	while (stack.length) {
		const currentNode = stack.pop();
		for (const childNode of (currentNode.childNodes || [])) {
			if (!offsprings.includes(childNode)) {
				offsprings.push(childNode);
				stack.push(childNode);
			}
		}
	}
	return offsprings;
}

module.exports = getDescendants;