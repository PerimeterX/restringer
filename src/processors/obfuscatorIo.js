/**
 * Obfuscator.io obfuscation
 * The obfuscator optionally adds 'debug protection' methods that when triggered, result in an endless loop.
 */
const augmentedArrayProcessors = require(__dirname + '/augmentedArray');

/**
 * The debug protection in this case revolves around detecting the script has been beautified by testing a function's
 * toString against a regex. If the text fails the script creates an infinte loop which prevents the script from running.
 * To circumvent this protection, the tested functions are replaced with a string that passes the test.
 * @param {Arborist} arb
 * @return {Arborist}
 */
function freezeUnbeautifiedValues(arb) {
	const replacementString = 'function () {return "bypassed!"}';
	const candidates = arb.ast.filter(n =>
		n.type === 'Literal' && ['newState', 'removeCookie'].includes(n.value));
	for (const c of candidates) {
		let targetNode;
		switch (c.value) {
			case 'newState':
				if (c.parentNode?.parentNode?.parentNode?.type === 'FunctionExpression') {
					targetNode = c.parentNode.parentNode.parentNode;
				}
				break;
			case 'removeCookie':
				targetNode = c.parentNode?.value;
				break;
		}
		if (targetNode) {
			arb.markNode(targetNode, {
				type: 'Literal',
				value: replacementString,
				raw: `"${replacementString}"`,
			});
		}
	}
	return arb;
}

module.exports = {
	preprocessors: [freezeUnbeautifiedValues, ...augmentedArrayProcessors.preprocessors],
	postprocessors: [...augmentedArrayProcessors.postprocessors],
};
