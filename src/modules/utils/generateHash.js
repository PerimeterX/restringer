import crypto from 'node:crypto';

function generateHash(script) {
	return crypto.createHash('md5').update(script).digest('hex');
}

export {generateHash};