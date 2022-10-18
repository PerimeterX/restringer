#!/usr/bin/env node
const processors = require(__dirname + '/processors');
const detectObfuscation = require('obfuscation-detector');
const version = require(__dirname + '/../package').version;
const {
	utils: {
		runLoop,
		normalizeScript,
		logger,
	},
	safe: {
		resolveProxyCalls,
		normalizeEmptyStatements,
		consolidateNestedBlockStatements,
		removeDeadNodes,
		resolveRedundantLogicalExpressions,
		resolveMemberExpressionReferencesToArrayIndex,
		resolveMemberExpressionsWithDirectAssignment,
		parseTemplateLiteralsIntoStringLiterals,
		resolveDeterministicIfStatements,
		unwrapFunctionShells,
		replaceFunctionShellsWithWrappedValue,
		replaceFunctionShellsWithWrappedValueIIFE,
		replaceCallExpressionsWithUnwrappedIdentifier,
		replaceEvalCallsWithLiteralContent,
		replaceIdentifierWithFixedAssignedValue,
		replaceIdentifierWithFixedValueNotAssignedAtDeclaration,
		resolveFunctionConstructorCalls,
		resolveProxyVariables,
		resolveProxyReferences,
	},
	unsafe: {
		resolveMinimalAlphabet,
		resolveDefiniteBinaryExpressions,
		resolveAugmentedFunctionWrappedArrayReplacements,
		resolveMemberExpressionsLocalReferences,
		resolveDefiniteMemberExpressions,
		resolveLocalCalls,
		resolveBuiltinCalls,
		resolveDeterministicConditionalExpressions,
		resolveInjectedPrototypeMethodCalls,
		resolveEvalCallsOnNonLiterals,
	},
} = require(__dirname + '/modules');

// Silence asyc errors
process.on('uncaughtException', () => {});

class REstringer {
	static __version__ = version;

	/**
	 * @param {string} script The target script to be deobfuscated
	 * @param {boolean} normalize Run optional methods which will make the script more readable
	 */
	constructor(script, normalize = true) {
		this.script = script;
		this.normalize = normalize;
		this.modified = false;
		this.obfuscationName = 'Generic';
		this.totalChangesCounter = 0;
		this._preprocessors = [];
		this._postprocessors = [];
	}

	/**
	 * Determine the type of the obfuscation, and populate the appropriate pre- and post- processors.
	 */
	determineObfuscationType() {
		const detectedObfuscationType = detectObfuscation(this.script, false).slice(-1)[0];
		if (detectedObfuscationType) {
			const relevantProcessors = processors[detectedObfuscationType]();
			this._preprocessors = relevantProcessors?.preprocessors || [];
			this._postprocessors = relevantProcessors?.postprocessors || [];
			this.obfuscationName = detectedObfuscationType;
		}
		logger.log(`[+] Obfuscation type is ${this.obfuscationName}`);
		return this.obfuscationName;
	}

	/**
	 * @return {Function[]} Deobfuscation methods that don't use eval
	 */
	_safeDeobfuscationMethods() {
		return [
			normalizeEmptyStatements,
			consolidateNestedBlockStatements,
			resolveRedundantLogicalExpressions,
			resolveProxyCalls,
			resolveProxyVariables,
			resolveProxyReferences,
			resolveMemberExpressionReferencesToArrayIndex,
			resolveMemberExpressionsWithDirectAssignment,
			parseTemplateLiteralsIntoStringLiterals,
			resolveDeterministicIfStatements,
			replaceCallExpressionsWithUnwrappedIdentifier,
			replaceEvalCallsWithLiteralContent,
			replaceIdentifierWithFixedAssignedValue,
			replaceIdentifierWithFixedValueNotAssignedAtDeclaration,
			resolveFunctionConstructorCalls,
			replaceFunctionShellsWithWrappedValue,
			replaceFunctionShellsWithWrappedValueIIFE,
			unwrapFunctionShells,
		];
	}

	/**
	 * @return {Function[]} Deobfuscation methods that use eval
	 */
	_unsafeDeobfuscationMethods() {
		return [
			resolveMinimalAlphabet,
			resolveDefiniteBinaryExpressions,
			resolveAugmentedFunctionWrappedArrayReplacements,
			resolveMemberExpressionsLocalReferences,
			resolveDefiniteMemberExpressions,
			resolveBuiltinCalls,
			resolveDeterministicConditionalExpressions,
			resolveInjectedPrototypeMethodCalls,
			resolveLocalCalls,
			resolveEvalCallsOnNonLiterals,
		];
	}

	/**
	 * Make all changes which don't involve eval first in order to avoid running eval on probelmatic values
	 * which can only be detected once part of the script is deobfuscated. Once all the safe changes are made,
	 * continue to the unsafe changes.
	 * Since the unsafe modification may be overreaching, run them only once and try the safe methods again.
	 */
	_loopSafeAndUnsafeDeobfuscationMethods() {
		let modified, script;
		do {
			this.modified = false;
			script = runLoop(this.script, this._safeDeobfuscationMethods());
			script = runLoop(script, this._unsafeDeobfuscationMethods(), 1);
			if (this.script !== script) {
				this.modified = true;
				this.script = script;
			}
			if (this.modified) modified = true;
		} while (this.modified); // Run this loop until the deobfuscation methods stop being effective.
		this.modified = modified;
	}

	/**
	 * Entry point for this class.
	 * Determine obfuscation type and run the pre- and post- processors accordingly.
	 * Run the deobfuscation methods in a loop until nothing more is changed.
	 * Normalize script to make it more readable.
	 * @param {boolean} clean (optional) Remove dead nodes after deobfuscation. Defaults to false.
	 * @return {boolean} true if the script was modified during deobfuscation; false otherwise.
	 */
	deobfuscate(clean = false) {
		this.determineObfuscationType();
		this._runProcessors(this._preprocessors);
		this._loopSafeAndUnsafeDeobfuscationMethods();
		this._runProcessors(this._postprocessors);
		if (this.normalize) this.script = normalizeScript(this.script);
		if (clean) this.script = runLoop(this.script, [removeDeadNodes]);
		return this.modified;
	}

	/**
	 * Run specific deobfuscation which must run before or after the main deobfuscation loop
	 * in order to successfully complete deobfuscation.
	 * @param {Array<Function|string>} processors An array of either imported deobfuscation methods or the name of internal methods.
	 */
	_runProcessors(processors) {
		processors.forEach(proc => this.script = runLoop(this.script, [proc], 1));
	}
}

module.exports = REstringer;
if (require.main === module) {
	try {
		const argv = process.argv;
		if (argv.length > 2) {
			const inputFilename = argv[2];
			const fs = require('node:fs');
			let content = fs.readFileSync(inputFilename, 'utf-8');
			const startTime = Date.now();
			const originalInputLength = content.length;
			logger.log(`[!] Attempting to deobfuscate ${inputFilename} (length: ${originalInputLength})\n`);

			const restringer = new REstringer(content);
			restringer.deobfuscate(argv[3] === '--clean');
			const outputFilename = `${inputFilename}-${restringer.obfuscationName}-deob.js`;
			if (restringer.modified) {
				logger.log(`[+] Output saved to ${outputFilename}\n\tLength: ${restringer.script.length} ` +
					`(difference is ${restringer.script.length - content.length})\n\tChanges: ${restringer.totalChangesCounter}`);
				logger.log(`[!] Deobfuscation took ${(Date.now() - startTime) / 1000} seconds`);
				// TODO write to file per command line arugments
				if (logger.isLogging()) fs.writeFileSync(outputFilename, restringer.script, {encoding: 'utf-8'});
				else console.log(restringer.script);
			} else logger.log(`[-] Nothing was deobfuscated  ¯\\_(ツ)_/¯`);
		} else console.log('Usage:\n\trestringer.js obfuscated.js \t\t# Print deobfuscated file to stdout\n\t' +
			'restringer.js obfuscated.js --clean \t# Print deobfuscated file to stdout and remove dead nodes');
	} catch (e) {
		logger.error(`[-] Critical Error: ${e}`);
	}
}