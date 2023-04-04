const {generateFlatAST} = require('flast');
const logger = require(__dirname + '/../utils/logger');
const getCache = require(__dirname + '/../utils/getCache');
const generateHash = require(__dirname + '/../utils/generateHash');

/**
 * Extract string values of eval call expressions, and replace calls with the actual code, without running it through eval.
 * E.g.
 *    new Function('!function() {console.log("hello world")}()')();
 * will be replaced with
 *    !function () {console.log("hello world")}();
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function replaceNewFuncCallsWithLiteralContent(arb, candidateFilter = () => true) {
	const cache = getCache(arb.ast[0].scriptHash);
	const candidates = arb.ast.filter(n =>
		n.type === 'NewExpression' &&
		n.parentKey === 'callee' &&
		n.parentNode?.arguments?.length === 0 &&
		n.callee?.name === 'Function' &&
		n.arguments?.length === 1 &&
		n.arguments[0].type === 'Literal' &&
		candidateFilter(n));

	for (const c of candidates) {
		const targetCodeStr = c.arguments[0].value;
		const cacheName = `replaceEval-${generateHash(targetCodeStr)}`;
		try {
			if (!cache[cacheName]) {
				let body;
				if (targetCodeStr) {
					body = generateFlatAST(targetCodeStr, {detailed: false})[0].body;
					if (body.length > 1) {
						body = {
							type: 'BlockStatement',
							body,
						};
					} else {
						body = body[0];
						if (body.type === 'ExpressionStatement') body = body.expression;
					}
				} else body = {
					type: 'Literal',
					value: targetCodeStr,
				};
				cache[cacheName] = body;
			}
			let replacementNode = cache[cacheName];
			let targetNode = c.parentNode;
			if (targetNode.parentNode.type === 'ExpressionStatement' && replacementNode.type === 'BlockStatement') {
				targetNode = targetNode.parentNode;
			}
			arb.markNode(targetNode, replacementNode);
		} catch (e) {
			logger.debug(`[-] Unable to replace new function's body with call expression: ${e}`);
		}
	}
	return arb;
}

module.exports = replaceNewFuncCallsWithLiteralContent;