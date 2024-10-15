import {Sandbox} from '../utils/sandbox.js';
import {evalInVm} from '../utils/evalInVm.js';

/**
 * Evaluate resolvable (independent) conditional expressions and replace them with their unchanged resolution.
 * E.g.
 * 'a' ? do_a() : do_b(); // <-- will be replaced with just do_a():
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function resolveDeterministicConditionalExpressions(arb, candidateFilter = () => true) {
	let sharedSb;
	for (let i = 0; i < arb.ast.length; i++) {
		const n = arb.ast[i];
		if (n.type === 'ConditionalExpression' &&
		n.test.type === 'Literal' &&
		candidateFilter(n)) {
			sharedSb = sharedSb || new Sandbox();
			const replacementNode = evalInVm(`Boolean(${n.test.src});`, sharedSb);
			if (replacementNode.type === 'Literal') {
				arb.markNode(n, replacementNode.value ? n.consequent : n.alternate);
			}
		}
	}
	return arb;
}

export default resolveDeterministicConditionalExpressions;