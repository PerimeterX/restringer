/**
 * Function To Array Replacements
 * The obfuscated script dynamically generates an array which is referenced throughout the script.
 */
function replaceFunctionWithArray() {
	return this.runLoop([parseArray]);
}

/**
 * Run the generating function and replace it with the actual array.
 * Candidates are variables which are assigned a call expression, and every reference to them is a member expression.
 * E.g.
 *   function getArr() {return ['One', 'Two', 'Three']};
 *   const a = getArr();
 *   console.log(`${a[0]} + ${a[1]} = ${a[2]}`);
 */
function parseArray() {
	const candidates = this._ast.filter(n =>
		n.type === 'VariableDeclarator' &&
		n.init?.type === 'CallExpression' &&
		n.id?.references &&
		n.id?.references.filter(r =>
			r.parentNode.type === 'MemberExpression').length === n.id?.references.length);
	for (const c of candidates) {
		const newNode = this._evalInVm(c.init.src);
		if (newNode !== this.badValue) {
			this._markNode(c.init, newNode);
		}
	}
}

module.exports = {
	preprocessors: [replaceFunctionWithArray],
	postprocessors: [],
};
