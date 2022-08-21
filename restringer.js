#!/usr/bin/env node
// noinspection JSValidateJSDoc

const fs = require('fs');
const {VM} = require('vm2');
const version = require(__dirname + '/package').version;
const detectObfuscation = require('obfuscation-detector');
const processors = require(__dirname + '/processors/processors');
const {generateFlatAST, parseCode, generateCode, Arborist} = require('flast');
const {debugLog, debugErr, DEBUGMODEON} = require(__dirname + '/helpers/debugHelper');
const {
	badTypes,
	trapStrings,
	disableObjects,
	badIdentifierCharsRegex,
	propertiesThatModifyContent,
} = require(__dirname + '/helpers/config');
const {
	utils: {
		runLoop: staticRunLoop,
		logger,
	},
	safe: {
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
	validIdentifierBeginning = /^[A-Za-z$_]/;

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
		this._evalCache = {};        // Sticky cache for eval results
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
		debugLog(`[+] Obfuscation type is ${this.obfuscationName}`);
		return this.obfuscationName;
	}

	// * * * * * * Helper Methods * * * * * * * * //

	/**
	 * Make the script more readable without actually deobfuscating or affecting its functionality.
	 */
	_normalizeScript() {
		debugLog(`[!] Started script normalization...`, 2);
		const startTime = Date.now();
		this.runLoop([
			this._normalizeComputed,
			this._normalizeRedundantNotOperator,
			this._normalizeEmptyStatements,
		]);
		debugLog(`[!] --> Normalization took ${(Date.now() - startTime) / 1000} seconds`, 2);
	}

	/**
	 * Change all member expressions and class methods which has a property which can support it - to non-computed.
	 * E.g.
	 *   console['log'] -> console.log
	 */
	_normalizeComputed() {
		const candidates = this._ast.filter(n =>
			n.computed &&   // This will keep only member expressions using bracket notation
			// Ignore member expressions with properties which can't be non-computed, like arr[2] or window['!obj']
			// or those having another variable reference as their property like window[varHoldingFuncName]
			(n.type === 'MemberExpression' &&
				n.property.type === 'Literal' &&
				this.validIdentifierBeginning.test(n.property.value) &&
				!badIdentifierCharsRegex.exec(n.property.value)) ||
			/**
			 * Ignore the same cases for method names and object properties, for example
			 * class A {
			 *  ['!hello']() {} // Can't change the name of this method
			 *  ['miao']() {}   // This can be changed to 'miao() {}'
			 *  }
			 *  const obj = {
			 *    ['!hello']: 1,  // Will be ignored
			 *    ['miao']: 4     // Will be changed to 'miao: 4'
			 *  };
			 */
			(['MethodDefinition', 'Property'].includes(n.type) &&
				n.key.type === 'Literal' &&
				this.validIdentifierBeginning.test(n.key.value) &&
				!badIdentifierCharsRegex.exec(n.key.value)));
		for (const c of candidates) {
			const relevantProperty = c.type === 'MemberExpression' ? 'property' : 'key';
			const nonComputed = Object.assign({}, c);
			nonComputed.computed = false;
			nonComputed[relevantProperty] = {
				type: 'Identifier',
				name: c[relevantProperty].value,
			};
			this._markNode(c, nonComputed);
		}
	}

	/**
	 * Remove unrequired empty statements.
	 */
	_normalizeEmptyStatements() {
		const candidates = this._ast.filter(n => n.type === 'EmptyStatement');
		for (const c of candidates) {
			// A for loop is sometimes used to assign variables without providing a loop body, just an empty statement.
			// If we delete that empty statement the syntax breaks
			// e.g. for (var i = 0, b = 8;;); - this is a valid for statement.
			if (!/For.*Statement/.test(c.parentNode.type)) this._markNode(c);
		}
	}

	/**
	 * Replace redundant not operators with actual value (e.g. !true -> false)
	 */
	_normalizeRedundantNotOperator() {
		const relevantNodeTypes = ['Literal', 'ArrayExpression', 'ObjectExpression', 'UnaryExpression'];
		const candidates = this._ast.filter(n =>
			n.type === 'UnaryExpression' &&
			relevantNodeTypes.includes(n.argument.type) &&
			n.operator === '!');
		for (const c of candidates) {
			if (this._canUnaryExpressionBeResolved(c.argument)) {
				const newNode = this._evalInVm(c.src);
				this._markNode(c, newNode);
			}
		}
	}

	/**
	 * Remove nodes code which is only declared but never used.
	 * NOTE: This is a dangerous operation which shouldn't run by default, invokations of the so-called dead code
	 * may be dynamically built during execution. Handle with care.
	 */
	removeDeadNodes() {
		const relevantParents = ['VariableDeclarator', 'AssignmentExpression', 'FunctionDeclaration', 'ClassDeclaration'];
		const candidates = this._ast.filter(n =>
			n.type === 'Identifier' &&
			relevantParents.includes(n.parentNode.type) &&
			(!n?.declNode?.references?.length && !n?.references?.length)).map(n => n.parentNode);
		for (const c of candidates) {
			this._markNode(c);
		}
	}

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

	/**
	 * Create a node from a value by its type.
	 * @returns {ASTNode|string} The created node if successful; badValue string otherwise
	 */
	_createNewNode(value) {
		let newNode = this.badValue;
		try {
			if (![undefined, null].includes(value) && value.__proto__.constructor.name === 'Node') value = generateCode(value);
			switch (this._getType(value)) {
				case 'String':
				case 'Number':
				case 'Boolean':
					if (['-', '+', '!'].includes(String(value)[0]) && String(value).length > 1) {
						newNode = {
							type: 'UnaryExpression',
							operator: String(value)[0],
							argument: this._createNewNode(String(value).substring(1)),
						};
					} else if (['Infinity', 'NaN'].includes(String(value))) {
						newNode = {
							type: 'Identifier',
							name: String(value),
						};
					} else {
						newNode = {
							type: 'Literal',
							value: value,
							raw: String(value),
						};
					}
					break;
				case 'Array': {
					const elements = [];
					for (const el of Array.from(value)) {
						elements.push(this._createNewNode(el));
					}
					newNode = {
						type: 'ArrayExpression',
						elements,
					};
					break;
				}
				case 'Object': {
					const properties = [];
					for (const [k, v] of Object.entries(value)) {
						const key = this._createNewNode(k);
						const val = this._createNewNode(v);
						if ([key, val].includes(this.badValue)) {
							// noinspection ExceptionCaughtLocallyJS
							throw Error();
						}
						properties.push({
							type: 'Property',
							key,
							value: val,
						});
					}
					newNode = {
						type: 'ObjectExpression',
						properties,
					};
					break;
				}
				case 'Undefined':
					newNode = {
						type: 'Identifier',
						name: 'undefined',
					};
					break;
				case 'Null':
					newNode = {
						type: 'Literal',
						raw: 'null',
					};
					break;
				case 'Function': // Covers functions and classes
					try {
						newNode = parseCode(value).body[0];
					} catch {}  // Probably a native function
			}
		} catch (e) {
			debugErr(`[-] Unable to create a new node: ${e}`, 1);
		}
		return newNode;
	}

	// * * * * * * Getters * * * * * * * * //

	/**
	 * Extract and return the type of whatever object is provided
	 * @param {*} unknownObject
	 * @return {string}
	 */
	_getType(unknownObject) {
		const match = ({}).toString.call(unknownObject).match(/\[object (.*)\]/);
		return match ? match[1] : '';
	}

	/**
	 * @param {ASTNode} callExpression
	 * @return {string} The name of the identifier / value of the literal at the base of the call expression.
	 */
	_getCalleeName(callExpression) {
		const callee = callExpression.callee?.object?.object || callExpression.callee?.object || callExpression.callee;
		return callee.name || callee.value;
	}

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
						for (const cn of (rn.chileNodes || [])) {
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

	/**
	 * If this member expression is a part of another member expression - return the first parentNode
	 * which has a declaration in the code.
	 * E.g. a.b[c.d] --> if candidate is c.d, the c identifier will be returned.
	 * a.b.c.d --> if the candidate is c.d, the a identifier will be returned.
	 * @param {ASTNode} memberExpression
	 * @return {ASTNode} The main object object with an available declaration
	 */
	_getMainDeclaredObjectOfMemberExpression(memberExpression) {
		let mainObject = memberExpression;
		while (mainObject && !mainObject.declNode && mainObject.type === 'MemberExpression') mainObject = mainObject.object;
		return mainObject;
	}

	// * * * * * * Booleans * * * * * * * * //

	/**
	 *
	 * @param {ASTNode} binaryExpression
	 * @return {boolean} true if ultimately the binary expression contains only literals; false otherwise
	 */
	_doesBinaryExpressionContainOnlyLiterals(binaryExpression) {
		switch (binaryExpression.type) {
			case 'BinaryExpression':
				return this._doesBinaryExpressionContainOnlyLiterals(binaryExpression.left) &&
					this._doesBinaryExpressionContainOnlyLiterals(binaryExpression.right);
			case 'UnaryExpression':
				return this._doesBinaryExpressionContainOnlyLiterals(binaryExpression.argument);
			case 'Literal':
				return true;
		}
		return false;
	}

	/**
	 * @param argument
	 * @return {boolean} true if unary expression's argument can be resolved (i.e. independent of other identifier); false otherwise.
	 */
	_canUnaryExpressionBeResolved(argument) {
		switch (argument.type) {                    // Examples for each type of argument which can be resolved:
			case 'ArrayExpression':
				return !argument.elements.length;       // ![]
			case 'ObjectExpression':
				return !argument.properties.length;     // !{}
			case 'Identifier':
				return argument.name === 'undefined';   // !undefined
			case 'TemplateLiteral':
				return !argument.expressions.length;    // !`template literals with no expressions`
			case 'UnaryExpression':
				return this._canUnaryExpressionBeResolved(argument.argument);
		}
		return true;
	}

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

	/**
	 * @param {ASTNode} targetNode
	 * @param {number[][]} ranges
	 * @return {boolean} true if any of the ranges provided is contained by the target node; false otherwise.
	 */
	_doesNodeContainRanges(targetNode, ranges) {
		const [nodeStart, nodeEnd] = targetNode.range;
		for (const [rangeStart, rangeEnd] of ranges) {
			if (nodeStart <= rangeStart && nodeEnd >= rangeEnd) return true;
		}
		return false;
	}

	/**
	 * @param {ASTNode[]} refs
	 * @return {boolean} true if any of the references might modify the original value; false otherwise.
	 */
	_areReferencesModified(refs) {
		// Verify no reference is on the left side of an assignment
		return Boolean(refs.filter(r => r.parentNode.type === 'AssignmentExpression' && r.parentKey === 'left').length ||
			// Verify no reference is part of an update expression
			refs.filter(r => r.parentNode.type === 'UpdateExpression').length ||
			// Verify no variable with the same name is declared in a subscope
			refs.filter(r => r.parentNode.type === 'VariableDeclarator' && r.parentKey === 'id').length ||
			// Verify there are no member expressions among the references which are being assigned to
			refs.filter(r => r.type === 'MemberExpression' &&
				(this._ast.filter(n => n.type === 'AssignmentExpression' && n.left.src === r.src &&
					([r.object.declNode?.nodeId, r.object?.nodeId].includes(n.left.object.declNode?.nodeId)))).length).length ||
			// Verify no modifying calls are executed on any of the references
			refs.filter(r => r.parentNode.type === 'MemberExpression' &&
				r.parentNode.parentNode.type === 'CallExpression' &&
				r.parentNode.parentNode.callee?.object?.nodeId === r.nodeId &&
				propertiesThatModifyContent.includes(r.parentNode.property?.value || r.parentNode.property?.name)).length);
	}

	// * * * * * * Evals * * * * * * * * //

	/**
	 * Eval a string in a ~safe~ VM environment
	 * @param {string} stringToEval
	 * @return {string|ASTNode} A node based on the eval result if successful; badValue string otherwise.
	 */
	_evalInVm(stringToEval) {
		const vmOptions = {
			timeout: 5 * 1000,
			sandbox: {...disableObjects},
		};
		const cacheName = `eval-${stringToEval}`;
		if (this._evalCache[cacheName] === undefined) {
			this._evalCache[cacheName] = this.badValue;
			try {
				// Break known trap strings
				for (const ts of trapStrings) {
					stringToEval = stringToEval.replace(ts.trap, ts.replaceWith);
				}
				const res = (new VM(vmOptions)).run(stringToEval);
				if (!res.VMError && !badTypes.includes(this._getType(res))) {
					// To exclude results based on randomness or timing, eval again and compare results
					const res2 = (new VM(vmOptions)).run(stringToEval);
					if (JSON.stringify(res) === JSON.stringify(res2)) {
						this._evalCache[cacheName] = this._createNewNode(res);
					}
				}
			} catch (e) {
				debugErr(`[-] Error in _evalInVm: ${e}`, 1);
			}
		}
		return this._evalCache[cacheName];
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
			script = staticRunLoop(this.script, this._safeDeobfuscationMethods(), undefined, logger);
			if (this.script !== script) {
				this.modified = true;
				this.script = script;
			}
			script = staticRunLoop(this.script, this._unsafeDeobfuscationMethods(), 1, logger);
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
		if (this.normalize) this._normalizeScript();
		if (clean) this.runLoop([this.removeDeadNodes]);
		return this.modified;
	}

	/**
	 * Run specific deobfuscation which must run before or after the main deobfuscation loop
	 * in order to successfully complete deobfuscation.
	 * @param {Array<Function|string>} processors An array of either imported deobfuscation methods or the name of internal methods.
	 */
	_runProcessors(processors) {
		const procs = [];
		processors.forEach(proc => {
			// Correctly bind references from the processors to REstringer methods.
			procs.push(typeof proc === 'string' ? this[proc] : () => proc.bind(this)(this.script, this));
		});
		this.runLoop(procs, true);
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
			debugLog(`[!] Attempting to deobfuscate ${inputFilename} (length: ${originalInputLength})\n`);

			const restringer = new REstringer(content);
			restringer.deobfuscate(argv[3] === '--clean');
			const outputFilename = `${inputFilename}-${restringer.obfuscationName}-deob.js`;
			if (restringer.modified) {
				debugLog(`[+] Output saved to ${outputFilename}\n\tLength: ${restringer.script.length} ` +
					`(difference is ${restringer.script.length - content.length})\n\tChanges: ${restringer.totalChangesCounter}`);
				debugLog(`[!] Deobfuscation took ${(Date.now() - startTime) / 1000} seconds`);
				if (DEBUGMODEON) fs.writeFileSync(outputFilename, restringer.script, {encoding: 'utf-8'});
				else console.log(restringer.script);
			} else debugLog(`[-] Nothing was deobfuscated  ¯\\_(ツ)_/¯`);
		} else console.log('Usage:\n\trestringer.js obfuscated.js \t\t# Print deobfuscated file to stdout\n\t' +
			'restringer.js obfuscated.js --clean \t# Print deobfuscated file to stdout and remove dead nodes');
	} catch (e) {
		debugErr(`[-] Critical Error: ${e}`);
	}
}