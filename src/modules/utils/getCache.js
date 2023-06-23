let cache = {};
let relevantScriptHash = null;

/**
 * @param {string} currentScriptHash
 * @return {object} The relevant cache object.
 */
function getCache(currentScriptHash) {
	if (currentScriptHash !== relevantScriptHash) {
		relevantScriptHash = currentScriptHash;
		cache = {};
	}
	return cache;
}

getCache.flush = function() {
	cache = {};
};

module.exports = getCache;