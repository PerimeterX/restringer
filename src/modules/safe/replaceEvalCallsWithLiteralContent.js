const {generateFlatAST} = require('flast');
const logger = require(__dirname + '/../utils/logger');

const cache = {};

/**
 * Extract string values of eval call expressions, and replace calls with the actual code, without running it through eval.
 * E.g.
 * eval('console.log("hello world")'); // <-- will be replaced with console.log("hello world");
 * @param {Arborist} arb
 * @return {Arborist}
 */
function replaceEvalCallsWithLiteralContent(arb) {
	const scriptHash = arb.ast[0].scriptHash;
	if (!cache[scriptHash]) cache[scriptHash] = {};
	const candidates = arb.ast.filter(n =>
		n.type === 'CallExpression' &&
		n.callee?.name === 'eval' &&
		n.arguments[0]?.type === 'Literal');
	for (const c of candidates) {
		const cacheName = `replaceEval-${c.src}}`;
		try {
			if (!cache[scriptHash][cacheName]) {
				let body;
				if (c.arguments[0].value) {
					body = generateFlatAST(c.arguments[0].value, {detailed: false})[1];
				} else body = {
					type: 'Literal',
					value: c.arguments[0].value,
				};
				cache[scriptHash][cacheName] = body;
			}
			let replacementNode = cache[scriptHash][cacheName];
			let targetNode = c;
			// Edge case where the eval call renders an identifier which is then used in a call expression:
			// eval('Function')('alert("hacked!")');
			if (c.parentKey === 'callee') {
				targetNode = c.parentNode;
				if (replacementNode.type === 'ExpressionStatement' && replacementNode.expression.type === 'Identifier') {
					replacementNode = replacementNode.expression;
				}
				replacementNode = {...c.parentNode, callee: replacementNode};
			}
			arb.markNode(targetNode, replacementNode);
		} catch (e) {
			logger.error(`[-] Unable to replace eval's body with call expression: ${e}`, 1);
		}
	}
	return arb;
}

module.exports = replaceEvalCallsWithLiteralContent;