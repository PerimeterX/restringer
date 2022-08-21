const evalInVm = require(__dirname + '/evalInVm');
const logger = require(__dirname + '/../utils/logger');
const {badValue, badArgumentTypes, skipIdentifiers, skipProperties} = require(__dirname + '/../config');

/**
 * Collect all available context on call expressions where the callee is defined in the script and attempt
 * to resolve their value.
 * @param {Arborist} arb
 * @return {Arborist}
 */
function resolveLocalCalls(arb) {
	const candidates = arb.ast.filter(n =>
		n.type === 'CallExpression' &&
		(n.callee?.declNode ||
			(n.callee?.object?.declNode &&
				!skipProperties.includes(n.callee.property?.value || n.callee.property?.name)) ||
			n.callee?.object?.type === 'Literal'));

	const frequency = {};
	candidates.map(c => this._getCalleeName(c)).forEach(name => {
		if (!frequency[name]) frequency[name] = 0;
		frequency[name]++;
	});
	const sortByFrequency = (a, b) => {
		a = this._getCalleeName(a);
		b = this._getCalleeName(b);
		return frequency[a] < frequency[b] ? 1 : frequency[b] < frequency[a] ? -1 : 0;
	};

	const modifiedRanges = [];
	for (const c of candidates.sort(sortByFrequency)) {
		if (c.arguments.filter(a => badArgumentTypes.includes(a.type)).length) continue;
		if (this._doesNodeContainRanges(c, modifiedRanges)) continue;
		const callee = c.callee?.object || c.callee;
		const declNode = c.callee?.declNode || c.callee?.object?.declNode;
		const cacheName = `rlc-${callee.name || callee.value}-${declNode?.nodeId}`;
		if (!this._cache[cacheName]) {
			// Skip call expressions with problematic values
			if (skipIdentifiers.includes(callee.name) ||
				(callee.type === 'ArrayExpression' && !callee.elements.length) ||
				!!(callee.arguments || []).filter(a => skipIdentifiers.includes(a) || a?.type === 'ThisExpression').length) continue;
			if (declNode) {
				// Verify the declNode isn't a simple wrapper for an identifier
				if (declNode.parentNode.type === 'FunctionDeclaration' &&
					declNode.parentNode?.body?.body?.length &&
					['Identifier', 'Literal'].includes(declNode.parentNode.body.body[0]?.argument?.type)) continue;
				this._cache[cacheName] = this._createOrderedSrc(this._getDeclarationWithContext(declNode.parentNode));
			}
		}
		const context = this._cache[cacheName];
		const src = context ? `${context}\n${c.src}` : c.src;
		const newNode = evalInVm(src, logger);
		if (newNode !== badValue && newNode.type !== 'FunctionDeclaration') {
			arb.markNode(c, newNode);
			modifiedRanges.push(c.range);
		}
	}
}

module.exports = resolveLocalCalls;