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
	const {parseArgs, printHelp} = require(__dirname + '/utils/parseArgs');
	try {
		const args = parseArgs(process.argv.slice(2));
		if (Object.keys(args).length && !(args.verbose && args.quiet) && args.inputFilename) {
			const fs = require('node:fs');
			let content = fs.readFileSync(args.inputFilename, 'utf-8');
			const startTime = Date.now();
			logger.log(`[!] Deobfuscating ${args.inputFilename}...\n`);

			const restringer = new REstringer(content);
			if (args.quiet) restringer.logger.setLogLevel(logger.logLevels.NONE);
			else if (args.verbose) restringer.logger.setLogLevel(logger.logLevels.DEBUG);
			restringer.deobfuscate();
			if (restringer.modified) {
				logger.log(`[+] Saved ${args.outputFilename}`);
				logger.log(`[!] Deobfuscation took ${(Date.now() - startTime) / 1000} seconds, with ${restringer.totalChangesCounter} changes.`);
				if (args.outputToFile) fs.writeFileSync(args.outputFilename, restringer.script, {encoding: 'utf-8'});
				else console.log(restringer.script);
			} else logger.log(`[-] Nothing was deobfuscated  ¯\\_(ツ)_/¯`);
		} else {
			if (!args.inputFilename) console.log(`Input filename must be provided`);
			else if (args.verbose && args.quiet) console.log(`Don't set both -q and -v at the same time *smh*`);
			console.log(printHelp());
		}
	} catch (e) {
		logger.error(`[-] Critical Error: ${e}`);
	}
}