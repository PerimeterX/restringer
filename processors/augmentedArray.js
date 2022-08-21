const {
	unsafe: {
		evalInVm
	},
	config: {
		badValue
	},
	utils: {
		createOrderedSrc,
		getDeclarationWithContext,
	},
} = require(__dirname + '/../modules');

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

/**
 * Extract the array and the immediately-invoking function expression.
 * Run the IIFE and extract the new augmented array state.
 * Remove the IIFE and replace the array with its new state.
 * @param {Arborist} arb
 * @return {Arborist}
 */
function replaceArrayWithStaticAugmentedVersion(arb) {
	const candidates = arb.ast.filter(n =>
		n.type === 'CallExpression' &&
		n.callee.type === 'FunctionExpression' &&
		n.arguments.length > 1 && n.arguments[0].type === 'Identifier' &&
		n.arguments[1].type === 'Literal' && !Number.isNaN(parseInt(n.arguments[1].value)));
	for (const candidate of candidates) {
		const relevantArrayIdentifier = candidate.arguments.filter(n => n.type === 'Identifier')[0];
		// The context for this eval is the relevant array and the IIFE augmenting it (the candidate).
		const context = `var ${relevantArrayIdentifier.declNode.parentNode.src}\n!${createOrderedSrc(getDeclarationWithContext(candidate))}`;
		// By adding the name of the array after the context, the un-shuffled array is procured.
		const src = `${context};\n${relevantArrayIdentifier.name};`;
		const newNode = evalInVm(src);  // The new node will hold the un-shuffled array's assignment
		if (newNode !== badValue) {
			let candidateExpression = candidate;
			while (candidateExpression && candidateExpression.type !== 'ExpressionStatement') {
				candidateExpression = candidateExpression?.parentNode;
			}
			arb.markNode(candidateExpression ? candidateExpression : candidate);
			arb.markNode(relevantArrayIdentifier.declNode.parentNode.init, newNode);
		}
	}
	return arb;
}

module.exports = {
	preprocessors: [replaceArrayWithStaticAugmentedVersion],
	postprocessors: [],
};
