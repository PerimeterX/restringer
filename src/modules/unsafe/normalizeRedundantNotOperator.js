import {badValue} from '../config.js';
import {Sandbox} from '../utils/sandbox.js';
import {evalInVm} from '../utils/evalInVm.js';
import {canUnaryExpressionBeResolved} from '../utils/canUnaryExpressionBeResolved.js';

const relevantNodeTypes = ['Literal', 'ArrayExpression', 'ObjectExpression', 'UnaryExpression'];

/**
 * Replace redundant not operators with actual value (e.g. !true -> false)
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function normalizeRedundantNotOperator(arb, candidateFilter = () => true) {
	let sharedSB;
	for (let i = 0; i < arb.ast.length; i++) {
		const n = arb.ast[i];
		if (n.operator === '!' &&
		n.type === 'UnaryExpression' &&
		relevantNodeTypes.includes(n.argument.type) &&
		candidateFilter(n)) {
			if (canUnaryExpressionBeResolved(n.argument)) {
				sharedSB = sharedSB || new Sandbox();
				const replacementNode = evalInVm(n.src, sharedSB);
				if (replacementNode !== badValue) arb.markNode(n, replacementNode);
			}
		}
	}
	return arb;
}

export default normalizeRedundantNotOperator;