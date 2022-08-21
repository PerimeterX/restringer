// Internal value used to indicate eval failed
const badValue = '--BAD-VAL--';

// Do not repeate more than this many iterations.
const defaultMaxIterations = 500;

// A string that tests true for this regex cannot be used as a variable name.
const badIdentifierCharsRegex = /([:!@#%^&*(){}[\]\\|/`'"]|[^\da-zA-Z_$])/;

const propertiesThatModifyContent = ['push', 'forEach', 'pop', 'insert', 'add', 'set', 'delete'];

// Properties that shouldn't be resolved since they're either based on context which can't be determined or resolve inconsistently.
const skipProperties = [
	'test', 'exec', 'match', 'length', 'freeze', 'call', 'apply', 'create', 'getTime',
	'getMilliseconds', ...propertiesThatModifyContent,
];

// A regex for a valid identifier name.
const validIdentifierBeginning = /^[A-Za-z$_]/;

module.exports = {
	badValue,
	defaultMaxIterations,
	badIdentifierCharsRegex,
	propertiesThatModifyContent,
	skipProperties,
	validIdentifierBeginning,
};