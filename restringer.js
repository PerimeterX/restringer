#!/usr/bin/env node
// noinspection JSValidateJSDoc

const fs = require('fs');
const version = require(__dirname + '/package').version;
const detectObfuscation = require('obfuscation-detector');
const processors = require(__dirname + '/processors');
const {
	utils: {
		runLoop: staticRunLoop,
		normalizeScript,
		logger,
	},
	safe: {
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
		replaceCallExpressionsWithUnwrappedIdentifier,
		replaceEvalCallsWithLiteralContent,
		replaceIdentifierWithFixedAssignedValue,
		replaceIdentifierWithFixedValueNotAssignedAtDeclaration,
		resolveFunctionConstructorCalls,
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
	badValue = '--BAD-VAL--';   // Internal value used to indicate eval failed

	/**
	 * @param {string} script The target script to be deobfuscated
	 * @param {boolean} normalize Run optional methods which will make the script more readable
	 */
	constructor(script, normalize = true) {
		this.script = script;
		this.normalize = normalize;
		this.modified = false;
		this.obfuscationName = 'Generic';
		this._cache = {};            // Generic cache
		this.cyclesCounter = 0;      // Used for logging
		this.totalChangesCounter = 0;
		// Required to avoid infinite loops, but it's good to keep the number high
		// since as long as there's a difference between iteration, something is working
		this.maxCycles = 500;
		this._preprocessors = [];
		this._postprocessors = [];
		this._ast = [];
		this._arborist = null;
	}

	// * * * * * * Determining Obfuscation Type * * * * * * * * //
	/**
	 * Determine the type of the obfuscation, and populate the appropriate pre and post processors.
	 */
	determineObfuscationType() {
		const detectedObfuscationType = detectObfuscation(this.script, false).slice(-1)[0];
		if (detectedObfuscationType) {
			const relevantProcessors = processors[detectedObfuscationType]();
			if (relevantProcessors?.preprocessors?.length) this._preprocessors = relevantProcessors.preprocessors;
			if (relevantProcessors?.postprocessors?.length) this._postprocessors = relevantProcessors.postprocessors;
			this.obfuscationName = detectedObfuscationType;
		}
		logger.log(`[+] Obfuscation type is ${this.obfuscationName}`);
		return this.obfuscationName;
	}

	// * * * * * * Helper Methods * * * * * * * * //

	/**
	 * A wrapper for Arborist's markNode method that verifies replacement isn't a bad value before marking.
	 * @param targetNode The node to replace or remove.
	 * @param replacementNode If exists, replace the target node with this node.
	 */
	_markNode(targetNode, replacementNode) {
		if (replacementNode !== this.badValue) {
			if (this._isInAst(targetNode) && !this._isMarked(targetNode)) {
				this._arborist.markNode(targetNode, replacementNode);
				this._ast = this._arborist.ast;
			}
		}
	}

	/**
	 * @param {ASTNode} targetNode
	 * @returns {boolean} true if the target node or one of its ancestors is marked for either replacement or deletion;
	 *                    false otherwise.
	 */
	_isMarked(targetNode) {
		let n = targetNode;
		while (n) {
			if (n.markedNode) return true;
			n = n.parentNode;
		}
		return false;
	}

	/**
	 * @param {ASTNode} targetNode
	 * @returns {boolean} true if targetNode exists and is unchanged in current AST; false otherwise.
	 */
	_isInAst(targetNode) {
		const targetNodeId = targetNode.nodeId;
		const matches = this._ast.filter(n => n.nodeId === targetNodeId);
		if (matches && matches.length) {
			return matches[0].src === targetNode.src;
		}
		return false;
	}

	/**
	 * Return the source code of the ordered nodes.
	 * @param {ASTNode[]} nodes
	 */
	_createOrderedSrc(nodes) {
		nodes.forEach((n, idx) => {
			if (n.type === 'CallExpression') {
				if (n.parentNode.type === 'ExpressionStatement') nodes[idx] = n.parentNode;
				else if (n.callee.type === 'FunctionExpression') {
					const newNode = generateFlatAST(`(${n.src});`)[1];
					newNode.nodeId = 9999999;   // Exceedingly high nodeId ensures IIFEs are placed last.
					nodes[idx] = newNode;
				}
			}
		});
		const orderedNodes = [...new Set(nodes)].sort(
			(a, b) => a.nodeId > b.nodeId ? 1 : b.nodeId > a.nodeId ? -1 : 0);
		let output = '';
		orderedNodes.forEach(n => {
			const addSemicolon = ['VariableDeclarator', 'AssignmentExpression'].includes(n.type);
			output += (n.type === 'VariableDeclarator' ? `${n.parentNode.kind} ` : '') + n.src + (addSemicolon ? ';' : '') + '\n';
		});
		return output;
	}

	// * * * * * * Getters * * * * * * * * //

	/**
	 * @param {ASTNode} targetNode
	 * @return {ASTNode[]} A flat array of all decendants of the target node
	 */
	_getDescendants(targetNode) {
		const offsprings = [];
		const stack = [targetNode];
		while (stack.length) {
			const currentNode = stack.pop();
			for (const childNode of (currentNode.childNodes || [])) {
				if (!offsprings.includes(childNode)) {
					offsprings.push(childNode);
					stack.push(childNode);
				}
			}
		}
		return offsprings;
	}

	/**
	 *
	 * @param {ASTNode} originNode
	 * @return {ASTNode[]} A flat array of all available declarations and call expressions relevant to
	 * the context of the origin node.
	 */
	_getDeclarationWithContext(originNode) {
		const cacheNameId = `context-${originNode.nodeId}`;
		const cacheNameSrc = `context-${originNode.src}`;
		let cached = this._cache[cacheNameId] || this._cache[cacheNameSrc];
		if (!cached) {
			const collectedContext = [originNode];
			const examineStack = [originNode];
			const collectedContextIds = [];
			const collectedRanges = [];
			while (examineStack.length) {
				const relevantNode = examineStack.pop();
				if (this._isMarked(relevantNode)) continue;
				collectedContextIds.push(relevantNode.nodeId);
				collectedRanges.push(relevantNode.range);
				let relevantScope;
				const assignments = [];
				const references = [];
				switch (relevantNode.type) {
					case 'VariableDeclarator':
						relevantScope = relevantNode.init?.scope || relevantNode.id.scope;
						// Since the variable wasn't initialized, extract value from assignments
						if (!relevantNode.init) {
							assignments.push(...relevantNode.id.references.filter(r =>
								r.parentNode.type === 'AssignmentExpression' &&
								r.parentKey === 'left'));
						} else {
							// Collect references found in init
							references.push(...this._getDescendants(relevantNode.init).filter(n =>
								n.type === 'Identifier' &&
								n.declNode &&
								(n.parentNode.type !== 'MemberExpression' ||
									n.parentKey === 'object'))
								.map(n => n.declNode));
						}
						// Collect assignments to variable properties
						assignments.push(...relevantNode.id.references.filter(r =>
							r.parentNode.type === 'MemberExpression' &&
							((r.parentNode.parentNode.type === 'AssignmentExpression' &&
									r.parentNode.parentKey === 'left') ||
								(r.parentKey === 'object' &&
									propertiesThatModifyContent.includes(r.parentNode.property?.value || r.parentNode.property.name))))
							.map(r => r.parentNode.parentNode));
						// Find augmenting functions
						references.push(...relevantNode.id.references.filter(r =>
							r.parentNode.type === 'CallExpression' &&
							r.parentKey === 'arguments')
							.map(r => r.parentNode));
						break;
					case 'AssignmentExpression':
						relevantScope = relevantNode.right?.scope;
						break;
					case 'CallExpression':
						relevantScope = relevantNode.callee.scope;
						references.push(...relevantNode.arguments.filter(a => a.type === 'Identifier'));
						break;
					case 'MemberExpression':
						relevantScope = relevantNode.object.scope;
						examineStack.push(relevantNode.property);
						break;
					default:
						relevantScope = relevantNode.scope;
				}

				const contextToCollect = relevantScope.through
					.map(ref => ref.identifier?.declNode?.parentNode)
					.filter(ref => !!ref)
					.concat(assignments)
					.concat(references)
					.map(ref => ref.type === 'Identifier' ? ref.parentNode : ref);
				for (const rn of contextToCollect) {
					if (rn && !collectedContextIds.includes(rn.nodeId) && !this._isNodeInRanges(rn, collectedRanges)) {
						collectedRanges.push(rn.range);
						collectedContextIds.push(rn.nodeId);
						collectedContext.push(rn);
						examineStack.push(rn);
						for (const cn of (rn.childNodes || [])) {
							examineStack.push(cn);
						}
					}
				}
			}
			const skipCollectionTypes = [
				'Literal',
				'Identifier',
				'MemberExpression',
			];
			cached = collectedContext.filter(n => !skipCollectionTypes.includes(n.type));
			this._cache[cacheNameId] = cached;        // Caching context for the same node
			this._cache[cacheNameSrc] = cached;       // Caching context for a different node with similar content
		}
		return cached;
	}

	// * * * * * * Booleans * * * * * * * * //

	/**
	 * @param {ASTNode} targetNode
	 * @param {number[][]} ranges
	 * @return {boolean} true if the target node is contained in the provided array of ranges; false otherwise.
	 */
	_isNodeInRanges(targetNode, ranges) {
		const [nodeStart, nodeEnd] = targetNode.range;
		for (const [rangeStart, rangeEnd] of ranges) {
			if (nodeStart >= rangeStart && nodeEnd <= rangeEnd) return true;
		}
		return false;
	}

	// * * * * * * Main * * * * * * * * //

	/**
	 * Run target methods in a loop until they stop affecting the script or the maximum number of cycles is reached.
	 * @param {Function[]} targetMethods
	 * @param {Boolean?} runOnce When true, stop after a single iteration.
	 */
	runLoop(targetMethods, runOnce = false) {
		let scriptSnapshot = '';
		try {
			this._ast = generateFlatAST(this.script);
			while (scriptSnapshot !== this.script && this.cyclesCounter < this.maxCycles) {
				this._arborist = new Arborist(this._ast, debugLog);
				const cycleStartTime = Date.now();
				scriptSnapshot = this.script;
				let lastNumberOfChanges = 0;
				this._cache = {};
				for (const func of targetMethods) {
					const funcStartTime = +new Date();
					try {
						debugLog(`\t[!] Running ${func.name}...`, 1);
						func.bind(this)();
						const numberOfNewChanges = Object.keys(this._arborist.markedForReplacement).length + this._arborist.markedForDeletion.length;
						if (numberOfNewChanges > lastNumberOfChanges) {
							debugLog(`\t[+] ${func.name} committed ${numberOfNewChanges - lastNumberOfChanges} new changes!`);
							lastNumberOfChanges = numberOfNewChanges;
						}
					} catch (e) {
						debugErr(`[-] Error in ${func.name} (iteration #${this.cyclesCounter}): ${e}\n${e.stack}`);
					} finally {
						debugLog(`\t\t[!] Running ${func.name} completed in ` +
							`${((+new Date() - funcStartTime) / 1000).toFixed(3)} seconds`, 1);
					}
				}
				const changesMade = this._arborist.applyChanges() || 0;
				if (changesMade) {
					this._ast = this._arborist.ast;
					this.script = generateCode(this._ast[0]);
					if (this.script !== scriptSnapshot) this.modified = true;
					this.totalChangesCounter += changesMade;
				}
				this.cyclesCounter++;
				debugLog(`[+] ==> Cycle ${this.cyclesCounter} completed in ${(Date.now() - cycleStartTime) / 1000} seconds` +
					` with ${changesMade ? changesMade : 'no'} changes (${this._ast.length} nodes)`);
				if (runOnce) break;
			}
		} catch (e) {
			debugErr(`[-] Error on loop #${this.cyclesCounter}: ${e}\n${e.stack}`);
		}
	}

	/**
	 * @return {Function[]} Deobfuscation methods that don't use eval
	 */
	_safeDeobfuscationMethods() {
		return [
			normalizeEmptyStatements,
			consolidateNestedBlockStatements,
			resolveRedundantLogicalExpressions,
			resolveMemberExpressionReferencesToArrayIndex,
			resolveMemberExpressionsWithDirectAssignment,
			parseTemplateLiteralsIntoStringLiterals,
			resolveDeterministicIfStatements,
			unwrapFunctionShells,
			replaceFunctionShellsWithWrappedValue,
			replaceCallExpressionsWithUnwrappedIdentifier,
			replaceEvalCallsWithLiteralContent,
			replaceIdentifierWithFixedAssignedValue,
			replaceIdentifierWithFixedValueNotAssignedAtDeclaration,
			resolveFunctionConstructorCalls,
			resolveProxyReferences,
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
			resolveLocalCalls,
			resolveBuiltinCalls,
			resolveDeterministicConditionalExpressions,
			resolveInjectedPrototypeMethodCalls,
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
			script = staticRunLoop(this.script, this._safeDeobfuscationMethods());
			if (this.script !== script) {
				this.modified = true;
				this.script = script;
			}
			script = staticRunLoop(this.script, this._unsafeDeobfuscationMethods(), 1);
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
	 * Determine obfuscation type and run the pre and post processors accordingly.
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
		if (clean) this.script = staticRunLoop(this.script, [removeDeadNodes]);
		return this.modified;
	}

	/**
	 * Run specific deobfuscation which must run before or after the main deobfuscation loop
	 * in order to successfully complete deobfuscation.
	 * @param {Array<Function|string>} processors An array of either imported deobfuscation methods or the name of internal methods.
	 */
	_runProcessors(processors) {
		processors.forEach(proc => this.script = staticRunLoop(this.script, [proc], 1));
	}
}

module.exports = REstringer;
if (require.main === module) {
	try {
		const argv = process.argv;
		if (argv.length > 2) {
			const inputFilename = argv[2];
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
				if (logger.isDebugModeOn) fs.writeFileSync(outputFilename, restringer.script, {encoding: 'utf-8'});
				else console.log(restringer.script);
			} else logger.log(`[-] Nothing was deobfuscated  ¯\\_(ツ)_/¯`);
		} else console.log('Usage:\n\trestringer.js obfuscated.js \t\t# Print deobfuscated file to stdout\n\t' +
			'restringer.js obfuscated.js --clean \t# Print deobfuscated file to stdout and remove dead nodes');
	} catch (e) {
		logger.error(`[-] Critical Error: ${e}`);
	}
}