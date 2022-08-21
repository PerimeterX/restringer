const evalInVm = require(__dirname + '/evalInVm');
const {badValue} = require(__dirname + '/../config');
const logger = require(__dirname + '/../utils/logger');

/**
 * Resolve unary expressions on values which aren't numbers such as +true, -false, +[], +[...], etc,
 * as well as binary expressions around the + operator. These usually resolve to string values,
 * which can be used to obfuscate code in schemes such as JSFuck.
 * @param {Arborist} arb
 * @return {Arborist}
 */
function resolveMinimalAlphabet(arb) {
	const candidates = arb.ast.filter(n =>
		(n.type === 'UnaryExpression' &&
			((n.argument.type === 'Literal' && /^\D/.exec(n.argument.raw[0])) ||
				n.argument.type === 'ArrayExpression')) ||
		(n.type === 'BinaryExpression' &&
			n.operator === '+' &&
			(n.left.type !== 'MemberExpression' && Number.isNaN(parseFloat(n.left?.value))) &&
			![n.left?.type, n.right?.type].includes('ThisExpression')));
	for (const c of candidates) {
		const newNode = evalInVm(c.src, logger);
		if (newNode !== badValue) {
			arb.markNode(c, newNode);
		}
	}
	return arb;
}

module.exports = resolveMinimalAlphabet;