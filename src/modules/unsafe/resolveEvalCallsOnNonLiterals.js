const {parseCode} = require('flast');
const {badValue} = require(__dirname + '/../config');
const evalInVm = require(__dirname + '/../utils/evalInVm');
const createOrderedSrc = require(__dirname + '/../utils/createOrderedSrc');
const getDeclarationWithContext = require(__dirname + '/../utils/getDeclarationWithContext');

/**
 * Resolve eval call expressions where the argument isn't a literal.
 * E.g.
 * eval(function() {return 'atob'}()); // <-- will be resolved into 'atob'
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function resolveEvalCallsOnNonLiterals(arb, candidateFilter = () => true) {
	const candidates = arb.ast.filter(n =>
		n.type === 'CallExpression' &&
		n.callee.name === 'eval' &&
		n.arguments.length === 1 &&
		n.arguments[0].type !== 'Literal' &&
		candidateFilter(n));

	for (const c of candidates) {
		// The code inside the eval might contain references to outside code that should be included.
		const contextNodes = getDeclarationWithContext(c, true);
		// In case any of the target candidate is included in the context it should be removed.
		for (const redundantNode in [c, c?.parentNode, c?.parentNode?.parentNode]) {
			if (contextNodes.includes(redundantNode)) contextNodes.splice(contextNodes.indexOf(redundantNode), 1);
		}
		const context = contextNodes.length ? createOrderedSrc(contextNodes) : '';
		const src = `${context}\n;var __a_ = ${createOrderedSrc([c.arguments[0]])}\n;__a_`;
		const newNode = evalInVm(src);
		const targetNode = c.parentNode.type === 'ExpressionStatement' ? c.parentNode : c;
		let replacementNode = newNode;
		try {
			if (newNode.type === 'Literal') {
				try {
					replacementNode = parseCode(newNode.value);
				} catch {
					// Edge case for broken scripts that can be solved
					// by adding a newline after closing brackets except if part of a regexp
					replacementNode = parseCode(newNode.value.replace(/([)}])(?!\/)/g, '$1\n'));
				} finally {
					// If when parsed the newNode results in an empty program - use the unparsed newNode.
					if (!replacementNode.body.length) replacementNode = newNode;
				}
			}
		} catch {}
		if (replacementNode !== badValue) arb.markNode(targetNode, replacementNode);
	}
	return arb;
}

module.exports = resolveEvalCallsOnNonLiterals;