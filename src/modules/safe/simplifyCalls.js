/**
 * Remove unnecessary usage of '.call(this' or '.apply(this' when calling a function
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function simplifyCalls(arb, candidateFilter = () => true) {
	for (let i = 0; i < arb.ast.length; i++) {
		const n = arb.ast[i];
		if (n.type === 'CallExpression' &&
		n.arguments.length &&
		n.arguments[0].type === 'ThisExpression' &&
		n.callee.type === 'MemberExpression' &&
		['apply', 'call'].includes(n.callee.property?.name || n.callee.property?.value) &&
		(n.callee.object?.name || n.callee?.value) !== 'Function' &&
		!/function/i.test(n.callee.object.type) &&
		candidateFilter(n)) {
			const args = (n.callee.property?.name || n.callee.property?.value) === 'apply' ? n.arguments[1].elements : n.arguments.slice(1);
			arb.markNode(n,  {
				type: 'CallExpression',
				callee: n.callee.object,
				arguments: Array.isArray(args) ? args : (args ? [args] : []),
			});
		}
	}
	return arb;
}

export default simplifyCalls;