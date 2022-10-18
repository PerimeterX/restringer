const evalInVm = require(__dirname + '/evalInVm');
const {badValue} = require(__dirname + '/../config');

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
		(n.property.type === 'Literal' ||
			(n.property.name && !n.computed)) &&
		['ArrayExpression', 'Literal'].includes(n.object.type) &&
		(n.object?.value?.length || n.object?.elements?.length));
	for (const c of candidates) {
		const newNode = evalInVm(c.src);
		if (newNode !== badValue) arb.markNode(c, newNode);
	}
	return arb;
}

module.exports = resolveDefiniteMemberExpressions;