const {generateFlatAST} = require('flast');

const largeNumber = 999e8;
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
				if (!preserveOrder && n.callee.type === 'FunctionExpression') {
					// Set nodeId to place IIFE just after its argument's declaration
					const argDeclNodeId = n.arguments.find(a => a.nodeId === Math.max(...n.arguments.filter(arg => arg?.declNode?.nodeId).map(arg => arg.nodeId)))?.nodeId;
					nodes[idx].nodeId = argDeclNodeId ? argDeclNodeId + 1 : nodes[idx].nodeId + largeNumber;
				}
			} else if (n.callee.type === 'FunctionExpression') {
				if (!preserveOrder) {
					const altFuncName = (n.parentNode.type === 'VariableDeclarator' ? n.parentNode.id.name : 'func' + n.nodeId);
					const funcStartRegexp = new RegExp('function[^(]*');
					const funcSrc = n.callee?.id ? n.src : n.src.replace(funcStartRegexp, 'function ' + altFuncName);
					const newNode = generateFlatAST(`(${funcSrc});`)[1];
					if (newNode) {
						newNode.nodeId = n.nodeId + largeNumber;
						nodes[idx] = newNode;
					}
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