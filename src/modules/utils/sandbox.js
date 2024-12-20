import pkg from 'isolated-vm';
const {Isolate, Reference} = pkg;

export class Sandbox {
	constructor() {
		// Objects that shouldn't be available when running scripts in eval to avoid security issues or inconsistencies.
		const replacedItems = {
			debugger: undefined,
			WebAssembly: undefined,
			fetch: undefined,
			XMLHttpRequest: undefined,
			WebSocket: undefined,
		};
		this.replacedItems = replacedItems;
		this.replacedItemsNames = Object.keys(replacedItems);
		this.timeout = 1.5 * 1000;

		this.vm = new Isolate({memoryLimit: 128});
		this.context = this.vm.createContextSync();

		this.context.global.setSync('global', this.context.global.derefInto());

		for (let i = 0; i < this.replacedItemsNames.length; i++) {
			const itemName = this.replacedItemsNames[i];
			this.context.global.setSync(itemName, this.replacedItems[itemName]);
		}
	}

	/**
	 * Run code in an isolated VM
	 * @param code
	 * @return {Reference}
	 */
	run(code) {
		// Delete some properties that add randomness to the result
		const script = this.vm.compileScriptSync('delete Math.random; delete Date;\n\n' + code);
		// const script = this.vm.compileScriptSync(code);
		return script.runSync(this.context, {
			timeout: this.timeout,
			reference: true,
		});
	}

	isReference(obj) {
		return Object.getPrototypeOf(obj) === Reference.prototype;
	}
}