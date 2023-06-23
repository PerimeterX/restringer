const {badIdentifierCharsRegex, validIdentifierBeginning} = require(__dirname + '/../config');

/**
 * Change all member expressions and class methods which has a property which can support it - to non-computed.
 * E.g.
 *   console['log'] -> console.log
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function normalizeComputed(arb, candidateFilter = () => true) {
	for (let i = 0; i < arb.ast.length; i++) {
		const n = arb.ast[i];
		if (n.computed &&   // Filter for only member expressions using bracket notation
			// Ignore member expressions with properties which can't be non-computed, like arr[2] or window['!obj']
			// or those having another variable reference as their property like window[varHoldingFuncName]
			(n.type === 'MemberExpression' &&
				n.property.type === 'Literal' &&
				validIdentifierBeginning.test(n.property.value) &&
				!badIdentifierCharsRegex.test(n.property.value)) ||
			/**
			 * Ignore the same cases for method names and object properties, for example
			 * class A {
			 *  ['!hello']() {} // Can't change the name of this method
			 *  ['miao']() {}   // This can be changed to 'miao() {}'
			 *  }
			 *  const obj = {
			 *    ['!hello']: 1,  // Will be ignored
			 *    ['miao']: 4     // Will be changed to 'miao: 4'
			 *  };
			 */
			(['MethodDefinition', 'Property'].includes(n.type) &&
				n.key.type === 'Literal' &&
				validIdentifierBeginning.test(n.key.value) &&
				!badIdentifierCharsRegex.test(n.key.value)) &&
			candidateFilter(n)) {
			const relevantProperty = n.type === 'MemberExpression' ? 'property' : 'key';
			arb.markNode(n, {
				...n,
				computed: false,
				[relevantProperty]: {
					type: 'Identifier',
					name: n[relevantProperty].value,
				},
			});
		}
	}
	return arb;
}

module.exports = normalizeComputed;