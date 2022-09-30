const {generateFlatAST} = require('flast');

const sortByNodeId = (a, b) => a.nodeId > b.nodeId ? 1 : b.nodeId > a.nodeId ? -1 : 0;

/**
 * Return the source code of the ordered nodes.
 * @param {ASTNode[]} nodes
 * @param {boolean} preserveOrder (optional) When false, IIFEs are pushed to the end of the code.
 * @return {string} Combined source code of the nodes.
 */
function createOrderedSrc(nodes, preserveOrder = false) {
	nodes.forEach((n, idx) => {
		if (n.type === 'CallExpression') {
			if (n.parentNode.type === 'ExpressionStatement') {
				// noinspection JSValidateTypes
				nodes[idx] = n.parentNode;
				if (n.callee.type === 'FunctionExpression') nodes[idx].nodeId = 9999999; // Exceedingly high nodeId ensures IIFEs are placed last.
			} else if (n.callee.type === 'FunctionExpression') {
				if (!preserveOrder) {
					const newNode = generateFlatAST(`(${n.src});`)[1];
					newNode.nodeId = 9999999;
					nodes[idx] = newNode;
				} else nodes[idx] = n;
			}
		}
	});
	const orderedNodes = [...new Set(nodes)].sort(sortByNodeId);
	let output = '';
	orderedNodes.forEach(n => {
		const addSemicolon = ['VariableDeclarator', 'AssignmentExpression'].includes(n.type);
		output += (n.type === 'VariableDeclarator' ? `${n.parentNode.kind} ` : '') + n.src + (addSemicolon ? ';' : '') + '\n';
	});
	return output;
}

module.exports = createOrderedSrc;