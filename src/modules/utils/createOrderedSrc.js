import {parseCode} from 'flast';

const largeNumber = 999e8;
const sortByNodeId = (a, b) => a.nodeId > b.nodeId ? 1 : b.nodeId > a.nodeId ? -1 : 0;
const funcStartRegexp = new RegExp('function[^(]*');

/**
 * Add a name to a FunctionExpression.
 * @param {ASTNode} n The target node
 * @param {string} [name] The new name. Defaults to 'func + n.nodeId'.
 * @return {ASTNode} The new node with the name set
 */
function addNameToFE(n, name) {
	name = name || 'func' + n.nodeId;
	const funcSrc = '(' + n.src.replace(funcStartRegexp, 'function ' + name) + ');';
	const newNode = parseCode(funcSrc);
	if (newNode) {
		newNode.nodeId = n.nodeId;
		newNode.src = funcSrc;
		return newNode;
	}
}

/**
 * Return the source code of the ordered nodes.
 * @param {ASTNode[]} nodes
 * @param {boolean} preserveOrder (optional) When false, IIFEs are pushed to the end of the code.
 * @return {string} Combined source code of the nodes.
 */
function createOrderedSrc(nodes, preserveOrder = false) {
	const parsedNodes = [];
	for (let i = 0; i < nodes.length; i++)  {
		let n = nodes[i];
		if (n.type === 'CallExpression') {
			if (n.parentNode.type === 'ExpressionStatement') {
				nodes[i] = n.parentNode;
				if (!preserveOrder && n.callee.type === 'FunctionExpression') {
					// Set nodeId to place IIFE just after its argument's declaration
					const argDeclNodeId = n.arguments.find(a => a.nodeId === Math.max(...n.arguments.filter(arg => arg?.declNode?.nodeId).map(arg => arg.nodeId)))?.nodeId;
					nodes[i].nodeId = argDeclNodeId ? argDeclNodeId + 1 : nodes[i].nodeId + largeNumber;
				}
			} else if (n.callee.type === 'FunctionExpression') {
				if (!preserveOrder) {
					const newNode = addNameToFE(n, n.parentNode?.id?.name);
					newNode.nodeId = newNode.nodeId + largeNumber;
					nodes[i] = newNode;
				} else nodes[i] = n;
			}
		} else if (n.type === 'FunctionExpression' && !n.id) {
			nodes[i] = addNameToFE(n, n.parentNode?.id?.name);
		}
		n = nodes[i];	// In case the node was replaced
		if (!parsedNodes.includes(n)) parsedNodes.push(n);
	}
	parsedNodes.sort(sortByNodeId);
	let output = '';
	for (let i = 0; i < parsedNodes.length; i++)  {
		const n = parsedNodes[i];
		const addSemicolon = ['VariableDeclarator', 'AssignmentExpression'].includes(n.type);
		output += (n.type === 'VariableDeclarator' ? `${n.parentNode.kind} ` : '') + n.src + (addSemicolon ? ';' : '') + '\n';
	}
	return output;
}

export {createOrderedSrc};