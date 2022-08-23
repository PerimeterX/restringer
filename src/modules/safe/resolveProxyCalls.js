/**
 * Remove redundant call expressions which only pass the arguments to other call expression.
 * E.g.
 * function call1(a, b) {
 *   return a + b;
 * }
 * function call2(c, d) {
 *   return call1(c, d);        // will be changed to call1(c, d);
 * }
 * function call3(e, f) {
 *   return call2(e, f);        // will be changed to call1(e, f);
 * }
 * const three = call3(1, 2);   // will be changed to call1(1, 2);
 * @param {Arborist} arb
 * @return {Arborist}
 */
function resolveProxyCalls(arb) {
	const candidates = arb.ast.filter(n =>
		n.type === 'FunctionDeclaration' &&
		n.body?.body?.length === 1 &&
		n.body.body[0].type === 'ReturnStatement' &&
		n.body.body[0].argument?.type === 'CallExpression' &&
		n.body.body[0].argument.arguments.length === n.params.length &&
		n.body.body[0].argument.callee.type === 'Identifier');
	for (const c of candidates) {
		const funcId = c.id;
		const ret = c.body.body[0].argument;
		let  transitiveArguments = true;
		try {
			for (let i = 0; i < c.params.length; i++) {
				if (c.params[i]?.name !== ret?.arguments[i]?.name) {
					transitiveArguments = false;
					break;
				}
			}
		} catch {
			transitiveArguments = false;
		}
		if (!transitiveArguments) continue;
		for (const ref of funcId.references || []) {
			arb.markNode(ref, ret.callee);
		}
	}
	return arb;
}

module.exports = resolveProxyCalls;