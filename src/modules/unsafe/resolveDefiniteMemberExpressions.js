const {badValue} = require(__dirname + '/../config');
const evalInVm = require(__dirname + '/../utils/evalInVm');

/**
 * Replace definite member expressions with their intended value.
 * E.g.
 * '123'[0]; ==> '1';
 * 'hello'.length ==> 5;
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function resolveDefiniteMemberExpressions(arb, candidateFilter = () => true) {
	for (let i = 0; i < arb.ast.length; i++) {
		const n = arb.ast[i];
		if (n.type === 'MemberExpression' &&
		!['UpdateExpression'].includes(n.parentNode.type) && // Prevent replacing (++[[]][0]) with (++1)
		!(n.parentKey === 'callee') &&    // Prevent replacing obj.method() with undefined()
		(n.property.type === 'Literal' ||
			(n.property.name && !n.computed)) &&
		['ArrayExpression', 'Literal'].includes(n.object.type) &&
		(n.object?.value?.length || n.object?.elements?.length) &&
		candidateFilter(n)) {
			const replacementNode = evalInVm(n.src);
			if (replacementNode !== badValue) arb.markNode(n, replacementNode);
		}
	}
	return arb;
}

module.exports = resolveDefiniteMemberExpressions;