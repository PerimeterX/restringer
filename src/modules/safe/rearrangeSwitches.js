import {getDescendants} from '../utils/getDescendants.js';

const maxRepetition = 50;

/**
 *
 * @param {Arborist} arb
 * @param {Function} candidateFilter (optional) a filter to apply on the candidates list
 * @return {Arborist}
 */
function rearrangeSwitches(arb, candidateFilter = () => true) {
	const relevantNodes = [
		...(arb.ast[0].typeMap.SwitchStatement || []),
	];
	for (let i = 0; i < relevantNodes.length; i++) {
		const n = relevantNodes[i];
		if (n.discriminant.type === 'Identifier' &&
		n?.discriminant.declNode?.parentNode?.init?.type === 'Literal' &&
		candidateFilter(n)) {
			let ordered = [];
			const cases = n.cases;
			let currentVal = n.discriminant.declNode.parentNode.init.value;
			let counter = 0;
			while (currentVal !== undefined && counter < maxRepetition) {
				// A matching case or the default case
				let currentCase;
				for (let j = 0; j < cases.length; j++) {
					if (cases[j].test?.value === currentVal || !cases[j].test) {
						currentCase = cases[j];
						break;
					}
				}
				if (!currentCase) break;
				for (let j = 0; j < currentCase.consequent.length; j++) {
					if (currentCase.consequent[j].type !== 'BreakStatement') {
						ordered.push(currentCase.consequent[j]);
					}
				}
				let allDescendants = [];
				for (let j = 0; j < currentCase.consequent.length; j++) {
					allDescendants.push(...getDescendants(currentCase.consequent[j]));
				}
				const assignments2Next = [];
				for (let j = 0; j < allDescendants.length; j++) {
					const d = allDescendants[j];
					if (d.declNode === n.discriminant.declNode &&
						d.parentKey === 'left' &&
						d.parentNode.type === 'AssignmentExpression') {
						assignments2Next.push(d);
					}
				}
				if (assignments2Next.length === 1) {
					currentVal = assignments2Next[0].parentNode.right.value;
				} else {
					// TODO: Handle more complex cases
					currentVal = undefined;
				}
				++counter;
			}
			if (ordered.length) {
				arb.markNode(n, {
					type: 'BlockStatement',
					body: ordered,
				});
			}
		}
	}
	return arb;
}

export default rearrangeSwitches;