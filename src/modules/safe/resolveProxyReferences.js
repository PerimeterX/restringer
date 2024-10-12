import {getDescendants} from '../utils/getDescendants.js';
import {areReferencesModified} from '../utils/areReferencesModified.js';
import {getMainDeclaredObjectOfMemberExpression} from '../utils/getMainDeclaredObjectOfMemberExpression.js';

/**
 * Replace variables which only point at other variables and do not change, with their target.
 * E.g.
 * const a = [...];
 * const b = a;
 * const c = b[0];  // <-- will be replaced with `const c = a[0];`
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function resolveProxyReferences(arb, candidateFilter = () => true) {
	for (let i = 0; i < arb.ast.length; i++) {
		const n = arb.ast[i];
		if ((n.type === 'VariableDeclarator' &&
			['Identifier', 'MemberExpression'].includes(n.id.type) &&
			['Identifier', 'MemberExpression'].includes(n.init?.type)) &&
		!/For.*Statement/.test(n.parentNode?.parentNode?.type) &&
		candidateFilter(n)) {
			const relevantIdentifier = getMainDeclaredObjectOfMemberExpression(n.id)?.declNode || n.id;
			const refs = relevantIdentifier.references || [];
			const replacementNode = n.init;
			const replacementMainIdentifier = getMainDeclaredObjectOfMemberExpression(n.init)?.declNode;
			if (replacementMainIdentifier && replacementMainIdentifier === relevantIdentifier) continue;
			// Exclude changes in the identifier's own init
			if (getDescendants(n.init).find(n => n.declNode === relevantIdentifier)) continue;
			if (refs.length && !areReferencesModified(arb.ast, refs) && !areReferencesModified(arb.ast, [replacementNode])) {
				for (const ref of refs) {
					arb.markNode(ref, replacementNode);
				}
			}
		}
	}
	return arb;
}

export default resolveProxyReferences;