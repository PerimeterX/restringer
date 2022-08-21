const crypto = require('crypto');

function generateScriptHash(script) {
	return crypto.createHash('sha256').update(script).digest('hex');
}

module.exports = generateScriptHash;