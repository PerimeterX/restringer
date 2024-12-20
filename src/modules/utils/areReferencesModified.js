import {propertiesThatModifyContent} from '../config.js';

/**
 * @param {ASTNode} r
 * @param {ASTNode[]} assignmentExpressions
 * @return {boolean}
 */
function isMemberExpressionAssignedTo(r, assignmentExpressions) {
	for (let i = 0; i < assignmentExpressions.length; i++) {
	  const n = assignmentExpressions[i];
	  if (n.left.type === 'MemberExpression' &&
			(n.left.object.declNode && (r.object.declNode || r.object) === n.left.object.declNode) &&
			((n.left.property?.name || n.left.property?.value) === (r.property?.name || r.property?.value))) return true;
	}
	return false;
}

/**
 * @param {ASTNode[]} ast
 * @param {ASTNode[]} refs
 * @return {boolean} true if any of the references might modify the original value; false otherwise.
 */
function areReferencesModified(ast, refs) {
	// Verify no reference is on the left side of an assignment
	for (let i = 0; i < refs.length; i++) {
		const r = refs[i];
		if ((r.parentKey === 'left' && ['AssignmentExpression', 'ForInStatement', 'ForOfStatement'].includes(r.parentNode.type)) ||
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
			isMemberExpressionAssignedTo(r, ast[0].typeMap.AssignmentExpression || []))) return true;
	}
	return false;
}

export {areReferencesModified};