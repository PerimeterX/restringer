/**
 * Grouping node types, property names, and known identifiers in meaningful groups.
 */

const propertiesThatModifyContent = ['push', 'forEach', 'pop', 'insert', 'add', 'set', 'delete'];

// Arguments that shouldn't be touched since the context may not be inferred during deobfuscation.
const badArgumentTypes = ['ThisExpression'];

// Identifiers that shouldn't be touched since they're either session-based or resolve inconsisstently.
const skipIdentifiers = [
	'window', 'this', 'self', 'document', 'module', '$', 'jQuery', 'navigator', 'typeof', 'new', 'Date', 'Math',
	'Promise', 'Error', 'fetch', 'XMLHttpRequest'
];

// Builtin functions that shouldn't be resolved in the deobfuscation context.
const skipBuiltinFunctions = ['Function', 'eval', 'Array', 'Object', 'fetch', 'XMLHttpRequest', 'Promise'];

// A string that tests true for this regex cannot be used as a variable name.
const badIdentifierCharsRegex = /([:!@#%^&*(){}[\]\\|/`'"]|[^\da-zA-Z_$])/;

// Properties that shouldn't be resolved since they're either based on context which can't be determined or resolve inconsistently.
const skipProperties = [
	'test', 'exec', 'match', 'length', 'freeze', 'call', 'apply', 'create', 'getTime',
	'getMilliseconds', ...propertiesThatModifyContent,
];

module.exports = {
	skipProperties,
	skipIdentifiers,
	badArgumentTypes,
	badIdentifierCharsRegex,
	skipBuiltinFunctions,
	propertiesThatModifyContent,
};