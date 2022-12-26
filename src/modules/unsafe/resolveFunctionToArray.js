/**
 * Function To Array Replacements
 * The obfuscated script dynamically generates an array which is referenced throughout the script.
 */
const evalInVm = require(__dirname + '/evalInVm');
const {
	createOrderedSrc,
	getDeclarationWithContext,
} = require(__dirname + '/../utils');
const {badValue} = require(__dirname + '/../config');

/**
 * Run the generating function and replace it with the actual array.
 * Candidates are variables which are assigned a call expression, and every reference to them is a member expression.
 * E.g.
 *   function getArr() {return ['One', 'Two', 'Three']};
 *   const a = getArr();
 *   console.log(`${a[0]} + ${a[1]} = ${a[2]}`);
 * @param {Arborist} arb
 * @return {Arborist}
 */
function resolveFunctionToArray(arb) {
	// noinspection DuplicatedCode
	const candidates = arb.ast.filter(n =>
		n.type === 'VariableDeclarator' &&
		n.init?.type === 'CallExpression' &&
		n.id?.references &&
		!n.id.references.find(r => r.parentNode.type !== 'MemberExpression'));

	for (const c of candidates) {
		const targetNode = c.init.callee?.declNode?.parentNode || c.init;
		const src = createOrderedSrc(getDeclarationWithContext(targetNode)) + `\n${createOrderedSrc([c.init])}`;
		const newNode = evalInVm(src);
		if (newNode !== badValue) {
			arb.markNode(c.init, newNode);
		}
	}
	return arb;
}

module.exports = resolveFunctionToArray;
