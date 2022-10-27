module.exports = {
	consolidateNestedBlockStatements: require(__dirname + '/consolidateNestedBlockStatements'),
	normalizeComputed: require(__dirname + '/normalizeComputed'),
	normalizeEmptyStatements: require(__dirname + '/normalizeEmptyStatements'),
	parseTemplateLiteralsIntoStringLiterals: require(__dirname + '/parseTemplateLiteralsIntoStringLiterals'),
	rearrangeSequences: require(__dirname + '/rearrangeSequences'),
	rearrangeSwitches: require(__dirname + '/rearrangeSwitches'),
	removeDeadNodes: require(__dirname + '/removeDeadNodes'),
	replaceBooleanExpressionsWithIf: require(__dirname + '/replaceBooleanExpressionsWithIf'),
	replaceCallExpressionsWithUnwrappedIdentifier: require(__dirname + '/replaceCallExpressionsWithUnwrappedIdentifier'),
	replaceEvalCallsWithLiteralContent: require(__dirname + '/replaceEvalCallsWithLiteralContent'),
	replaceFunctionShellsWithWrappedValue: require(__dirname + '/replaceFunctionShellsWithWrappedValue'),
	replaceFunctionShellsWithWrappedValueIIFE: require(__dirname + '/replaceFunctionShellsWithWrappedValueIIFE'),
	replaceIdentifierWithFixedAssignedValue: require(__dirname + '/replaceIdentifierWithFixedAssignedValue'),
	replaceIdentifierWithFixedValueNotAssignedAtDeclaration: require(__dirname + '/replaceIdentifierWithFixedValueNotAssignedAtDeclaration'),
	replaceSequencesWithStatement: require(__dirname + '/replaceSequencesWithStatement'),
	resolveDeterministicIfStatements: require(__dirname + '/resolveDeterministicIfStatements'),
	resolveFunctionConstructorCalls: require(__dirname + '/resolveFunctionConstructorCalls'),
	resolveMemberExpressionReferencesToArrayIndex: require(__dirname + '/resolveMemberExpressionReferencesToArrayIndex'),
	resolveMemberExpressionsWithDirectAssignment: require(__dirname + '/resolveMemberExpressionsWithDirectAssignment'),
	resolveProxyCalls: require(__dirname + '/resolveProxyCalls'),
	resolveProxyReferences: require(__dirname + '/resolveProxyReferences'),
	resolveProxyVariables: require(__dirname + '/resolveProxyVariables'),
	resolveRedundantLogicalExpressions: require(__dirname + '/resolveRedundantLogicalExpressions'),
	unwrapFunctionShells: require(__dirname + '/unwrapFunctionShells'),
};