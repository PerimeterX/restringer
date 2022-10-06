const {propertiesThatModifyContent} = require(__dirname + '/../config');

/**
 * @param {ASTNode[]} ast
 * @param {ASTNode[]} refs
 * @return {boolean} true if any of the references might modify the original value; false otherwise.
 */
function areReferencesModified(ast, refs) {
	// Verify no reference is on the left side of an assignment
	return Boolean(refs.find(r => r.parentKey === 'left' &&
			['AssignmentExpression', 'ForInStatement', 'ForOfStatement'].includes(r.parentNode.type)) ||
		// Verify no reference is part of an update expression
		refs.find(r => r.parentNode.type === 'UpdateExpression') ||
		// Verify no variable with the same name is declared in a subscope
		refs.find(r => r.parentNode.type === 'VariableDeclarator' && r.parentKey === 'id') ||
		// Verify there are no member expressions among the references which are being assigned to
		refs.find(r => r.type === 'MemberExpression' &&
			ast.find(n => n.type === 'AssignmentExpression' && n.left.src === r.src &&
				([r.object.declNode?.nodeId, r.object?.nodeId].includes(n.left.object.declNode?.nodeId)))) ||
		// Verify no modifying calls are executed on any of the references
		refs.find(r => r.parentNode.type === 'MemberExpression' &&
			r.parentNode.parentNode.type === 'CallExpression' &&
			r.parentNode.parentNode.callee?.object?.nodeId === r.nodeId &&
			propertiesThatModifyContent.includes(r.parentNode.property?.value || r.parentNode.property?.name)));
}

module.exports = areReferencesModified;