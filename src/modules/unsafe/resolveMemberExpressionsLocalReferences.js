import {evalInVm} from '../utils/evalInVm.js';
import {badValue, skipProperties} from '../config.js';
import {createOrderedSrc} from '../utils/createOrderedSrc.js';
import {areReferencesModified} from '../utils/areReferencesModified.js';
import {getDeclarationWithContext} from '../utils/getDeclarationWithContext.js';
import {getMainDeclaredObjectOfMemberExpression} from '../utils/getMainDeclaredObjectOfMemberExpression.js';

/**
 * Resolve member expressions to the value they stand for, if they're defined in the script.
 * E.g.
 * const a = [1, 2, 3];
 * const b = a[2]; // <-- will be resolved to 3
 * const c = 0;
 * const d = a[c]; // <-- will be resolved to 1
 * ---
 * const a = {hello: 'world'};
 * const b = a['hello']; // <-- will be resolved to 'world'
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
export default function resolveMemberExpressionsLocalReferences(arb, candidateFilter = () => true) {
	const relevantNodes = [
		...(arb.ast[0].typeMap.MemberExpression || []),
	];
	for (let i = 0; i < relevantNodes.length; i++) {
		const n = relevantNodes[i];
		if (['Identifier', 'Literal'].includes(n.property.type) &&
		!skipProperties.includes(n.property?.name || n.property?.value) &&
		(!(n.parentKey === 'left' && n.parentNode.type === 'AssignmentExpression')) &&
		candidateFilter(n)) {
			// If this member expression is the callee of a call expression - skip it
			if (n.parentNode.type === 'CallExpression' && n.parentKey === 'callee') continue;
			// If this member expression is a part of another member expression - get the first parentNode
			// which has a declaration in the code;
			// E.g. a.b[c.d] --> if candidate is c.d, the c identifier will be selected;
			// a.b.c.d --> if the candidate is c.d, the 'a' identifier will be selected;
			let relevantIdentifier = getMainDeclaredObjectOfMemberExpression(n);
			if (relevantIdentifier && relevantIdentifier.declNode) {
				// Skip if the relevant identifier is on the left side of an assignment.
				if (relevantIdentifier.parentNode.parentNode.type === 'AssignmentExpression' &&
					relevantIdentifier.parentNode.parentKey === 'left') continue;
				const declNode = relevantIdentifier.declNode;
				// Skip if the identifier was declared as a function's parameter.
				if (/Function/.test(declNode.parentNode.type) &&
					(declNode.parentNode.params || []).find(p => p === declNode)) continue;
				const prop = n.property;
				if (prop.type === 'Identifier' && prop.declNode?.references && areReferencesModified(arb.ast, prop.declNode.references)) continue;
				const context = createOrderedSrc(getDeclarationWithContext(relevantIdentifier.declNode.parentNode));
				if (context) {
					const src = `${context}\n${n.src}`;
					const replacementNode = evalInVm(src);
					if (replacementNode !== badValue) {
						let isEmptyReplacement = false;
						switch (replacementNode.type) {
							case 'ArrayExpression':
								if (!replacementNode.elements.length) isEmptyReplacement = true;
								break;
							case 'ObjectExpression':
								if (!replacementNode.properties.length) isEmptyReplacement = true;
								break;
							case 'Literal':
								if (
									!String(replacementNode.value).length ||  // ''
									replacementNode.raw === 'null'            // null
								) isEmptyReplacement = true;
								break;
							case 'Identifier':
								if (replacementNode.name === 'undefined') isEmptyReplacement = true;
								break;
						}
						if (!isEmptyReplacement) {
							arb.markNode(n, replacementNode);
						}
					}
				}
			}
		}
	}
	return arb;
}