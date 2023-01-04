const getCache = require(__dirname + '/getCache');
const generateHash = require(__dirname + '/generateHash');
const isNodeInRanges = require(__dirname + '/isNodeInRanges');
const getDescendants = require(__dirname + '/../utils/getDescendants');
const {propertiesThatModifyContent} = require(__dirname + '/../config');

// Types that give no context by themselves
const irrelevantTypesToBeFilteredOut = [
	'Literal',
	'Identifier',
	'MemberExpression',
];

// Relevant types for giving context
const typesToCollect = [
	'CallExpression',
	'ArrowFunctionExpression',
	'AssignmentExpression',
	'FunctionDeclaration',
	'FunctionExpression',
	'VariableDeclarator',
];

// Child nodes that can be skipped as they give no context
const irrelevantTypesToAvoidIteratingOver = [
	'Literal',
	'ThisExpression',
];

// Direct child nodes of an if statement
const ifKeys = ['consequent', 'alternate'];

/**
 * @param {ASTNode} targetNode
 * @return {boolean} True if any of the descendants are marked for modification; false otherwise.
 */
function areDescendantsModified(targetNode) {
	for (const n of getDescendants(targetNode)) if (n.isMarked) return true;
	return false;
}

/**
 * @param {ASTNode} targetNode
 * @return {boolean} True if the target node is directly under an if statement; false otherwise
 */
function isConsequentOrAlternate(targetNode) {
	return targetNode.parentNode.type === 'IfStatement' ||
		ifKeys.includes(targetNode.parentKey) ||
		ifKeys.includes(targetNode.parentNode.parentKey) ||
		(targetNode.parentNode.parentNode.type === 'BlockStatement' && ifKeys.includes(targetNode.parentNode.parentNode.parentKey));
}

/**
 * @param {ASTNode} n
 * @return {boolean} True if the target node is the object of a member expression
 *                   and its property is being assigned to; false otherwise.
 */
function isNodeAnAssignmentToProperty(n) {
	return n.parentNode.type === 'MemberExpression' &&
	!isConsequentOrAlternate(n.parentNode) &&
	((n.parentNode.parentNode.type === 'AssignmentExpression' &&  // e.g. targetNode.prop = value
			n.parentNode.parentKey === 'left') ||
		(n.parentKey === 'object' &&  // e.g. targetNode.push(value) <-- this changes the value of targetNode
			(propertiesThatModifyContent.includes(n.parentNode.property?.value || n.parentNode.property.name) ||
				n.parentNode.property.isMarked)));  // Collect references which are marked, so they will prevent the context from collecting
}

/**
 * @param {ASTNode} originNode
 * @param {boolean} [excludeOriginNode] (optional) Do not return the originNode. Defaults to false.
 * @return {ASTNode[]} A flat array of all available declarations and call expressions relevant to
 * the context of the origin node.
 */
function getDeclarationWithContext(originNode, excludeOriginNode = false) {
	const cache = getCache(originNode.scriptHash);
	const srcHash = generateHash(originNode.src);
	const cacheNameId = `context-${originNode.nodeId}-${srcHash}`;
	const cacheNameSrc = `context-${srcHash}`;
	let cached = cache[cacheNameId] || cache[cacheNameSrc];
	if (!cached) {
		const stack = [originNode];   // The working stack for nodes to be reviewed
		const collected = [];         // These will be our context
		const seenNodes = [];         // Collected to avoid re-iterating over the same nodes
		const collectedRanges = [];   // Collected to prevent collecting nodes from within collected nodes.
		while (stack.length) {
			const node = stack.shift();
			if (seenNodes.includes(node)) continue;
			seenNodes.push(node);
			// Do not collect any context if one of the relevant nodes is marked to be replaced or deleted
			if (node.isMarked || areDescendantsModified(node)) {
				collected.length = 0;
				break;
			}
			if (typesToCollect.includes(node.type) && !isNodeInRanges(node, collectedRanges)) {
				collected.push(node);
				collectedRanges.push(node.range);
			}

			// For each node, whether collected or not, target relevant relative nodes for further review.
			const targetNodes = [node];
			switch (node.type) {
				case 'Identifier': {
					const refs = node.references || [];
					// Review the declaration of an identifier
					if (node.declNode && node.declNode.parentNode) targetNodes.push(node.declNode.parentNode);
					else if (refs.length && node.parentNode) targetNodes.push(node.parentNode);
					// Review call expression that receive the identifier as an argument for possible augmenting functions
					targetNodes.push(...refs.filter(r =>
						r.parentNode.type === 'CallExpression' &&
						r.parentKey === 'arguments')
						.map(r => r.parentNode));
					// Review direct assignments to the identifier
					targetNodes.push(...refs.filter(r =>
						r.parentNode.type === 'AssignmentExpression' &&
						r.parentKey === 'left' &&
						!isConsequentOrAlternate(r))
						.map(r => r.parentNode));
					// Review assignments to property
					targetNodes.push(...refs.filter(isNodeAnAssignmentToProperty)
						.map(r => r.parentNode.parentNode));
					break;
				}
				case 'MemberExpression':
					if (node.property?.declNode) targetNodes.push(node.property.declNode);
					break;
				case 'FunctionExpression':
					// Review the parent node of anonymous functions
					if (!node.id) targetNodes.push(node.parentNode);
			}

			for (const targetNode of targetNodes) {
				if (!seenNodes.includes(targetNode)) stack.push(targetNode);
				for (const childNode of targetNode.childNodes) {
					if (
						!seenNodes.includes(childNode) &&
						!stack.includes(childNode) &&
						!irrelevantTypesToAvoidIteratingOver.includes(childNode.type)
					) {
						stack.push(childNode);
					}
				}
			}
		}
		cached = [...new Set(collected.filter(n => !irrelevantTypesToBeFilteredOut.includes(n.type)))];
		if (excludeOriginNode) cached = cached.filter(n => !isNodeInRanges(n, [originNode.range]));
		// A fix to ignore reassignments in cases where functions are overwritten as part of an anti-debugging mechanism
		const functionNameReassignment = [];
		cached.filter(n =>
			n.type === 'FunctionDeclaration' &&
			n.id && (n.id.references || []).filter(r =>
				r.parentNode.type === 'AssignmentExpression' &&
				r.parentKey === 'left').forEach(ref => functionNameReassignment.push(ref.parentNode)));
		if (functionNameReassignment.length) cached = cached.filter(n => !functionNameReassignment.includes(n));
		cache[cacheNameId] = cached;        // Caching context for the same node
		cache[cacheNameSrc] = cached;       // Caching context for a different node with similar content
	}
	return cached;
}

module.exports = getDeclarationWithContext;