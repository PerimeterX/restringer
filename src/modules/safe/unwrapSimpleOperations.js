const operators = ['+', '-', '*', '/', '%', '&', '|', '&&', '||', '**', '^'];
const fixes = ['!', '~', '-', '+', '--', '++'];

/**
 *
 * @param {ASTNode} n
 * @return {boolean}
 */
function matchBinaryOrLogical(n) {
	return ['LogicalExpression', 'BinaryExpression'].includes(n.type) &&
		operators.includes(n.operator) &&
		n.parentNode.type === 'ReturnStatement' &&
		n.parentNode.parentNode?.body?.length === 1 &&
		n.left?.declNode?.parentKey === 'params' &&
		n.right?.declNode?.parentKey === 'params';
}

/**
 *
 * @param {ASTNode} c
 * @param {Arborist} arb
 */
function handleBinaryOrLogical(c, arb) {
	// noinspection JSUnresolvedVariable
	const refs = (c.scope.block?.id?.references || []).map(r => r.parentNode);
	for (const ref of refs) {
		if (ref.arguments.length === 2) arb.markNode(ref, {
			type: c.type,
			operator: c.operator,
			left: ref.arguments[0],
			right: ref.arguments[1],
		});
	}
}

/**
 *
 * @param {ASTNode} n
 * @return {boolean}
 */
function matchUnary(n) {
	return n.type === 'UnaryExpression' &&
		fixes.includes(n.operator) &&
		n.parentNode.type === 'ReturnStatement' &&
		n.parentNode.parentNode?.body?.length === 1 &&
		n.argument?.declNode?.parentKey === 'params';
}

/**
 *
 * @param {ASTNode} c
 * @param {Arborist} arb
 */
function handleUnary(c, arb) {
	// noinspection JSUnresolvedVariable
	const refs = (c.scope.block?.id?.references || []).map(r => r.parentNode);
	for (const ref of refs) {
		if (ref.arguments.length === 1) arb.markNode(ref, {
			type: c.type,
			operator: c.operator,
			prefix: c.prefix,
			argument: ref.arguments[0],
		});
	}
}

/**
 * Replace calls to functions that wrap simple operations with the actual operations
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function unwrapSimpleOperations(arb, candidateFilter = () => true) {
	for (let i = 0; i < arb.ast.length; i++) {
		const n = arb.ast[i];
		if ((matchBinaryOrLogical(n) || matchUnary(n)) &&
		candidateFilter(n)) {
			switch (n.type) {
				case 'BinaryExpression':
				case 'LogicalExpression':
					handleBinaryOrLogical(n, arb);
					break;
				case 'UnaryExpression':
					handleUnary(n, arb);
					break;
			}
		}
	}
	return arb;
}

module.exports = unwrapSimpleOperations;