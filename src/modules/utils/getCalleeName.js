/**
 * @param {ASTNode} callExpression
 * @return {string} The name of the identifier / value of the literal at the base of the call expression.
 */
function getCalleeName(callExpression) {
	const callee = callExpression.callee?.object?.object || callExpression.callee?.object || callExpression.callee;
	return callee.name || callee.value;
}

export {getCalleeName};