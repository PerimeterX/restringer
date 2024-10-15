import {utils} from 'flast';
const {applyIteratively} = utils;
import * as normalizeComputed from '../safe/normalizeComputed.js';
import * as normalizeEmptyStatements from '../safe/normalizeEmptyStatements.js';
import * as normalizeRedundantNotOperator from '../unsafe/normalizeRedundantNotOperator.js';

/**
 * Make the script more readable without actually deobfuscating or affecting its functionality.
 * @param {string} script
 * @return {string} The normalized script.
 */
export function normalizeScript(script) {
	return applyIteratively(script, [
		normalizeComputed.default,
		normalizeRedundantNotOperator.default,
		normalizeEmptyStatements.default,
	]);
}