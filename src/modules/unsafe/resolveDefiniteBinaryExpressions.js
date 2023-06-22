const {badValue} = require(__dirname + '/../config');
const evalInVm = require(__dirname + '/../utils/evalInVm');
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
		if (newNode !== badValue) {
			// Fix issue where a number below zero would be replaced with a string
			if (newNode.type === 'UnaryExpression' && typeof c?.left?.value === 'number' && typeof c?.right?.value === 'number') {
				// noinspection JSCheckFunctionSignatures
				const v = parseInt(newNode.argument.value);
				newNode.argument.value = v;
				newNode.argument.raw = `${v}`;
			}
			arb.markNode(c, newNode);
		}
	}
	return arb;
}
module.exports = resolveDefiniteBinaryExpressions;