const {VM} = require('vm2');

const disableObjects = {  // APIs that should be disabled when running scripts in eval to avoid inconsistencies.
	Date: class {},
	debugger: {},
};

const vmOptions = {
	timeout: 5 * 1000,
	sandbox: {...disableObjects},
	wasm: false,
};

/**
 * @return {VM}
 */
function getVM() {
	return new VM(vmOptions);
}

module.exports = getVM;