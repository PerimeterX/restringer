const evalInVm = require(__dirname + '/evalInVm');
const {badValue} = require(__dirname + '/../config');
const canUnaryExpressionBeResolved = require(__dirname + '/../utils/canUnaryExpressionBeResolved');

const relevantNodeTypes = ['Literal', 'ArrayExpression', 'ObjectExpression', 'UnaryExpression'];

/**
 * Replace redundant not operators with actual value (e.g. !true -> false)
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function normalizeRedundantNotOperator(arb, candidateFilter = () => true) {
	const candidates = arb.ast.filter(n =>
		n.operator === '!' &&
		n.type === 'UnaryExpression' &&
		relevantNodeTypes.includes(n.argument.type) &&
		candidateFilter(n));

	for (const c of candidates) {
		if (canUnaryExpressionBeResolved(c.argument)) {
			const newNode = evalInVm(c.src);
			if (newNode !== badValue) arb.markNode(c, newNode);
		}
	}
	return arb;
}

module.exports = normalizeRedundantNotOperator;