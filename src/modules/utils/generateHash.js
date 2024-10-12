import crypto from 'node:crypto';

function generateHash(script) {
	return crypto.createHash('sha256').update(script).digest('hex');
}

export {generateHash};