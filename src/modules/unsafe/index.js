module.exports = {
	normalizeRedundantNotOperator: require(__dirname + '/normalizeRedundantNotOperator'),
	resolveAugmentedFunctionWrappedArrayReplacements: require(__dirname + '/resolveAugmentedFunctionWrappedArrayReplacements'),
	resolveBuiltinCalls: require(__dirname + '/resolveBuiltinCalls'),
	resolveDefiniteBinaryExpressions: require(__dirname + '/resolveDefiniteBinaryExpressions'),
	resolveDefiniteMemberExpressions: require(__dirname + '/resolveDefiniteMemberExpressions'),
	resolveDeterministicConditionalExpressions: require(__dirname + '/resolveDeterministicConditionalExpressions'),
	resolveEvalCallsOnNonLiterals: require(__dirname + '/resolveEvalCallsOnNonLiterals'),
	resolveFunctionToArray: require(__dirname + '/resolveFunctionToArray'),
	resolveInjectedPrototypeMethodCalls: require(__dirname + '/resolveInjectedPrototypeMethodCalls'),
	resolveLocalCalls: require(__dirname + '/resolveLocalCalls'),
	resolveMemberExpressionsLocalReferences: require(__dirname + '/resolveMemberExpressionsLocalReferences'),
	resolveMinimalAlphabet: require(__dirname + '/resolveMinimalAlphabet'),
};