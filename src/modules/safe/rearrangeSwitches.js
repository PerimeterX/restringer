const getDescendants = require(__dirname + '/../utils/getDescendants');

const maxRepetition = 50;

/**
 *
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function rearrangeSwitches(arb, candidateFilter = () => true) {
	const candidates = arb.ast.filter(n =>
		n.type === 'SwitchStatement' &&
		n.discriminant.type === 'Identifier' &&
		n?.discriminant.declNode?.parentNode?.init?.type === 'Literal' &&
		candidateFilter(n));

	for (const c of candidates) {
		let ordered = [];
		const cases = c.cases;
		let currentVal = c.discriminant.declNode.parentNode.init.value;
		let counter = 0;
		while (currentVal !== undefined && counter < maxRepetition) {
			// A matching case or the default case
			let currentCase = cases.find(n => n.test?.value === currentVal) || cases.find(n => !n.test);
			if (!currentCase) break;
			ordered.push(...currentCase.consequent.filter(n => n.type !== 'BreakStatement'));

			let allDescendants = [];
			currentCase.consequent.forEach(c => allDescendants.push(...getDescendants(c)));
			const assignments2Next = allDescendants.filter(n =>
				n?.declNode === c.discriminant.declNode &&
				n.parentKey === 'left' &&
				n.parentNode.type === 'AssignmentExpression');
			if (assignments2Next.length === 1) {
				currentVal = assignments2Next[0].parentNode.right.value;
			} else {
				// TODO: Handle more complex cases
				currentVal = undefined;
			}
			++counter;
		}
		if (ordered.length) {
			arb.markNode(c, {
				type: 'BlockStatement',
				body: ordered,
			});
		}
	}
	return arb;
}

module.exports = rearrangeSwitches;