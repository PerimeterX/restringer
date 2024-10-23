/**
 * Augmented Array Replacements
 * The obfuscated script uses a shuffled array,
 * requiring an IIFE to re-order it before the values can be extracted correctly.
 * E.g.
 * const a = ['hello', 'log'];
 * (function(arr, times) {
 *   for (let i = 0; i < times; i++) {
 *     a.push(a.shift());
 *   }
 * })(a, 1);
 * console[a[0]](a[1]);   // If the array isn't un-shuffled, this will become `console['hello']('log');` which will throw an error.
 *                        // Once un-shuffled, it will work correctly - `console['log']('hello');`
 * This processor will un-shuffle the array by running the IIFE augmenting it, and replace the array with the un-shuffled version,
 * while removing the augmenting IIFE.
 */
import {config, unsafe, utils} from '../modules/index.js';
const {resolveFunctionToArray} = unsafe;
const {badValue} = config;
const {createOrderedSrc, evalInVm, getDeclarationWithContext} = utils.default;

/**
 * Extract the array and the immediately-invoking function expression.
 * Run the IIFE and extract the new augmented array state.
 * Remove the IIFE and replace the array with its new state.
 * @param {Arborist} arb
 * @return {Arborist}
 */
function replaceArrayWithStaticAugmentedVersion(arb) {
	for (let i = 0; i < arb.ast.length; i++) {
		const n = arb.ast[i];
		if (n.type === 'CallExpression' &&
		n.callee.type === 'FunctionExpression' &&
		n.arguments.length > 1 && n.arguments[0].type === 'Identifier' &&
		n.arguments[1].type === 'Literal' && !Number.isNaN(parseInt(n.arguments[1].value))) {
			let targetNode = n;
			while (targetNode && (targetNode.type !== 'ExpressionStatement' && targetNode.parentNode.type !== 'SequenceExpression')) {
				targetNode = targetNode?.parentNode;
			}
			const relevantArrayIdentifier = n.arguments.find(n => n.type === 'Identifier');
			const declKind = /function/i.test(relevantArrayIdentifier.declNode.parentNode.type) ? '' : 'var ';
			const ref = !declKind ? `${relevantArrayIdentifier.name}()` : relevantArrayIdentifier.name;
			// The context for this eval is the relevant array and the IIFE augmenting it (the candidate).
			const contextNodes = getDeclarationWithContext(n, true);
			const context = `${contextNodes.length ? createOrderedSrc(contextNodes) : ''}`;
			// By adding the name of the array after the context, the un-shuffled array is procured.
			const src = `${context};\n${createOrderedSrc([targetNode])}\n${ref};`;
			const replacementNode = evalInVm(src);  // The new node will hold the un-shuffled array's assignment
			if (replacementNode !== badValue) {
				arb.markNode(targetNode || n);
				if (relevantArrayIdentifier.declNode.parentNode.type === 'FunctionDeclaration') {
					arb.markNode(relevantArrayIdentifier.declNode.parentNode.body, {
						type: 'BlockStatement',
						body: [{
							type: 'ReturnStatement',
							argument: replacementNode,
						}],
					});
				} else arb.markNode(relevantArrayIdentifier.declNode.parentNode.init, replacementNode);
			}
		}
	}
	return arb;
}

export const preprocessors = [replaceArrayWithStaticAugmentedVersion, resolveFunctionToArray.default];
export const postprocessors = [];