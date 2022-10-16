// Arguments that shouldn't be touched since the context may not be inferred during deobfuscation.
const badArgumentTypes = ['ThisExpression'];

// A string that tests true for this regex cannot be used as a variable name.
const badIdentifierCharsRegex = /([:!@#%^&*(){}[\]\\|/`'"]|[^\da-zA-Z_$])/;

// Internal value used to indicate eval failed
const badValue = '--BAD-VAL--';

// Do not repeate more than this many iterations.
const defaultMaxIterations = 500;

const propertiesThatModifyContent = ['push', 'forEach', 'pop', 'insert', 'add', 'set', 'delete'];

// Builtin functions that shouldn't be resolved in the deobfuscation context.
const skipBuiltinFunctions = ['Function', 'eval', 'Array', 'Object', 'fetch', 'XMLHttpRequest', 'Promise'];

// Identifiers that shouldn't be touched since they're either session-based or resolve inconsisstently.
const skipIdentifiers = [
	'window', 'this', 'self', 'document', 'module', '$', 'jQuery', 'navigator', 'typeof', 'new', 'Date', 'Math',
	'Promise', 'Error', 'fetch', 'XMLHttpRequest', 'performance',
];

// Properties that shouldn't be resolved since they're either based on context which can't be determined or resolve inconsistently.
const skipProperties = [
	'test', 'exec', 'match', 'length', 'freeze', 'call', 'apply', 'create', 'getTime', 'now',
	'getMilliseconds', ...propertiesThatModifyContent,
];

// A regex for a valid identifier name.
const validIdentifierBeginning = /^[A-Za-z$_]/;

module.exports = {
	badArgumentTypes,
	badIdentifierCharsRegex,
	badValue,
	defaultMaxIterations,
	propertiesThatModifyContent,
	skipBuiltinFunctions,
	skipIdentifiers,
	skipProperties,
	validIdentifierBeginning,
};