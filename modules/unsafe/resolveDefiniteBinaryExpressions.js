const evalInVm = require(__dirname + '/evalInVm');
const logger = require(__dirname + '/../utils/logger');
const doesBinaryExpressionContainOnlyLiterals = require(__dirname + '/../utils/doesBinaryExpressionContainOnlyLiterals');
/**
 * Resolve definite binary expressions.
 * E.g.
 * 5 * 3 ==> 15;
 * '2' + 2 ==> '22';
 * @param {Arborist} arb
 * @return {Arborist}
 */
function resolveDefiniteBinaryExpressions(arb) {
	const candidates = arb.ast.filter(n =>
		n.type === 'BinaryExpression' &&
		doesBinaryExpressionContainOnlyLiterals(n));
	for (const c of candidates) {
		const newNode = evalInVm(c.src, logger);
		arb.markNode(c, newNode);
	}
	return arb;
}
module.exports = resolveDefiniteBinaryExpressions;