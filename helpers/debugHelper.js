/**
 * Debugging helper
 * Set the environment variable DEOBDEBUG='true' to print out debug messages and save output as file
 * Default behavior is to suppress debug messages and output deobfuscated code to standard output
 * Debug mode can also be enabled from the outer scope when this module is being imported
 */

const DEBUGMODEON = process.env.DEOBDEBUG === 'true' || false;
const defaultDebugLevel = 50;
let DEBUGLEVEL = process.env.DEOBDEBUGLEVEL || defaultDebugLevel; // The lower the number the more verbose it is
const debugLog = (msg, level = defaultDebugLevel) => DEBUGMODEON && level >= DEBUGLEVEL ? console.log(msg) : undefined;
const debugErr = (msg, level = defaultDebugLevel) => DEBUGMODEON && level >= DEBUGLEVEL ? console.error(msg) : undefined;

module.exports = {
	DEBUGMODEON,
	DEBUGLEVEL,
	debugLog,
	debugErr,
};