/**
 * @param {ASTNode} targetNode
 * @param {number[][]} ranges
 * @return {boolean} true if any of the ranges provided is contained by the target node; false otherwise.
 */
function doesNodeContainRanges(targetNode, ranges) {
	const [nodeStart, nodeEnd] = targetNode.range;
	for (const [rangeStart, rangeEnd] of ranges) {
		if (nodeStart <= rangeStart && nodeEnd >= rangeEnd) return true;
	}
	return false;
}

module.exports = doesNodeContainRanges;