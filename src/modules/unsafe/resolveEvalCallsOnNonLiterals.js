const {parseCode} = require('flast');
const evalInVm = require(__dirname + '/evalInVm');
const {badValue} = require(__dirname + '/../config');

/**
 * Resolve eval call expressions where the argument isn't a literal.
 * E.g.
 * eval(function() {return 'atob'}()); // <-- will be resolved into 'atob'
 * @param {Arborist} arb
 * @return {Arborist}
 */
function resolveEvalCallsOnNonLiterals(arb) {
	const candidates = arb.ast.filter(n =>
		n.type === 'CallExpression' &&
		n.callee.name === 'eval' &&
		n.arguments.length === 1 &&
		n.arguments[0].type !== 'Literal');
	for (const c of candidates) {
		const argument = c.arguments[0];
		const src = `var __a_ = ${argument.src}\n;__a_`;
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
		if (replacementNode !== badValue) {arb.markNode(targetNode, replacementNode);}
	}
	return arb;
}

module.exports = resolveEvalCallsOnNonLiterals;