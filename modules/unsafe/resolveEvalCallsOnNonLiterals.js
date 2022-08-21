const {parseCode} = require('flast');
const evalInVm = require(__dirname + '/evalInVm');
const logger = require(__dirname + '/../utils/logger');

/**
 * Resolve eval call expressions where the argument isn't a literal.
 * E.g.
 * eval(function() {return 'value'})() // <-- will be resolved into 'value'
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
		const newNode = evalInVm(src, logger);
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
				}
			}
		} catch {}
		arb.markNode(targetNode, replacementNode);
	}
	return arb;
}

module.exports = resolveEvalCallsOnNonLiterals;