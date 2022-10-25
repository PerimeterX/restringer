const evalInVm = require(__dirname + '/evalInVm');
const {badValue} = require(__dirname + '/../config');
const doesBinaryExpressionContainOnlyLiterals = require(__dirname + '/../utils/doesBinaryExpressionContainOnlyLiterals');

/**
 * Resolve definite binary expressions.
 * E.g.
 * 5 * 3 ==> 15;
 * '2' + 2 ==> '22';
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function resolveDefiniteBinaryExpressions(arb, candidateFilter = () => true) {
	const candidates = arb.ast.filter(n =>
		n.type === 'BinaryExpression' &&
		doesBinaryExpressionContainOnlyLiterals(n) &&
		candidateFilter(n));

	for (const c of candidates) {
		const newNode = evalInVm(c.src);
		if (newNode !== badValue) arb.markNode(c, newNode);
	}
	return arb;
}
module.exports = resolveDefiniteBinaryExpressions;