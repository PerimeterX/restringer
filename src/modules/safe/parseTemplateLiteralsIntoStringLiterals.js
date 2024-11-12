import {createNewNode} from '../utils/createNewNode.js';

/**
 * E.g.
 * `hello ${'world'}!`; // <-- will be parsed into 'hello world!'
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function parseTemplateLiteralsIntoStringLiterals(arb, candidateFilter = () => true) {
	const relevantNodes = [
		...(arb.ast[0].typeMap.TemplateLiteral || []),
	];
	for (let i = 0; i < relevantNodes.length; i++) {
		const n = relevantNodes[i];
		if (!n.expressions.some(exp => exp.type !== 'Literal') &&
			candidateFilter(n)) {
			let newStringLiteral = '';
			for (let j = 0; j < n.expressions.length; j++) {
				newStringLiteral += n.quasis[j].value.raw + n.expressions[j].value;
			}
			newStringLiteral += n.quasis.slice(-1)[0].value.raw;
			arb.markNode(n, createNewNode(newStringLiteral));
		}
	}
	return arb;
}

export default parseTemplateLiteralsIntoStringLiterals;