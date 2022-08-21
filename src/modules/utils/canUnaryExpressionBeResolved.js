/**
 * @param {ASTNode} argument
 * @return {boolean} true if unary expression's argument can be resolved (i.e. independent of other identifier); false otherwise.
 */
function canUnaryExpressionBeResolved(argument) {
	switch (argument.type) {                    // Examples for each type of argument which can be resolved:
		case 'ArrayExpression':
			return !argument.elements.length;       // ![]
		case 'ObjectExpression':
			return !argument.properties.length;     // !{}
		case 'Identifier':
			return argument.name === 'undefined';   // !undefined
		case 'TemplateLiteral':
			return !argument.expressions.length;    // !`template literals with no expressions`
		case 'UnaryExpression':
			return canUnaryExpressionBeResolved(argument.argument);
	}
	return true;
}

module.exports = canUnaryExpressionBeResolved;