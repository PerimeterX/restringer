import {badValue} from '../config.js';
import {Sandbox} from '../utils/sandbox.js';
import {evalInVm} from '../utils/evalInVm.js';
import {doesBinaryExpressionContainOnlyLiterals} from '../utils/doesBinaryExpressionContainOnlyLiterals.js';

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
	let sharedSb;
	const relevantNodes = [
		...(arb.ast[0].typeMap.BinaryExpression || []),
	];
	for (let i = 0; i < relevantNodes.length; i++) {
		const n = relevantNodes[i];
		if (doesBinaryExpressionContainOnlyLiterals(n) && candidateFilter(n)) {
			sharedSb = sharedSb || new Sandbox();
			const replacementNode = evalInVm(n.src, sharedSb);
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
export default resolveDefiniteBinaryExpressions;