const {badIdentifierCharsRegex, validIdentifierBeginning} = require(__dirname + '/../config');

/**
 * Change all member expressions and class methods which has a property which can support it - to non-computed.
 * E.g.
 *   console['log'] -> console.log
 * @param {Arborist} arb
 * @return {Arborist}
 */
function normalizeComputed(arb) {
	const candidates = arb.ast.filter(n =>
		n.computed &&   // Filter for only member expressions using bracket notation
		// Ignore member expressions with properties which can't be non-computed, like arr[2] or window['!obj']
		// or those having another variable reference as their property like window[varHoldingFuncName]
		(n.type === 'MemberExpression' &&
			n.property.type === 'Literal' &&
			validIdentifierBeginning.test(n.property.value) &&
			!badIdentifierCharsRegex.exec(n.property.value)) ||
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
			!badIdentifierCharsRegex.exec(n.key.value)));
	for (const c of candidates) {
		const relevantProperty = c.type === 'MemberExpression' ? 'property' : 'key';
		const nonComputed = {...c};
		nonComputed.computed = false;
		nonComputed[relevantProperty] = {
			type: 'Identifier',
			name: c[relevantProperty].value,
		};
		arb.markNode(c, nonComputed);
	}
	return arb;
}

module.exports = normalizeComputed;