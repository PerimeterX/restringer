const getCache = require(__dirname + '/getCache');
const generateHash = require(__dirname + '/generateHash');
const isNodeMarked = require(__dirname + '/isNodeMarked');
const isNodeInRanges = require(__dirname + '/isNodeInRanges');
const {propertiesThatModifyContent} = require(__dirname + '/../config');

const skipCollectionTypes = [
	'Literal',
	'Identifier',
	'MemberExpression',
];

/**
 *
 * @param {ASTNode} originNode
 * @return {ASTNode[]} A flat array of all available declarations and call expressions relevant to
 * the context of the origin node.
 */
function getDeclarationWithContext(originNode) {
	const cache = getCache(originNode.scriptHash);
	const srcHash = generateHash(originNode.src);
	const cacheNameId = `context-${originNode.nodeId}-${srcHash}`;
	const cacheNameSrc = `context-${srcHash}`;
	let cached = cache[cacheNameId] || cache[cacheNameSrc];
	if (!cached) {
		const collectedContext = [originNode];
		const examinedNodes = [];
		const examineStack = [originNode];
		const collectedRanges = [];
		while (examineStack.length) {
			const relevantNode = examineStack.pop();
			if (examinedNodes.includes(relevantNode)) continue;
			else examinedNodes.push(relevantNode);
			if (isNodeMarked(relevantNode)) continue;
			collectedRanges.push(relevantNode.range);
			let relevantScope = relevantNode.scope;
			const assignments = [];
			const references = [];
			switch (relevantNode.type) {
				case 'VariableDeclarator':
					relevantScope = relevantNode.init?.scope || relevantNode.id.scope;
					// Collect direct assignments
					assignments.push(...relevantNode.id.references.filter(r =>
						r.parentNode.type === 'AssignmentExpression' &&
						r.parentKey === 'left')
						.map(r => r.parentNode));
					// Collect assignments to variable properties
					assignments.push(...relevantNode.id.references.filter(r =>
						r.parentNode.type === 'MemberExpression' &&
						((r.parentNode.parentNode.type === 'AssignmentExpression' &&
								r.parentNode.parentKey === 'left') ||
							(r.parentKey === 'object' &&
								propertiesThatModifyContent.includes(r.parentNode.property?.value || r.parentNode.property.name))))
						.map(r => r.parentNode.parentNode));
					// Find augmenting functions
					references.push(...relevantNode.id.references.filter(r =>
						r.parentNode.type === 'CallExpression' &&
						r.parentKey === 'arguments')
						.map(r => r.parentNode));
					break;
				case 'AssignmentExpression':
					relevantScope = relevantNode.right?.scope;
					examineStack.push(relevantNode.right);
					break;
				case 'CallExpression':
					relevantScope = relevantNode.callee.scope;
					references.push(...relevantNode.arguments.filter(a => a.type === 'Identifier'));
					break;
				case 'MemberExpression':
					relevantScope = relevantNode.object.scope;
					examineStack.push(relevantNode.property);
					break;
				case 'Identifier':
					if (relevantNode.declNode) {
						relevantScope = relevantNode.declNode.scope;
						references.push(relevantNode.declNode.parentNode);
					}
					break;
			}

			// noinspection JSUnresolvedVariable
			const contextToCollect = [...new Set(
				relevantScope.through.map(ref => ref.identifier?.declNode?.parentNode)
					.concat(assignments)
					.concat(references))
			].map(ref => ref?.declNode ? ref.declNode : ref);
			for (const rn of contextToCollect) {
				if (rn && !collectedContext.includes(rn) && !isNodeInRanges(rn, collectedRanges)) {
					collectedRanges.push(rn.range);
					collectedContext.push(rn);
					examineStack.push(rn);
					for (const cn of (rn.childNodes || [])) {
						examineStack.push(cn);
					}
				}
			}
		}
		cached = collectedContext.filter(n => !skipCollectionTypes.includes(n.type));
		cache[cacheNameId] = cached;        // Caching context for the same node
		cache[cacheNameSrc] = cached;       // Caching context for a different node with similar content
	}
	return cached;
}

module.exports = getDeclarationWithContext;