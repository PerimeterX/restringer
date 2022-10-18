const logger = require(__dirname + '/../utils/logger');
const createNewNode = require(__dirname + '/../utils/createNewNode');

/**
 * E.g.
 * `hello ${'world'}!`; // <-- will be parsed into 'hello world!'
 * @param {Arborist} arb
 * @return {Arborist}
 */
function parseTemplateLiteralsIntoStringLiterals(arb) {
	const candidates = arb.ast.filter(n =>
		n.type === 'TemplateLiteral' &&
		!n.expressions.filter(exp => exp.type !== 'Literal').length);
	for (const c of candidates) {
		let newStringLiteral = '';
		for (let i = 0; i < c.expressions.length; i++) {
			newStringLiteral += c.quasis[i].value.raw + c.expressions[i].value;
		}
		newStringLiteral += c.quasis.slice(-1)[0].value.raw;
		arb.markNode(c, createNewNode(newStringLiteral));
	}
	return arb;
}

module.exports = parseTemplateLiteralsIntoStringLiterals;