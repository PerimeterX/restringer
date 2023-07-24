/**
 * Function To Array Replacements
 * The obfuscated script dynamically generates an array which is referenced throughout the script.
 */
const Sandbox = require(__dirname + '/../utils/sandbox');
const evalInVm = require(__dirname + '/../utils/evalInVm');
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
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function resolveFunctionToArray(arb,  candidateFilter = () => true) {
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

module.exports = resolveFunctionToArray;
