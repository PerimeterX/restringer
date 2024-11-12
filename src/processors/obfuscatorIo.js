/**
 * Obfuscator.io obfuscation
 * The obfuscator optionally adds 'debug protection' methods that when triggered, result in an endless loop.
 */
import * as augmentedArrayProcessors from './augmentedArray.js';

const freezeReplacementString = 'function () {return "bypassed!"}';

/**
 * The debug protection in this case revolves around detecting the script has been beautified by testing a function's
 * toString against a regex. If the text fails the script creates an infinte loop which prevents the script from running.
 * To circumvent this protection, the tested functions are replaced with a string that passes the test.
 * @param {Arborist} arb
 * @return {Arborist}
 */
function freezeUnbeautifiedValues(arb) {
	const relevantNodes = [
		...(arb.ast[0].typeMap.Literal || []),
	];
	for (let i = 0; i < relevantNodes.length; i++) {
		const n = relevantNodes[i];
		if (['newState', 'removeCookie'].includes(n.value)) {
			let targetNode;
			switch (n.value) {
				case 'newState':
					if (n.parentNode?.parentNode?.parentNode?.type === 'FunctionExpression') {
						targetNode = n.parentNode.parentNode.parentNode;
					}
					break;
				case 'removeCookie':
					targetNode = n.parentNode?.value;
					break;
			}
			if (targetNode) {
				arb.markNode(targetNode, {
					type: 'Literal',
					value: freezeReplacementString,
					raw: `"${freezeReplacementString}"`,
				});
			}
		}
	}
	return arb;
}

export const preprocessors = [freezeUnbeautifiedValues, ...augmentedArrayProcessors.preprocessors];
export const postprocessors = [...augmentedArrayProcessors.postprocessors];