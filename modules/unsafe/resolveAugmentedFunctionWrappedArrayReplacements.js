const evalInVm = require(__dirname + '/evalInVm');
const {badValue} = require(__dirname + '/../config');
const logger = require(__dirname + '/../utils/logger');
const getDescendants = require(__dirname + '/../utils/getDescendants');

/**
 * A special case of function array replacement where the function is wrapped in another function, the array is
 * sometimes wrapped in its own function, and is also augmented.
 * TODO: Add example code
 * @param {Arborist} arb
 * @return {Arborist}
 */
function resolveAugmentedFunctionWrappedArrayReplacements(arb) {
	const candidates = arb.ast.filter(n =>
		n.type === 'FunctionDeclaration' && n.id);
	for (const c of candidates) {
		const descendants = getDescendants(c);
		if (descendants.filter(d =>
			d.type === 'AssignmentExpression' &&
			d.left?.name === c.id?.name).length) {
			const arrDecryptor = c;
			const arrCandidates = descendants.filter(n =>
				n.type === 'MemberExpression' && n.object.type === 'Identifier')
				.map(n => n.object);
			for (const ac of arrCandidates) {
				// If a direct reference to a global variable pointing at an array
				let arrRef;
				if (!ac.declNode) continue;
				if (ac.declNode.scope.type === 'global') {
					if (ac.declNode.parentNode?.init?.type === 'ArrayExpression') {
						arrRef = ac.declNode.parentNode?.parentNode || ac.declNode.parentNode;
					}
				} else if (ac.declNode.parentNode?.init?.type === 'CallExpression') {
					arrRef = ac.declNode.parentNode.init.callee.declNode.parentNode;
				}
				if (arrRef) {
					const arrRefId = ac.declNode.nodeId;
					const iifes = arb.ast.filter(n =>
						n.type === 'ExpressionStatement' &&
						n.expression.type === 'CallExpression' &&
						n.expression.callee.type === 'FunctionExpression' &&
						n.expression.arguments.length &&
						n.expression.arguments[0].type === 'Identifier' &&
						n.expression.arguments[0].declNode.nodeId === arrRefId);
					if (iifes.length) {
						const iife = iifes[0];
						const context = [arrRef.src, arrDecryptor.src, iife.src].join('\n');
						const skipScopes = [arrRef.scope.scopeId, arrDecryptor.scope.scopeId, iife.expression.callee.scope.scopeId];
						const replacementCandidates = arb.ast.filter(n =>
							n?.callee?.name === arrDecryptor.id.name &&
							!skipScopes.includes(n.scope.scopeId));
						for (const rc of replacementCandidates) {
							const src = `${context}\n${rc.src}`;
							const newNode = evalInVm(src, logger);
							if (newNode !== badValue) arb.markNode(rc, newNode);
						}
					}
				}
			}
		}
	}
	return arb;
}

module.exports = resolveAugmentedFunctionWrappedArrayReplacements;