import {badValue} from '../config.js';
import {Sandbox} from '../utils/sandbox.js';
import {evalInVm} from '../utils/evalInVm.js';
import {getDescendants} from '../utils/getDescendants.js';
import {doesDescendantMatchCondition} from '../utils/doesDescendantMatchCondition.js';

/**
 * A special case of function array replacement where the function is wrapped in another function, the array is
 * sometimes wrapped in its own function, and is also augmented.
 * TODO: Add example code
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
export default function resolveAugmentedFunctionWrappedArrayReplacements(arb, candidateFilter = () => true) {
	const relevantNodes = [
		...(arb.ast[0].typeMap.FunctionDeclaration || []),
	];
	for (let i = 0; i < relevantNodes.length; i++) {
		const n = relevantNodes[i];
		if (n.id  &&
			doesDescendantMatchCondition(n, d =>
				d.type === 'AssignmentExpression' &&
				d.left?.name === n.id?.name) &&
			candidateFilter(n)) {
			const descendants = getDescendants(n);
			const arrDecryptor = n;
			const arrCandidates = [];
			for (let q = 0; q < descendants.length; q++) {
				const c = descendants[q];
				if (c.type === 'MemberExpression' && c.object.type === 'Identifier') arrCandidates.push(c.object);
			}
			for (let j = 0; j < arrCandidates.length; j++) {
				const ac = arrCandidates[j];
				// If a direct reference to a global variable pointing at an array
				let arrRef;
				if (!ac.declNode) continue;
				if (ac.declNode.scope.type === 'global') {
					if (ac.declNode.parentNode?.init?.type === 'ArrayExpression') {
						arrRef = ac.declNode.parentNode?.parentNode || ac.declNode.parentNode;
					}
				} else if (ac.declNode.parentNode?.init?.type === 'CallExpression') {
					arrRef = ac.declNode.parentNode.init.callee?.declNode?.parentNode;
				}
				if (arrRef) {
					const expressionStatements = arb.ast[0].typeMap.ExpressionStatement || [];
					for (let k = 0; k < expressionStatements.length; k++) {
						const exp = expressionStatements[k];
						if (exp.expression.type === 'CallExpression' &&
							exp.expression.callee.type === 'FunctionExpression' &&
							exp.expression.arguments.length &&
							exp.expression.arguments[0].type === 'Identifier' &&
							exp.expression.arguments[0].declNode === ac.declNode) {
							const context = [arrRef.src, arrDecryptor.src, exp.src].join('\n');
							const skipScopes = [arrRef.scope, arrDecryptor.scope, exp.expression.callee.scope];
							const callExpressions = arb.ast[0].typeMap.CallExpression || [];
							const replacementCandidates = [];
							for (let r = 0; r < callExpressions.length; r++) {
								const c = callExpressions[r];
								if (c.callee?.name === arrDecryptor.id.name &&
									!skipScopes.includes(c.scope)) {
									replacementCandidates.push(c);
								}
							}
							const sb = new Sandbox();
							sb.run(context);
							for (let p = 0; p < replacementCandidates.length; p++) {
								const rc = replacementCandidates[p];
								const replacementNode = evalInVm(`\n${rc.src}`, sb);
								if (replacementNode !== badValue) {
									arb.markNode(rc, replacementNode);
								}
							}
							break;
						}
					}
				}
			}
		}
	}
	return arb;
}