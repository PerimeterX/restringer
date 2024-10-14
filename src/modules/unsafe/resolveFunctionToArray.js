/**
 * Function To Array Replacements
 * The obfuscated script dynamically generates an array which is referenced throughout the script.
 */
import utils from '../utils/index.js';
import {Sandbox} from '../utils/sandbox.js';
import {evalInVm} from '../utils/evalInVm.js';
const {createOrderedSrc, getDeclarationWithContext} = utils;
import {badValue} from '../config.js';

/**
 * Run the generating function and replace it with the actual array.
 * Candidates are variables which are assigned a call expression, and every reference to them is a member expression.
 * E.g.
 *   function getArr() {return ['One', 'Two', 'Three']};
 *   const a = getArr();
 *   console.log(`${a[0]} + ${a[1]} = ${a[2]}`);
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
export default function resolveFunctionToArray(arb,  candidateFilter = () => true) {
	let sharedSb;
	for (let i = 0; i < arb.ast.length; i++) {
		const n = arb.ast[i];
		if (n.type === 'VariableDeclarator' && n.init?.type === 'CallExpression' && n.id?.references &&
		!n.id.references.some(r => r.parentNode.type !== 'MemberExpression') &&
		candidateFilter(n)) {
			const targetNode = n.init.callee?.declNode?.parentNode || n.init;
			let src = '';
			if (![n.init, n.init?.parentNode].includes(targetNode)) src += createOrderedSrc(getDeclarationWithContext(targetNode));
			src += `\n${createOrderedSrc([n.init])}`;
			sharedSb = sharedSb || new Sandbox();
			const replacementNode = evalInVm(src, sharedSb);
			if (replacementNode !== badValue) {
				arb.markNode(n.init, replacementNode);
			}
		}
	}
	return arb;
}