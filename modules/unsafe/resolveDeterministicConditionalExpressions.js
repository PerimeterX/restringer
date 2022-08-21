const evalInVm = require(__dirname + '/evalInVm');
const logger = require(__dirname + '/../utils/logger');

/**
 * Evaluate resolvable (independent) conditional expressions and replace them with their unchanged resolution.
 * E.g.
 * 'a' ? do_a() : do_b(); // <-- will be replaced with just do_a():
 * @param {Arborist} arb
 * @return {Arborist}
 */
function resolveDeterministicConditionalExpressions(arb) {
	const candidates = arb.ast.filter(n =>
		n.type === 'ConditionalExpression' &&
		n.test.type === 'Literal');
	for (const c of candidates) {
		const newNode = evalInVm(`!!(${c.test.src});`, logger);
		if (newNode.type === 'Literal') {
			arb.markNode(c, newNode.value ? c.consequent : c.alternate);
		}
	}
	return arb;
}

module.exports = resolveDeterministicConditionalExpressions;