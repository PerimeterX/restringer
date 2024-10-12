/**
 * Function To Array Replacements
 * The obfuscated script dynamically generates an array which is referenced throughout the script.
 */
import {unsafe} from '../modules/index.js';
const {resolveFunctionToArray} = unsafe;

export const preprocessors = [resolveFunctionToArray.default];
export const postprocessors = [];
