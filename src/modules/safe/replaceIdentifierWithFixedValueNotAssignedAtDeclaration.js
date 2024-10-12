import {areReferencesModified} from '../utils/areReferencesModified.js';
import {getMainDeclaredObjectOfMemberExpression} from '../utils/getMainDeclaredObjectOfMemberExpression.js';

/**
 * When an identifier holds a static value which is assigned after declaration but doesn't change afterwards,
 * replace all references to it with the value.
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function replaceIdentifierWithFixedValueNotAssignedAtDeclaration(arb, candidateFilter = () => true) {
	for (let i = 0; i < arb.ast.length; i++) {
		const n = arb.ast[i];
		if (n.parentNode?.type === 'VariableDeclarator' &&
		!n.parentNode.init &&
		n?.references?.length &&
		n.references.filter(r =>
			r.parentNode.type === 'AssignmentExpression' &&
			getMainDeclaredObjectOfMemberExpression(r.parentNode.left) === r).length === 1 &&
		!n.references.some(r =>
			(/For.*Statement/.test(r.parentNode.type) &&
				r.parentKey === 'left') ||
			// This covers cases like:
			// let a; b === c ? (b++, a = 1) : a = 2
			[
				r.parentNode.parentNode.type,
				r.parentNode.parentNode?.parentNode?.type,
				r.parentNode.parentNode?.parentNode?.parentNode?.type,
			].includes('ConditionalExpression')) &&
		candidateFilter(n)) {
			const assignmentNode = n.references.find(r =>
				r.parentNode.type === 'AssignmentExpression' &&
				getMainDeclaredObjectOfMemberExpression(r.parentNode.left) === r);
			const valueNode = assignmentNode.parentNode.right;
			if (valueNode.type === 'Literal') {
				const refs = n.references.filter(r => r !== assignmentNode);
				if (!areReferencesModified(arb.ast, refs)) {
					for (const ref of refs) {
						if (ref.parentNode.type === 'CallExpression' && ref.parentKey === 'callee') continue;
						arb.markNode(ref, valueNode);
					}
				}
			}
		}
	}
	return arb;
}

export default replaceIdentifierWithFixedValueNotAssignedAtDeclaration;