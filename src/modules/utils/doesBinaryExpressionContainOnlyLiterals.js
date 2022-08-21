/**
 *
 * @param {ASTNode} binaryExpression
 * @return {boolean} true if ultimately the binary expression contains only literals; false otherwise
 */
function doesBinaryExpressionContainOnlyLiterals(binaryExpression) {
	switch (binaryExpression.type) {
		case 'BinaryExpression':
			return doesBinaryExpressionContainOnlyLiterals(binaryExpression.left) &&
				doesBinaryExpressionContainOnlyLiterals(binaryExpression.right);
		case 'UnaryExpression':
			return doesBinaryExpressionContainOnlyLiterals(binaryExpression.argument);
		case 'Literal':
			return true;
	}
	return false;
}

module.exports = doesBinaryExpressionContainOnlyLiterals;