const evalInVm = require(__dirname + '/evalInVm');
const {badValue} = require(__dirname + '/../config');
const getDescendants = require(__dirname + '/../utils/getDescendants');

/**
 * Resolve unary expressions on values which aren't numbers such as +true, +[], +[...], etc,
 * as well as binary expressions around the + operator. These usually resolve to string values,
 * which can be used to obfuscate code in schemes such as JSFuck.
 * @param {Arborist} arb
 * @return {Arborist}
 */
function resolveMinimalAlphabet(arb) {
	const candidates = arb.ast.filter(n =>
		(n.type === 'UnaryExpression' &&
			((n.argument.type === 'Literal' && /^\D/.test(n.argument.raw[0])) ||
				n.argument.type === 'ArrayExpression')) ||
		(n.type === 'BinaryExpression' &&
			n.operator === '+' &&
			(n.left.type !== 'MemberExpression' && Number.isNaN(parseFloat(n.left?.value))) &&
			![n.left?.type, n.right?.type].includes('ThisExpression')));

	for (const c of candidates) {
		if (getDescendants(c).find(n => n.type === 'ThisExpression')) continue;
		const newNode = evalInVm(c.src);
		if (newNode !== badValue) {
			arb.markNode(c, newNode);
		}
	}
	return arb;
}

module.exports = resolveMinimalAlphabet;