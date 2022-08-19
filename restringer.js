#!/usr/bin/env node
// noinspection JSValidateJSDoc,JSUnresolvedVariable,JSValidateTypes,HtmlRequiredLangAttribute,HtmlRequiredTitleElement,JSAnnotator

const fs = require('fs');
const version = require(__dirname + '/package').version;
const detectObfuscation = require('obfuscation-detector');
const processors = require(__dirname + '/processors/processors');
const {generateFlatAST, parseCode, generateCode, Arborist} = require('flast');
const safeImplementations = require(__dirname + '/helpers/safeImplementations');
const {debugLog, debugErr, DEBUGMODEON} = require(__dirname + '/helpers/debugHelper');
const {
	unsafe: {
		evalInVm,
	},
	utils: {
		createNewNode,
	},
} = require('./modules');
const {
	skipProperties,
	skipIdentifiers,
	badArgumentTypes,
	skipBuiltinFunctions,
	badIdentifierCharsRegex,
	propertiesThatModifyContent,
} = require(__dirname + '/helpers/config');

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
		this.obfuscationName = 'Gener_ic';
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
	 * Determine the type of the obfuscation, and populate the appropriate pre- and post- processors.
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
				const newNode = evalInVm(c.src, {debugErr});
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

	// * * * * * * Getters * * * * * * * * //

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
							// Collect all references found in init
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
	 * a.b.c.d --> if the candidate is c.d, the 'a' identifier will be returned.
	 * @param {ASTNode} memberExpression
	 * @return {ASTNode} The main object with an available declaration
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

	// * * * * * * Main Deobfuscation Methods * * * * * * * * //

	/**
	 * Replace definite member expressions with their intended value.
	 * E.g.
	 * '123'[0]; ==> '1';
	 * 'hello'.length ==> 5;
	 */
	_resolveDefiniteMemberExpressions() {
		const candidates = this._ast.filter(n =>
			n.type === 'MemberExpression' &&
			n.property.type === 'Literal' &&
			['ArrayExpression', 'Literal'].includes(n.object.type) &&
			(n.object?.value?.length || n.object?.elements?.length));
		for (const c of candidates) {
			const newValue = evalInVm(c.src, {debugErr});
			this._markNode(c, newValue);
		}
	}

	/**
	 * Resolve member expressions to the value they stand for, if they're defined in the script.
	 * E.g.
	 * const a = [1, 2, 3];
	 * const b = a[2]; // <-- will be resolved to 3
	 * const c = 0;
	 * const d = a[c]; // <-- will be resolved to 1
	 * ---
	 * const a = {hello: 'world'};
	 * const b = a['hello']; // <-- will be resolved to 'world'
	 */
	_resolveMemberExpressionsLocalReferences() {
		const candidates = this._ast.filter(n =>
			n.type === 'MemberExpression' &&
			['Identifier', 'Literal'].includes(n.property.type) &&
			!skipProperties.includes(n.property?.name || n.property?.value));
		for (const c of candidates) {
			// If this member expression is the callee of a call expression - skip it
			if (c.parentNode.type === 'CallExpression' && c.parentKey === 'callee') continue;
			// If this member expression is a part of another member expression - get the first parentNode
			// which has a declaration in the code;
			// E.g. a.b[c.d] --> if candidate is c.d, the c identifier will be selected;
			// a.b.c.d --> if the candidate is c.d, the 'a' identifier will be selected;
			let relevantIdentifier = this._getMainDeclaredObjectOfMemberExpression(c);
			if (relevantIdentifier && relevantIdentifier.declNode) {
				// Skip if the relevant identifier is on the left side of an assignment.
				if (relevantIdentifier.parentNode.parentNode.type === 'AssignmentExpression' &&
					relevantIdentifier.parentNode.parentKey === 'left') continue;
				const declNode = relevantIdentifier.declNode;
				// Skip if the identifier was declared as a function's parameter.
				if (/Function/.test(declNode.parentNode.type) &&
					(declNode.parentNode.params || []).filter(p => p.nodeId === declNode.nodeId).length) continue;
				const context = this._createOrderedSrc(this._getDeclarationWithContext(relevantIdentifier.declNode.parentNode));
				if (context) {
					const src = `${context}\n${c.src}`;
					const newNode = evalInVm(src, {debugErr});
					if (newNode !== this.badValue) {
						let isEmptyReplacement = false;
						switch (newNode.type) {
							case 'ArrayExpression':
								if (!newNode.elements.length) isEmptyReplacement = true;
								break;
							case 'ObjectExpression':
								if (!newNode.properties.length) isEmptyReplacement = true;
								break;
							case 'Literal':
								if (!String(newNode.value).length) isEmptyReplacement = true;
								break;
						}
						if (!isEmptyReplacement) {
							this._markNode(c, newNode);
						}
					}
				}

			}
		}
	}

	// noinspection GrazieInspection
	/**
	 * Resolve the value of member expressions to objects which hold literals that were directly assigned to the expression.
	 * E.g.
	 * function a() {}
	 * a.b = 3;
	 * a.c = '5';
	 * console.log(a.b + a.c);  // a.b + a.c will be replaced with '35'
	 */
	_resolveMemberExpressionsWithDirectAssignment() {
		const candidates = this._ast.filter(n =>
			n.type === 'MemberExpression' &&
			n.object.declNode &&
			n.parentNode.type === 'AssignmentExpression' &&
			n.parentNode.right.type === 'Literal');
		for (const c of candidates) {
			const prop = c.property?.value || c.property?.name;
			const valueUses = c.object.declNode.references.filter(n =>
				n.parentNode.type === 'MemberExpression' &&
				(n.parentNode.property.computed ?
					n.parentNode.property?.value === prop :
					n.parentNode.property?.name === prop) &&
				n.parentNode.nodeId !== c.nodeId)
				.map(n => n.parentNode);
			if (valueUses.length) {
				// Skip if the value is reassigned
				if (valueUses.filter(n => n.parentNode.type === 'AssignmentExpression' && n.parentKey === 'left').length) continue;
				const replacementNode = c.parentNode.right;
				valueUses.forEach(n => this._markNode(n, replacementNode));
			}
		}
	}

	/**
	 * Resolve call expressions which are defined on an object's prototype and are applied to an object's instance.
	 * E.g.
	 * String.prototype.secret = function() {return 'secret ' + this}
	 * 'hello'.secret(); // <-- will be resolved to 'secret hello'
	 */
	_resolveInjectedPrototypeMethodCalls() {
		const candidates = this._ast.filter(n =>
			n.type === 'AssignmentExpression' &&
			n.left.type === 'MemberExpression' &&
			[n.left.object.property?.name, n.left.object.property?.value].includes('prototype') &&
			n.operator === '=' &&
			(/FunctionExpression/.test(n.right?.type) || n.right?.type === 'Identifier'));
		for (const c of candidates) {
			const methodName = c.left.property?.name || c.left.property?.value;
			const context = this._getDeclarationWithContext(c);
			const references = this._ast.filter(n =>
				n.type === 'CallExpression' &&
				n.callee.type === 'MemberExpression' &&
				[n.callee.property?.name, n.callee.property?.value].includes(methodName));
			for (const ref of references) {
				const refContext = [
					...new Set([
						...this._getDeclarationWithContext(ref.callee),
						...this._getDeclarationWithContext(ref.callee?.object),
						...this._getDeclarationWithContext(ref.callee?.property),
					]),
				];
				const src = `${this._createOrderedSrc([...context, ...refContext])}\n${ref.src}`;
				const newNode = evalInVm(src, {debugErr});
				this._markNode(ref, newNode);
			}
		}
	}

	/**
	 * Resolve member expressions to their targeted index in an array.
	 * E.g.
	 * const a = [1, 2, 3];  b = a[0]; c = a[2];
	 * ==>
	 * const a = [1, 2, 3]; b = 1; c = 3;
	 */
	_resolveMemberExpressionReferencesToArrayIndex() {
		const minArrayLength = 20;
		const candidates = this._ast.filter(n =>
			n.type === 'VariableDeclarator' &&
			n.init?.type === 'ArrayExpression' &&
			n.id?.references &&
			n.init.elements.length > minArrayLength);
		for (const c of candidates) {
			const refs = c.id.references.map(n => n.parentNode);
			if (!refs.filter(n =>
				(n.property && n.property?.type !== 'Literal') ||
				Object.is(parseInt(n.property), NaN).length).length) {
				for (const ref of refs) {
					if ((ref.parentNode.type === 'AssignmentExpression' &&
							ref.parentKey === 'left') ||
						ref.type !== 'MemberExpression') continue;
					try {
						this._markNode(ref, c.init.elements[parseInt(ref.property.value)]);
					} catch (e) {
						debugErr(`[-] Unable to mark node for replacement: ${e}`, 1);
					}
				}
			}

		}
	}

	/**
	 * Resolve definite binary expressions.
	 * E.g.
	 * 5 * 3 ==> 15;
	 * '2' + 2 ==> '22';
	 */
	_resolveDefiniteBinaryExpressions() {
		const candidates = this._ast.filter(n =>
			n.type === 'BinaryExpression' &&
			this._doesBinaryExpressionContainOnlyLiterals(n));
		for (const c of candidates) {
			const newNode = evalInVm(c.src, {debugErr});
			this._markNode(c, newNode);
		}
	}

	/**
	 * E.g.
	 * `hello ${'world'}!`; // <-- will be parsed into 'hello world!'
	 */
	_parseTemplateLiteralsIntoStringLiterals() {
		const candidates = this._ast.filter(n =>
			n.type === 'TemplateLiteral' &&
			!n.expressions.filter(exp => exp.type !== 'Literal').length);
		for (const c of candidates) {
			let newStringLiteral = '';
			for (let i = 0; i < c.expressions.length; i++) {
				newStringLiteral += c.quasis[i].value.raw + c.expressions[i].value;
			}
			newStringLiteral += c.quasis.slice(-1)[0].value.raw;
			this._markNode(c, createNewNode(newStringLiteral, {debugErr}));
		}
	}

	/**
	 * Resolve unary expressions on values which aren't numbers such as +true, -false, +[], +[...], etc,
	 * as well as binary expressions around the + operator. These usually resolve to string values,
	 * which can be used to obfuscate code in schemes such as JSFuck
	 */
	_resolveMinimalAlphabet() {
		const candidates = this._ast.filter(n =>
			(n.type === 'UnaryExpression' &&
				((n.argument.type === 'Literal' && /^\D/.exec(n.argument.raw[0])) ||
					n.argument.type === 'ArrayExpression')) ||
			(n.type === 'BinaryExpression' &&
				n.operator === '+' &&
				(n.left.type !== 'MemberExpression' && Number.isNaN(parseFloat(n.left?.value))) &&
				![n.left?.type, n.right?.type].includes('ThisExpression')));
		for (const c of candidates) {
			const newNode = evalInVm(c.src, {debugErr});
			if (newNode !== this.badValue) {
				this._markNode(c, newNode);
			}
		}
	}

	/**
	 * Remove redundant block statements which have another block statement as their body.
	 * E.g.
	 * if (a) {{do_a();}} ===> if (a) {do_a();}
	 */
	_removeNestedBlockStatements() {
		const candidates = this._ast.filter(n =>
			n.type === 'BlockStatement' &&
			n.parentNode.type === 'BlockStatement');
		for (const c of candidates) {
			this._markNode(c.parentNode, c);
		}
	}

	/**
	 * Remove redundant logical expressions which will always resolve in the same way.
	 * E.g.
	 * if (false && ...) do_a(); else do_b(); ==> do_b();
	 * if (... || true) do_c(); else do_d(); ==> do_c();
	 */
	_removeRedundantLogicalExpressions() {
		const candidates = this._ast.filter(n =>
			n.type === 'IfStatement' &&
			n.test.type === 'LogicalExpression');
		for (const c of candidates) {
			if (c.test.operator === '&&') {
				if (c.test.left.type === 'Literal') {
					if (c.test.left.value) {
						this._markNode(c.test, c.test.right);
					} else {
						this._markNode(c.test, c.test.left);
					}
				} else if (c.test.right.type === 'Literal') {
					if (c.test.right.value) {
						this._markNode(c.test, c.test.left);
					} else {
						this._markNode(c.test, c.test.right);
					}
				}
			} else if (c.test.operator === '||') {
				if (c.test.left.type === 'Literal') {
					if (c.test.left.value) {
						this._markNode(c.test, c.test.left);
					} else {
						this._markNode(c.test, c.test.right);
					}
				} else if (c.test.right.type === 'Literal') {
					if (c.test.right.value) {
						this._markNode(c.test, c.test.right);
					} else {
						this._markNode(c.test, c.test.left);
					}
				}
			}
		}
	}

	/**
	 * Replace if statements which will always resolve the same way with their relevant consequent or alternative.
	 * E.g.
	 * if (true) do_a(); else do_b(); if (false) do_c(); else do_d();
	 * ==>
	 * do_a(); do_d();
	 */
	_resolveDeterministicIfStatements() {
		const candidates = this._ast.filter(n =>
			n.type === 'IfStatement' &&
			n.test.type === 'Literal');
		for (const c of candidates) {
			if (c.test.value) {
				if (c.consequent) this._markNode(c, c.consequent);
				else this._markNode(c);
			} else {
				if (c.alternate) this._markNode(c, c.alternate);
				else this._markNode(c);
			}
		}
	}

	/**
	 * Replace variables which only point at other variables and do not change, with their target.
	 * E.g.
	 * const a = [...];
	 * const b = a;
	 * const c = b[0];  // <-- will be replaced with `const c = a[0];`
	 */
	_replaceReferencedProxy() {
		const candidates = this._ast.filter(n =>
			(n.type === 'VariableDeclarator' &&
				['Identifier', 'MemberExpression'].includes(n.id.type) &&
				['Identifier', 'MemberExpression'].includes(n.init?.type)) &&
			!/For.*Statement/.test(n.parentNode.parentNode.type));
		for (const c of candidates) {
			const relevantIdentifier = this._getMainDeclaredObjectOfMemberExpression(c.id)?.declNode || c.id;
			const refs = relevantIdentifier.references || [];
			const replacementNode = c.init;
			const replacementMainIdentifier = this._getMainDeclaredObjectOfMemberExpression(c.init)?.declNode;
			if (replacementMainIdentifier && replacementMainIdentifier.nodeId === relevantIdentifier.nodeId) continue;
			// Exclude changes in the identifier's own init
			if (this._getDescendants(c.init).find(n => n.declNode?.nodeId === relevantIdentifier.nodeId)) continue;
			if (refs.length && !this._areReferencesModified(refs) && !this._areReferencesModified([replacementNode])) {
				for (const ref of refs) {
					this._markNode(ref, replacementNode);
				}
			}
		}
	}

	/**
	 * Resolve calls to builtin functions (like atob or String(), etc...).
	 * Use safe implmentations of known functions when available.
	 */
	_resolveBuiltinCalls() {
		const availableSafeImplementations = Object.keys(safeImplementations);
		const callsWithOnlyLiteralArugments = this._ast.filter(n =>
			n.type === 'CallExpression' &&
			!n.arguments.filter(a => a.type !== 'Literal').length);
		const candidates = callsWithOnlyLiteralArugments.filter(n =>
			n.callee.type === 'Identifier' &&
			!n.callee.declNode &&
			!skipBuiltinFunctions.includes(n.callee.name));
		candidates.push(...callsWithOnlyLiteralArugments.filter(n =>
			n.callee.type === 'MemberExpression' &&
			!n.callee.object.declNode &&
			!skipIdentifiers.includes(n.callee.object?.name) &&
			!skipProperties.includes(n.callee.property?.name || n.callee.property?.value)));
		candidates.push(...this._ast.filter(n =>
			n.type === 'CallExpression' &&
			availableSafeImplementations.includes((n.callee.name))));
		for (const c of candidates) {
			try {
				const callee = c.callee;
				const safeImplementation = safeImplementations[callee.name];
				if (safeImplementation) {
					const args = c.arguments.map(a => a.value);
					const tempValue = safeImplementation(...args);
					if (tempValue) {
						this._markNode(c, createNewNode(tempValue, {debugErr}));
					}
				} else {
					const newNode = evalInVm(c.src, {debugErr});
					this._markNode(c, newNode);
				}
			} catch {}
		}
	}

	/**
	 * Evaluate resolvable (independent) conditional expressions and replace them with their unchanged resolution.
	 * E.g.
	 * 'a' ? do_a() : do_b(); // <-- will be replaced with just do_a():
	 */
	_resolveDeterministicConditionalExpressions() {
		const candidates = this._ast.filter(n =>
			n.type === 'ConditionalExpression' &&
			n.test.type === 'Literal');
		for (const c of candidates) {
			const newNode = evalInVm(`!!(${c.test.src}, {debugErr});`);
			if (newNode.type === 'Literal') {
				this._markNode(c, newNode.value ? c.consequent : c.alternate);
			}
		}
	}

	/**
	 * Calls to functions which only return an identifier will be replaced with the identifier itself.
	 * E.g.
	 * function a() {return String}
	 * a()(val) // <-- will be replaced with String(val)
	 */
	_replaceCallExpressionsWithUnwrappedIdentifier() {
		const candidates = this._ast.filter(n =>
			n.type === 'CallExpression' &&
			n.callee?.declNode &&
			((n.callee.declNode.parentNode.type === 'VariableDeclarator' &&
					['ArrowFunctionExpression', 'FunctionExpression'].includes(n.callee.declNode.parentNode?.init?.type)) ||
				(n.callee.declNode.parentNode.type === 'FunctionDeclaration' &&
					n.callee.declNode.parentKey === 'id')));
		for (const c of candidates) {
			const declBody = c.callee.declNode.parentNode?.init?.body || c.callee.declNode.parentNode?.body;
			if (!Array.isArray(declBody)) {
				// Cases where an arrow function has no block statement
				if (declBody.type === 'Identifier' || (declBody.type === 'CallExpression' && !declBody.arguments.length)) {
					for (const ref of c.callee.declNode.references) {
						this._markNode(ref.parentNode, declBody);
					}
				}
			} else if (declBody.length === 1) {
				// TODO: complete
				//       Cases where there's only a single return statement in the block statement
			}
		}
	}

	/**
	 * Collect all available context on call expressions where the callee is defined in the script and attempt
	 * to resolve their value.
	 */
	_resolveLocalCalls() {
		const candidates = this._ast.filter(n =>
			n.type === 'CallExpression' &&
			(n.callee?.declNode ||
				(n.callee?.object?.declNode &&
					!skipProperties.includes(n.callee.property?.value || n.callee.property?.name)) ||
				n.callee?.object?.type === 'Literal'));

		const frequency = {};
		candidates.map(c => this._getCalleeName(c)).forEach(name => {
			if (!frequency[name]) frequency[name] = 0;
			frequency[name]++;
		});
		const sortByFrequency = (a, b) => {
			a = this._getCalleeName(a);
			b = this._getCalleeName(b);
			return frequency[a] < frequency[b] ? 1 : frequency[b] < frequency[a] ? -1 : 0;
		};

		const modifiedRanges = [];
		for (const c of candidates.sort(sortByFrequency)) {
			if (c.arguments.filter(a => badArgumentTypes.includes(a.type)).length) continue;
			if (this._doesNodeContainRanges(c, modifiedRanges)) continue;
			const callee = c.callee?.object || c.callee;
			const declNode = c.callee?.declNode || c.callee?.object?.declNode;
			const cacheName = `rlc-${callee.name || callee.value}-${declNode?.nodeId}`;
			if (!this._cache[cacheName]) {
				// Skip call expressions with problematic values
				if (skipIdentifiers.includes(callee.name) ||
					(callee.type === 'ArrayExpression' && !callee.elements.length) ||
					!!(callee.arguments || []).filter(a => skipIdentifiers.includes(a) || a?.type === 'ThisExpression').length) continue;
				if (declNode) {
					// Verify the declNode isn't a simple wrapper for an identifier
					if (declNode.parentNode.type === 'FunctionDeclaration' &&
						declNode.parentNode?.body?.body?.length &&
						['Identifier', 'Literal'].includes(declNode.parentNode.body.body[0]?.argument?.type)) continue;
					this._cache[cacheName] = this._createOrderedSrc(this._getDeclarationWithContext(declNode.parentNode));
				}
			}
			const context = this._cache[cacheName];
			const src = context ? `${context}\n${c.src}` : c.src;
			const newNode = evalInVm(src, {debugErr});
			if (newNode !== this.badValue && newNode.type !== 'FunctionDeclaration') {
				this._markNode(c, newNode);
				modifiedRanges.push(c.range);
			}
		}
	}

	/**
	 * Extract string values of eval call expressions, and replace calls with the actual code, without running it through eval.
	 * E.g.
	 * eval('console.log("hello world")'); // <-- will be replaced with console.log("hello world");
	 */
	_replaceEvalCallsWithLiteralContent() {
		const candidates = this._ast.filter(n =>
			n.type === 'CallExpression' &&
			n.callee?.name === 'eval' &&
			n.arguments[0]?.type === 'Literal');
		for (const c of candidates) {
			const cacheName = `replaceEval-${c.src}}`;
			try {
				if (!this._cache[cacheName]) {
					let body;
					if (c.arguments[0].value) {
						body = generateFlatAST(c.arguments[0].value, {detailed: false})[1];
					} else body = {
						type: 'Literal',
						value: c.arguments[0].value,
					};
					this._cache[cacheName] = body;
				}
				let replacementNode = this._cache[cacheName];
				let targetNode = c;
				// Edge case where the eval call renders an identifier which is then used in a call expression:
				// eval('Function')('alert("hacked!")');
				if (c.parentKey === 'callee') {
					targetNode = c.parentNode;
					if (replacementNode.type === 'ExpressionStatement' && replacementNode.expression.type === 'Identifier') {
						replacementNode = replacementNode.expression;
					}
					replacementNode = {...c.parentNode, callee: replacementNode};
				}
				this._markNode(targetNode, replacementNode);
			} catch (e) {
				debugErr(`[-] Unable to replace eval's body with call expression: ${e}`, 1);
			}
		}
	}

	/**
	 * Resolve eval call expressions where the argument isn't a literal.
	 * E.g.
	 * eval(function() {return 'value'})() // <-- will be resolved into 'value'
	 */
	_resolveEvalCallsOnNonLiterals() {
		const candidates = this._ast.filter(n =>
			n.type === 'CallExpression' &&
			n.callee.name === 'eval' &&
			n.arguments.length === 1 &&
			n.arguments[0].type !== 'Literal');
		for (const c of candidates) {
			const argument = c.arguments[0];
			const src = `var __a_ = ${argument.src}\n;__a_`;
			const newNode = evalInVm(src, {debugErr});
			const targetNode = c.parentNode.type === 'ExpressionStatement' ? c.parentNode : c;
			let replacementNode = newNode;
			try {
				if (newNode.type === 'Literal') {
					try {
						replacementNode = parseCode(newNode.value);
					} catch {
						// Edge case for broken scripts that can be solved
						// by adding a newline after closing brackets except if part of a regexp
						replacementNode = parseCode(newNode.value.replace(/([)}])(?!\/)/g, '$1\n'));
					}
				}
			} catch {}
			this._markNode(targetNode, replacementNode);
		}
	}

	/**
	 * Typical for packers, function constructor calls where the last argument
	 * is a code snippet, should be replaced with the code nodes.
	 */
	_resolveFunctionConstructorCalls() {
		const candidates = this._ast.filter(n =>
			n.type === 'CallExpression' &&
			n.callee?.type === 'MemberExpression' &&
			[n.callee.property?.name, n.callee.property?.value].includes('constructor') &&
			n.arguments.length && n.arguments.slice(-1)[0].type === 'Literal');
		for (const c of candidates) {
			if (!['VariableDeclarator', 'AssignmentExpression'].includes(c.parentNode.type)) continue;
			let args = '';
			if (c.arguments.length > 1) {
				const originalArgs = c.arguments.slice(0, -1);
				if (originalArgs.filter(n => n.type !== 'Literal').length) continue;
				args = originalArgs.map(n => n.value).join(', ');
			}
			// Wrap the code in a valid anonymous function in the same way Function.constructor would.
			// Give the anonymous function any arguments it may require.
			// Wrap the function in an expression to make it a valid code (since it's anonymous).
			// Generate an AST without nodeIds (to avoid duplicates with the rest of the code).
			// Extract just the function expression from the AST.
			const codeNode = generateFlatAST(`(function (${args}) {${c.arguments.slice(-1)[0].value}})`, {detailed: false})[2];
			this._markNode(c, codeNode);
		}
	}

	/**
	 * When an identifier holds a static literal value, replace all references to it with the value.
	 */
	_replaceIdentifierWithFixedAssignedValue() {
		const candidates = this._ast.filter(n =>
			n?.declNode?.parentNode?.init?.type === 'Literal' &&
			!(n.parentKey === 'property' && n.parentNode.type === 'ObjectExpression'));
		for (const c of candidates) {
			const valueNode = c.declNode.parentNode.init;
			const refs = c.declNode.references;
			if (!this._areReferencesModified(refs)) {
				for (const ref of refs) {
					this._markNode(ref, valueNode);
				}
			}
		}
	}

	/**
	 * When an identifier holds a static value which is assigned after declaration but doesn't change afterwards,
	 * replace all references to it with the value.
	 */
	_replaceIdentifierWithFixedValueNotAssignedAtDeclaration() {
		const candidates = this._ast.filter(n =>
			n.parentNode?.type === 'VariableDeclarator' &&
			!n.parentNode.init &&
			n?.references?.length &&
			n.references.filter(r =>
				r.parentNode.type === 'AssignmentExpression' &&
				this._getMainDeclaredObjectOfMemberExpression(r.parentNode.left).nodeId === r.nodeId).length === 1 &&
			!n.references.filter(r =>
				(/For.*Statement/.exec(r.parentNode.type) &&
					r.parentKey === 'left') ||
				// This covers cases like:
				// let a; b === c ? (b++, a = 1) : a = 2
				[
					r.parentNode.parentNode.type,
					r.parentNode.parentNode?.parentNode?.type,
					r.parentNode.parentNode?.parentNode?.parentNode?.type,
				].includes('ConditionalExpression')).length);
		for (const c of candidates) {
			const assignmentNode = c.references.filter(r =>
				r.parentNode.type === 'AssignmentExpression' &&
				this._getMainDeclaredObjectOfMemberExpression(r.parentNode.left).nodeId === r.nodeId)[0];
			const valueNode = assignmentNode.parentNode.right;
			if (valueNode.type !== 'Literal') continue;
			const refs = c.references.filter(r => r.nodeId !== assignmentNode.nodeId);
			if (!this._areReferencesModified(refs)) {
				for (const ref of refs) {
					if (ref.parentNode.type === 'CallExpression' && ref.parentKey === 'callee') continue;
					this._markNode(ref, valueNode);
				}
			}
		}
	}

	/**
	 * Remove functions which only return another function.
	 * If params or id on the outer scope are used in the inner function - replace them on the inner function.
	 * E.g.
	 * function a(x) {
	 *   return function() {return x + 3}
	 * }
	 * // will be replaced with
	 * function a(x) {return x + 3}
	 */
	_unwrapFunctionShells() {
		const candidates = this._ast.filter(n =>
			['FunctionDeclaration', 'FunctionExpression'].includes(n.type) &&
			n.body?.body?.length === 1 &&
			n.body.body[0].type === 'ReturnStatement' &&
			[
				n.body.body[0].argument?.callee?.property?.name,
				n.body.body[0].argument?.callee?.property?.value,
			].includes('apply') &&
			n.body.body[0].argument.arguments?.length === 2 &&
			n.body.body[0].argument.callee.object.type === 'FunctionExpression');
		for (const c of candidates) {
			const replacementNode = c.body.body[0].argument.callee.object;
			if (c.id && !replacementNode.id) replacementNode.id = c.id;
			if (c.params.length && !replacementNode.params.length) replacementNode.params.push(...c.params);
			this._markNode(c, replacementNode);
		}
	}

	/**
	 * Functions which only return a single literal or identifier will have their references replaced with the actual return value.
	 */
	_replaceFunctionShellsWithWrappedValue() {
		const candidates = this._ast.filter(n =>
			n.type === 'FunctionDeclaration' &&
			n.body?.body?.length === 1 &&
			n.body.body[0].type === 'ReturnStatement' &&
			['Literal', 'Identifier'].includes(n.body.body[0].argument?.type));
		for (const c of candidates) {
			const replacementNode = c.body.body[0].argument;
			for (const ref of (c.id?.references || [])) {
				this._markNode(ref.parentNode, replacementNode);
			}
		}
	}

	/**
	 * A special case of function array replacement where the function is wrapped in another function, the array is
	 * sometimes wrapped in its own function, and is also augmented.
	 * TODO: Add example code
	 */
	_resolveAugmentedFunctionWrappedArrayReplacements() {
		const candidates = this._ast.filter(n =>
			n.type === 'FunctionDeclaration' && n.id);
		for (const c of candidates) {
			const descendants = this._getDescendants(c);
			if (descendants.filter(d =>
				d.type === 'AssignmentExpression' &&
				d.left?.name === c.id?.name).length) {
				const arrDecryptor = c;
				const arrCandidates = descendants.filter(n =>
					n.type === 'MemberExpression' && n.object.type === 'Identifier')
					.map(n => n.object);
				for (const ac of arrCandidates) {
					// If a direct reference to a global variable pointing at an array
					let arrRef;
					if (!ac.declNode) continue;
					if (ac.declNode.scope.type === 'global') {
						if (ac.declNode.parentNode?.init?.type === 'ArrayExpression') {
							arrRef = ac.declNode.parentNode?.parentNode || ac.declNode.parentNode;
						}
					} else if (ac.declNode.parentNode?.init?.type === 'CallExpression') {
						arrRef = ac.declNode.parentNode.init.callee.declNode.parentNode;
					}
					if (arrRef) {
						const arrRefId = ac.declNode.nodeId;
						const iifes = this._ast.filter(n =>
							n.type === 'ExpressionStatement' &&
							n.expression.type === 'CallExpression' &&
							n.expression.callee.type === 'FunctionExpression' &&
							n.expression.arguments.length &&
							n.expression.arguments[0].type === 'Identifier' &&
							n.expression.arguments[0].declNode.nodeId === arrRefId);
						if (iifes.length) {
							const iife = iifes[0];
							const context = [arrRef.src, arrDecryptor.src, iife.src].join('\n');
							const skipScopes = [arrRef.scope.scopeId, arrDecryptor.scope.scopeId, iife.expression.callee.scope.scopeId];
							const replacementCandidates = this._ast.filter(n =>
								n?.callee?.name === arrDecryptor.id.name &&
								!skipScopes.includes(n.scope.scopeId));
							for (const rc of replacementCandidates) {
								const src = `${context}\n${rc.src}`;
								const newNode = evalInVm(src, {debugErr});
								this._markNode(rc, newNode);
							}
						}
					}
				}
			}
		}
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
			this._normalizeEmptyStatements,
			this._removeNestedBlockStatements,
			this._removeRedundantLogicalExpressions,
			this._resolveMemberExpressionReferencesToArrayIndex,
			this._resolveMemberExpressionsWithDirectAssignment,
			this._resolveDefiniteBinaryExpressions,
			this._parseTemplateLiteralsIntoStringLiterals,
			this._resolveDeterministicIfStatements,
			this._unwrapFunctionShells,
			this._replaceFunctionShellsWithWrappedValue,
			this._replaceCallExpressionsWithUnwrappedIdentifier,
			this._replaceEvalCallsWithLiteralContent,
			this._replaceIdentifierWithFixedAssignedValue,
			this._replaceIdentifierWithFixedValueNotAssignedAtDeclaration,
			this._replaceReferencedProxy,
		];
	}

	/**
	 * @return {Function[]} Deobfuscation methods that use eval
	 */
	_unsafeDeobfuscationMethods() {
		return [
			this._resolveMinimalAlphabet,
			this._resolveAugmentedFunctionWrappedArrayReplacements,
			this._resolveMemberExpressionsLocalReferences,
			this._resolveDefiniteMemberExpressions,
			this._resolveLocalCalls,
			this._resolveBuiltinCalls,
			this._resolveDeterministicConditionalExpressions,
			this._resolveInjectedPrototypeMethodCalls,
			this._resolveEvalCallsOnNonLiterals,
			this._resolveFunctionConstructorCalls,
		];
	}

	/**
	 * Make all changes which don't involve eval first in order to avoid running eval on probelmatic values
	 * which can only be detected once part of the script is deobfuscated. Once all the safe changes are made,
	 * continue to the unsafe changes.
	 * Since the unsafe modification may be overreaching, run them only once and try the safe methods again.
	 */
	_loopSafeAndUnsafeDeobfuscationMethods() {
		let modified;
		do {
			this.modified = false;
			this.runLoop(this._safeDeobfuscationMethods());
			this.runLoop(this._unsafeDeobfuscationMethods(), true);
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
