const crypto = require('crypto');

function generateHash(script) {
	return crypto.createHash('sha256').update(script).digest('hex');
}

module.exports = generateHash;