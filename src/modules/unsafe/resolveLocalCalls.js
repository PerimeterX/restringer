const Sandbox = require(__dirname + '/../utils/sandbox');
const evalInVm = require(__dirname + '/../utils/evalInVm');
const getCache = require(__dirname + '/../utils/getCache');
const getCalleeName = require(__dirname + '/../utils/getCalleeName');
const isNodeInRanges = require(__dirname + '/../utils/isNodeInRanges');
const createOrderedSrc = require(__dirname + '/../utils/createOrderedSrc');
const getDeclarationWithContext = require(__dirname + '/../utils/getDeclarationWithContext');
const {badValue, badArgumentTypes, skipIdentifiers, skipProperties} = require(__dirname + '/../config');

let appearances = {};
const cacheLimit = 100;

/**
 * @param {ASTNode} a
 * @param {ASTNode} b
 */
function sortByApperanceFrequency(a, b) {
	a = getCalleeName(a);
	b = getCalleeName(b);
	return appearances[a] < appearances[b] ? 1 : appearances[b] < appearances[a] ? -1 : 0;
}

/**
 * @param {ASTNode} node
 * @return {number}
 */
function countAppearances(node) {
	const callee = getCalleeName(node);
	if (!appearances[callee]) appearances[callee] = 0;
	return ++appearances[callee];
}

/**
 * Collect all available context on call expressions where the callee is defined in the script and attempt
 * to resolve their value.
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function resolveLocalCalls(arb, candidateFilter = () => true) {
	appearances = {};
	const cache = getCache(arb.ast[0].scriptHash);
	const candidates = [];
	for (let i = 0; i < arb.ast.length; i++) {
		const n = arb.ast[i];
		if (n.type === 'CallExpression' &&
		(n.callee?.declNode ||
			(n.callee?.object?.declNode &&
				!skipProperties.includes(n.callee.property?.value || n.callee.property?.name)) ||
			n.callee?.object?.type === 'Literal') &&
		countAppearances(n) &&
		candidateFilter(n)) {
			candidates.push(n);
		}
	}
	candidates.sort(sortByApperanceFrequency);

	const modifiedRanges = [];
	for (let i = 0; i < candidates.length; i++) {
		const c = candidates[i];
		if (c.arguments.some(a => badArgumentTypes.includes(a.type)) || isNodeInRanges(c, modifiedRanges)) continue;
		const callee = c.callee?.object || c.callee;
		const declNode = c.callee?.declNode || c.callee?.object?.declNode;
		if (declNode?.parentNode?.body?.body?.length && declNode.parentNode?.body?.body[0].type === 'ReturnStatement') {
			// Leave this replacement to a safe function
			const returnArg = declNode.parentNode.body.body[0].argument;
			if (['Literal', 'Identifier'].includes(returnArg.type) || /Function/.test(returnArg.type)) continue;   // Unwrap identifier
			else if (returnArg.type === 'CallExpression' &&
				returnArg.callee?.object?.type === 'FunctionExpression' &&
				(returnArg.callee.property?.name || returnArg.callee.property?.value) === 'apply') continue;    // Unwrap function shells
		}
		const cacheName = `rlc-${callee.name || callee.value}-${declNode?.nodeId}`;
		if (!cache[cacheName]) {
			cache[cacheName] = badValue;
			// Skip call expressions with problematic values
			if (skipIdentifiers.includes(callee.name) ||
				(callee.type === 'ArrayExpression' && !callee.elements.length) ||
				(callee.arguments || []).some(a => skipIdentifiers.includes(a) || a?.type === 'ThisExpression')) continue;
			if (declNode) {
				// Verify the declNode isn't a simple wrapper for an identifier
				if (declNode.parentNode.type === 'FunctionDeclaration' &&
					declNode.parentNode?.body?.body?.length &&
					['Identifier', 'Literal'].includes(declNode.parentNode.body.body[0]?.argument?.type)) continue;
				const contextSb = new Sandbox();
				try {
					contextSb.run(createOrderedSrc(getDeclarationWithContext(declNode.parentNode)));
					if (Object.keys(cache) >= cacheLimit) cache.flush();
					cache[cacheName] = contextSb;
				} catch {}
			}
		}
		const contextVM = cache[cacheName];
		const nodeSrc = createOrderedSrc([c]);
		const replacementNode = contextVM === badValue ? evalInVm(nodeSrc) : evalInVm(nodeSrc, contextVM);
		if (replacementNode !== badValue && replacementNode.type !== 'FunctionDeclaration' && replacementNode.name !== 'undefined') {
			// Prevent resolving a function's toString as it might be an anti-debugging mechanism
			// which will spring if the code is beautified
			if (c.callee.type === 'MemberExpression' && (c.callee.property?.name || c.callee.property?.value) === 'toString' &&
				(new RegExp('^function ')).test(replacementNode?.value)) continue;
			arb.markNode(c, replacementNode);
			modifiedRanges.push(c.range);
		}
	}
	return arb;
}

module.exports = resolveLocalCalls;