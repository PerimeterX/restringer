const evalInVm = require(__dirname + '/evalInVm');
const logger = require(__dirname + '/../utils/logger');

/**
 * Replace definite member expressions with their intended value.
 * E.g.
 * '123'[0]; ==> '1';
 * 'hello'.length ==> 5;
 * @param {Arborist} arb
 * @return {Arborist}
 */
function resolveDefiniteMemberExpressions(arb) {
	const candidates = arb.ast.filter(n =>
		n.type === 'MemberExpression' &&
		n.property.type === 'Literal' &&
		['ArrayExpression', 'Literal'].includes(n.object.type) &&
		(n.object?.value?.length || n.object?.elements?.length));
	for (const c of candidates) {
		const newValue = evalInVm(c.src, logger);
		arb.markNode(c, newValue);
	}
	return arb;
}

module.exports = resolveDefiniteMemberExpressions;