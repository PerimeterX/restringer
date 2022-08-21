const areReferencesModified = require(__dirname + '/../utils/areReferencesModified');
const getMainDeclaredObjectOfMemberExpression = require(__dirname + '/../utils/getMainDeclaredObjectOfMemberExpression');

/**
 * When an identifier holds a static value which is assigned after declaration but doesn't change afterwards,
 * replace all references to it with the value.
 * @param {Arborist} arb
 * @return {Arborist}
 */
function replaceIdentifierWithFixedValueNotAssignedAtDeclaration(arb) {
	const candidates = arb.ast.filter(n =>
		n.parentNode?.type === 'VariableDeclarator' &&
		!n.parentNode.init &&
		n?.references?.length &&
		n.references.filter(r =>
			r.parentNode.type === 'AssignmentExpression' &&
			getMainDeclaredObjectOfMemberExpression(r.parentNode.left).nodeId === r.nodeId).length === 1 &&
		!n.references.filter(r =>
			(/For.*Statement/.exec(r.parentNode.type) &&
				r.parentKey === 'left') ||
			// This covers cases like:
			// let a; b === c ? (b++, a = 1) : a = 2
			[
				r.parentNode.parentNode.type,
				r.parentNode.parentNode?.parentNode?.type,
				r.parentNode.parentNode?.parentNode?.parentNode?.type,
			].includes('ConditionalExpression')).length);
	for (const c of candidates) {
		const assignmentNode = c.references.filter(r =>
			r.parentNode.type === 'AssignmentExpression' &&
			getMainDeclaredObjectOfMemberExpression(r.parentNode.left).nodeId === r.nodeId)[0];
		const valueNode = assignmentNode.parentNode.right;
		if (valueNode.type !== 'Literal') continue;
		const refs = c.references.filter(r => r.nodeId !== assignmentNode.nodeId);
		if (!areReferencesModified(arb.ast, refs)) {
			for (const ref of refs) {
				if (ref.parentNode.type === 'CallExpression' && ref.parentKey === 'callee') continue;
				arb.markNode(ref, valueNode);
			}
		}
	}
	return arb;
}

module.exports = replaceIdentifierWithFixedValueNotAssignedAtDeclaration;