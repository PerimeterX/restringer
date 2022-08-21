/**
 * @param {ASTNode} targetNode
 * @param {number[][]} ranges
 * @return {boolean} true if the target node is contained in the provided array of ranges; false otherwise.
 */
function isNodeInRanges(targetNode, ranges) {
	const [nodeStart, nodeEnd] = targetNode.range;
	for (const [rangeStart, rangeEnd] of ranges) {
		if (nodeStart >= rangeStart && nodeEnd <= rangeEnd) return true;
	}
	return false;
}

module.exports = isNodeInRanges;