import {badValue} from '../config.js';
import {Sandbox} from '../utils/sandbox.js';
import {evalInVm} from '../utils/evalInVm.js';

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
	let sharedSb;
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
			sharedSb = sharedSb || new Sandbox();
			const replacementNode = evalInVm(n.src, sharedSb);
			if (replacementNode !== badValue) arb.markNode(n, replacementNode);
		}
	}
	return arb;
}

export default resolveDefiniteMemberExpressions;