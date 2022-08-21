/**
 *
 * @param {ASTNode} binaryExpression
 * @return {boolean} true if ultimately the binary expression contains only literals; false otherwise
 */
function doesBinaryExpressionContainOnlyLiterals(binaryExpression) {
	switch (binaryExpression.type) {
		case 'BinaryExpression':
			return this._doesBinaryExpressionContainOnlyLiterals(binaryExpression.left) &&
				this._doesBinaryExpressionContainOnlyLiterals(binaryExpression.right);
		case 'UnaryExpression':
			return this._doesBinaryExpressionContainOnlyLiterals(binaryExpression.argument);
		case 'Literal':
			return true;
	}
	return false;
}

module.exports = doesBinaryExpressionContainOnlyLiterals;