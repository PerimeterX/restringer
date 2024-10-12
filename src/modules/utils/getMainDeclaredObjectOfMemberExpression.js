/**
 * If this member expression is a part of another member expression - return the first parentNode
 * which has a declaration in the code.
 * E.g. a.b[c.d] --> if candidate is c.d, the c identifier will be returned.
 * a.b.c.d --> if the candidate is c.d, the 'a' identifier will be returned.
 * @param {ASTNode} memberExpression
 * @return {ASTNode} The main object with an available declaration
 */
function getMainDeclaredObjectOfMemberExpression(memberExpression) {
	let mainObject = memberExpression;
	while (mainObject && !mainObject.declNode && mainObject.type === 'MemberExpression') mainObject = mainObject.object;
	return mainObject;
}

export {getMainDeclaredObjectOfMemberExpression};