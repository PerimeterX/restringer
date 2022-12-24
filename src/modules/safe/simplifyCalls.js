/**
 * Remove unnecessary usage of '.call(this' or '.apply(this' when calling a function
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function simplifyCalls(arb, candidateFilter = () => true) {
	const candidates = arb.ast.filter(n =>
		n.type === 'CallExpression' &&
		n.arguments.length &&
		n.arguments[0].type === 'ThisExpression' &&
		n.callee.type === 'MemberExpression' &&
		['apply', 'call'].includes(n.callee.property?.name || n.callee.property?.value) &&
		(n.callee.object?.name || n.callee?.value) !== 'Function' &&
		!/function/i.test(n.callee.object.type) &&
		candidateFilter(n));

	for (const c of candidates) {
		arb.markNode(c,  {
			type: 'CallExpression',
			callee: c.callee.object,
			arguments: (c.callee.property?.name || c.callee.property?.value) === 'apply' ? c.arguments[1].elements : c.arguments.slice(1),
		});
	}
	return arb;
}

module.exports = simplifyCalls;