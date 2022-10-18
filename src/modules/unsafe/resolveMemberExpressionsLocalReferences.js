const evalInVm = require(__dirname + '/evalInVm');
const {badValue, skipProperties} = require(__dirname + '/../config');
const createOrderedSrc = require(__dirname + '/../utils/createOrderedSrc');
const getDeclarationWithContext = require(__dirname + '/../utils/getDeclarationWithContext');
const getMainDeclaredObjectOfMemberExpression = require(__dirname + '/../utils/getMainDeclaredObjectOfMemberExpression');

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
 * @return {Arborist}
 */
function resolveMemberExpressionsLocalReferences(arb) {
	const candidates = arb.ast.filter(n =>
		n.type === 'MemberExpression' &&
		['Identifier', 'Literal'].includes(n.property.type) &&
		!skipProperties.includes(n.property?.name || n.property?.value));

	for (const c of candidates) {
		// If this member expression is the callee of a call expression - skip it
		if (c.parentNode.type === 'CallExpression' && c.parentKey === 'callee') continue;
		// If this member expression is a part of another member expression - get the first parentNode
		// which has a declaration in the code;
		// E.g. a.b[c.d] --> if candidate is c.d, the c identifier will be selected;
		// a.b.c.d --> if the candidate is c.d, the 'a' identifier will be selected;
		let relevantIdentifier = getMainDeclaredObjectOfMemberExpression(c);
		if (relevantIdentifier && relevantIdentifier.declNode) {
			// Skip if the relevant identifier is on the left side of an assignment.
			if (relevantIdentifier.parentNode.parentNode.type === 'AssignmentExpression' &&
				relevantIdentifier.parentNode.parentKey === 'left') continue;
			const declNode = relevantIdentifier.declNode;
			// Skip if the identifier was declared as a function's parameter.
			if (/Function/.test(declNode.parentNode.type) &&
				(declNode.parentNode.params || []).find(p => p === declNode)) continue;
			const context = createOrderedSrc(getDeclarationWithContext(relevantIdentifier.declNode.parentNode));
			if (context) {
				const src = `${context}\n${c.src}`;
				const newNode = evalInVm(src);
				if (newNode !== badValue) {
					let isEmptyReplacement = false;
					switch (newNode.type) {
						case 'ArrayExpression':
							if (!newNode.elements.length) isEmptyReplacement = true;
							break;
						case 'ObjectExpression':
							if (!newNode.properties.length) isEmptyReplacement = true;
							break;
						case 'Literal':
							if (!String(newNode.value).length) isEmptyReplacement = true;
							break;
					}
					if (!isEmptyReplacement) {
						arb.markNode(c, newNode);
					}
				}
			}
		}
	}
	return arb;
}

module.exports = resolveMemberExpressionsLocalReferences;