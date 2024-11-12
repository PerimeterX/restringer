import {propertiesThatModifyContent} from '../config.js';

/**
 * @param {ASTNode[]} ast
 * @param {ASTNode[]} refs
 * @return {boolean} true if any of the references might modify the original value; false otherwise.
 */
function areReferencesModified(ast, refs) {
	// Verify no reference is on the left side of an assignment
	return refs.some(r =>
		(r.parentKey === 'left' && ['AssignmentExpression', 'ForInStatement', 'ForOfStatement'].includes(r.parentNode.type)) ||
		// Verify no reference is part of an update expression
		r.parentNode.type === 'UpdateExpression' ||
		// Verify no variable with the same name is declared in a subscope
		(r.parentNode.type === 'VariableDeclarator' && r.parentKey === 'id') ||
		// Verify no modifying calls are executed on any of the references
		(r.parentNode.type === 'MemberExpression' &&
			(r.parentNode.parentNode.type === 'CallExpression' &&
			r.parentNode.parentNode.callee?.object === r &&
			propertiesThatModifyContent.includes(r.parentNode.property?.value || r.parentNode.property?.name)) ||
			// Verify the object's properties aren't being assigned to
			(r.parentNode.parentNode.type === 'AssignmentExpression' &&
			r.parentNode.parentKey === 'left')) ||
		// Verify there are no member expressions among the references which are being assigned to
		(r.type === 'MemberExpression' &&
			ast.some(n => n.type === 'AssignmentExpression' &&
				n.left.type === 'MemberExpression' &&
				n.left.object?.name === r.object?.name &&
				(n.left.property?.name || n.left.property?.value === r.property?.name || r.property?.value) &&
				(n.left.object.declNode && (r.object.declNode || r.object) === n.left.object.declNode))));
}

export {areReferencesModified};