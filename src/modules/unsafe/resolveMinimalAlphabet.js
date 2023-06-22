const {badValue} = require(__dirname + '/../config');
const evalInVm = require(__dirname + '/../utils/evalInVm');
const getDescendants = require(__dirname + '/../utils/getDescendants');

/**
 * Resolve unary expressions on values which aren't numbers such as +true, +[], +[...], etc,
 * as well as binary expressions around the + operator. These usually resolve to string values,
 * which can be used to obfuscate code in schemes such as JSFuck.
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function resolveMinimalAlphabet(arb, candidateFilter = () => true) {
	for (let i = 0; i < arb.ast.length; i++) {
		const n = arb.ast[i];
		if ((n.type === 'UnaryExpression' &&
			((n.argument.type === 'Literal' && /^\D/.test(n.argument.raw[0])) ||
				n.argument.type === 'ArrayExpression')) ||
		(n.type === 'BinaryExpression' &&
			n.operator === '+' &&
			(n.left.type !== 'MemberExpression' && Number.isNaN(parseFloat(n.left?.value))) &&
			![n.left?.type, n.right?.type].includes('ThisExpression')) &&
		candidateFilter(n)) {
			if (getDescendants(n).find(n => n.type === 'ThisExpression')) continue;
			const replacementNode = evalInVm(n.src);
			if (replacementNode !== badValue) {
				arb.markNode(n, replacementNode);
			}
		}
	}
	return arb;
}

module.exports = resolveMinimalAlphabet;