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
	for (let i = 0; i < arb.ast.length; i++) {
		const n = arb.ast[i];
		if (n.type === 'BinaryExpression' && doesBinaryExpressionContainOnlyLiterals(n) && candidateFilter(n)) {
			const replacementNode = evalInVm(n.src);
			if (replacementNode !== badValue) {
				// Fix issue where a number below zero would be replaced with a string
				if (replacementNode.type === 'UnaryExpression' && typeof n?.left?.value === 'number' && typeof n?.right?.value === 'number') {
					const v = parseInt(replacementNode.argument.value + '');
					replacementNode.argument.value = v;
					replacementNode.argument.raw = `${v}`;
				}
				arb.markNode(n, replacementNode);
			}
		}
	}
	return arb;
}
module.exports = resolveDefiniteBinaryExpressions;