// noinspection HtmlRequiredLangAttribute,HtmlRequiredTitleElement

const fs = require('fs');
const {NodeVM} = require('vm2');
const {JSDOM} = require('jsdom');
const defaultLogger = require(__dirname + '/../utils/logger');
const generateHash = require(__dirname + '/../utils/generateHash');

let jQuerySrc = '';

let cache = {};
const maxCacheSize = 100;

/**
 * Place a string into a file and evaluate it with a simulated browser environment.
 * @param {string} stringToEval
 * @param {boolean} injectjQuery Inject jQuery into the VM if true.
 * @param {object} logger (optional) logging functions.
 * @return {string} The output string if successful; empty string otherwise.
 */
function evalWithDom(stringToEval, injectjQuery = false, logger = defaultLogger) {
	const cacheName = `evalWithDom-${generateHash(stringToEval)}`;
	if (!cache[cacheName]) {
		if (Object.keys(cache).length >= maxCacheSize) cache = {};
		let out = '';
		const vm = new NodeVM({
			console: 'redirect',
			timeout: 100 * 1000,
			sandbox: {JSDOM},
		});
		try {
			// Set up the DOM, and allow script to run wild: <img src='I_too_like_to_run_scripts_dangerously.jpg'/>
			let runString = 'const dom = new JSDOM(`<html><head></head><body></body></html>`, {runScripts: \'dangerously\'}); ' +
				'const window = dom.window; ' +
				'const document = window.document; ';
			// Lazy load the jQuery when needed, and inject it to the head
			if (injectjQuery) {
				jQuerySrc = jQuerySrc || fs.readFileSync(__dirname + '/jquery.slim.min.js');
				runString += 'const jqueryScript = document.createElement(\'script\'); ' +
					'jqueryScript.src = ' + jQuerySrc + '; ' +
					'document.head.appendChild(jqueryScript);';
			}
			// Inject the string to eval as a script into the body
			runString += 'const script = document.createElement(\'script\'); ' +
				'script.src = ' + stringToEval + '; ' +
				'document.body.appendChild(script);';
			// Catch and save the console.log's message
			vm.on('console.log', function (msg) {
				out = msg;
			});
			vm.run(runString);
		} catch (e) {
			logger.error(`[-] Error in evalWithDom: ${e}`, 1);
		}
		cache[cacheName] = out;
	}
	return cache[cacheName];
}

module.exports = evalWithDom;