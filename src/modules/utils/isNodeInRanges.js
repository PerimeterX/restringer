/**
 * @param {ASTNode} targetNode
 * @param {number[][]} ranges
 * @return {boolean} true if the target node is contained in the provided array of ranges; false otherwise.
 */
function isNodeInRanges(targetNode, ranges) {
	const [nodeStart, nodeEnd] = targetNode.range;
	for (let i = 0; i < ranges.length; i++) {
		const [rangeStart, rangeEnd] = ranges[i];
		if (nodeStart >= rangeStart && nodeEnd <= rangeEnd) return true;
	}
	return false;
}

export {isNodeInRanges};