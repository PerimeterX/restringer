const {propertiesThatModifyContent} = require(__dirname + '/../config');

/**
 * @param {ASTNode[]} ast
 * @param {ASTNode[]} refs
 * @return {boolean} true if any of the references might modify the original value; false otherwise.
 */
function areReferencesModified(ast, refs) {
	// Verify no reference is on the left side of an assignment
	return Boolean(refs.filter(r => r.parentNode.type === 'AssignmentExpression' && r.parentKey === 'left').length ||
		// Verify no reference is part of an update expression
		refs.filter(r => r.parentNode.type === 'UpdateExpression').length ||
		// Verify no variable with the same name is declared in a subscope
		refs.filter(r => r.parentNode.type === 'VariableDeclarator' && r.parentKey === 'id').length ||
		// Verify there are no member expressions among the references which are being assigned to
		refs.filter(r => r.type === 'MemberExpression' &&
			(ast.filter(n => n.type === 'AssignmentExpression' && n.left.src === r.src &&
				([r.object.declNode?.nodeId, r.object?.nodeId].includes(n.left.object.declNode?.nodeId)))).length).length ||
		// Verify no modifying calls are executed on any of the references
		refs.filter(r => r.parentNode.type === 'MemberExpression' &&
			r.parentNode.parentNode.type === 'CallExpression' &&
			r.parentNode.parentNode.callee?.object?.nodeId === r.nodeId &&
			propertiesThatModifyContent.includes(r.parentNode.property?.value || r.parentNode.property?.name)).length);
}

module.exports = areReferencesModified;