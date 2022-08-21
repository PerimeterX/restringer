const isNodeMarked = require(__dirname + '/isNodeMarked');
const getDescendants = require(__dirname + '/getDescendants');
const {propertiesThatModifyContent} = require(__dirname + '/../config');

const cache = {};

/**
 *
 * @param {ASTNode} originNode
 * @return {ASTNode[]} A flat array of all available declarations and call expressions relevant to
 * the context of the origin node.
 */
function getDeclarationWithContext(originNode) {
	const cacheNameId = `context-${originNode.nodeId}`;
	const cacheNameSrc = `context-${originNode.src}`;
	let cached = cache[cacheNameId] || cache[cacheNameSrc];
	if (!cached) {
		const collectedContext = [originNode];
		const examineStack = [originNode];
		const collectedContextIds = [];
		const collectedRanges = [];
		while (examineStack.length) {
			const relevantNode = examineStack.pop();
			if (isNodeMarked(relevantNode)) continue;
			collectedContextIds.push(relevantNode.nodeId);
			collectedRanges.push(relevantNode.range);
			let relevantScope;
			const assignments = [];
			const references = [];
			switch (relevantNode.type) {
				case 'VariableDeclarator':
					relevantScope = relevantNode.init?.scope || relevantNode.id.scope;
					// Since the variable wasn't initialized, extract value from assignments
					if (!relevantNode.init) {
						assignments.push(...relevantNode.id.references.filter(r =>
							r.parentNode.type === 'AssignmentExpression' &&
							r.parentKey === 'left'));
					} else {
						// Collect all references found in init
						references.push(...getDescendants(relevantNode.init).filter(n =>
							n.type === 'Identifier' &&
							n.declNode &&
							(n.parentNode.type !== 'MemberExpression' ||
								n.parentKey === 'object'))
							.map(n => n.declNode));
					}
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
					break;
				case 'CallExpression':
					relevantScope = relevantNode.callee.scope;
					references.push(...relevantNode.arguments.filter(a => a.type === 'Identifier'));
					break;
				case 'MemberExpression':
					relevantScope = relevantNode.object.scope;
					examineStack.push(relevantNode.property);
					break;
				default:
					relevantScope = relevantNode.scope;
			}

			const contextToCollect = relevantScope.through
				.map(ref => ref.identifier?.declNode?.parentNode)
				.filter(ref => !!ref)
				.concat(assignments)
				.concat(references)
				.map(ref => ref.type === 'Identifier' ? ref.parentNode : ref);
			for (const rn of contextToCollect) {
				if (rn && !collectedContextIds.includes(rn.nodeId) && !this._isNodeInRanges(rn, collectedRanges)) {
					collectedRanges.push(rn.range);
					collectedContextIds.push(rn.nodeId);
					collectedContext.push(rn);
					examineStack.push(rn);
					for (const cn of (rn.childNodes || [])) {
						examineStack.push(cn);
					}
				}
			}
		}
		const skipCollectionTypes = [
			'Literal',
			'Identifier',
			'MemberExpression',
		];
		cached = collectedContext.filter(n => !skipCollectionTypes.includes(n.type));
		cache[cacheNameId] = cached;        // Caching context for the same node
		cache[cacheNameSrc] = cached;       // Caching context for a different node with similar content
	}
	return cached;
}

module.exports = getDeclarationWithContext;