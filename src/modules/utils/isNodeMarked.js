/**
 * @param {ASTNode} targetNode
 * @returns {boolean} true if the target node or one of its ancestors is marked for either replacement or deletion;
 *                    false otherwise.
 */
export function isNodeMarked(targetNode) {
	let n = targetNode;
	while (n) {
		if (n.isMarked) return true;
		n = n.parentNode;
	}
	return false;
}