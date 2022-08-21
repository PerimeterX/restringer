const evalInVm = require(__dirname + '/evalInVm');
const {badValue} = require(__dirname + '/../config');
const canUnaryExpressionBeResolved = require(__dirname + '/../utils/canUnaryExpressionBeResolved');

/**
 * Replace redundant not operators with actual value (e.g. !true -> false)
 * @param {Arborist} arb
 * @param {object?} logger (optional) logging functions.
 * @return {Arborist}
 */
function normalizeRedundantNotOperator(arb, logger = {error: () => {}}) {
	const relevantNodeTypes = ['Literal', 'ArrayExpression', 'ObjectExpression', 'UnaryExpression'];
	const candidates = arb.ast.filter(n =>
		n.type === 'UnaryExpression' &&
		relevantNodeTypes.includes(n.argument.type) &&
		n.operator === '!');
	for (const c of candidates) {
		if (canUnaryExpressionBeResolved(c.argument)) {
			const newNode = evalInVm(c.src, logger);
			if (newNode !== badValue) arb.markNode(c, newNode);
		}
	}
	return arb;
}

module.exports = normalizeRedundantNotOperator;