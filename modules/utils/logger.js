/**
 * Debugging helper
 * Set the environment variable DEOBDEBUG='true' to print out debug messages and save output as file
 * Default behavior is to suppress debug messages and output deobfuscated code to standard output
 * Debug mode can also be enabled from the outer scope when this module is being imported
 */

const isDebugModeOn = process.env.DEOBDEBUG === 'true' || false;
const defaultDebugLevel = 50;
let debugLevel = process.env.DEOBDEBUGLEVEL || defaultDebugLevel; // The lower the number the more verbose it is
const log = (msg, level = defaultDebugLevel) => isDebugModeOn && level >= debugLevel ? console.log(msg) : undefined;
const error = (msg, level = defaultDebugLevel) => isDebugModeOn && level >= debugLevel ? console.error(msg) : undefined;

module.exports = {
	isDebugModeOn,
	debugLevel,
	log,
	error,
};