module.exports = [
	{
		enabled: true,
		name: 'augmentedArray - TP-1',
		processors: __dirname + '/../src/processors/augmentedArray',
		// prepareTest: () => {},
		// prepareResult: () => {},
		source: `const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'a', 'b', 'c'];
(function (targetArray, numberOfShifts) {
  var augmentArray = function (counter) {
    while (--counter) {
        targetArray['push'](targetArray['shift']());
    }
  };
  augmentArray(++numberOfShifts);
}(arr, 3));`,
		expected: `const arr = [\n  4,\n  5,\n  6,\n  7,\n  8,\n  9,\n  10,\n  'a',\n  'b',\n  'c',\n  1,\n  2,\n  3\n];`,
	},
	{
		enabled: true,
		name: 'caesarPlus - TP-1',
		processors: __dirname + '/../src/processors/caesarp',
		// prepareTest: () => {},
		// prepareResult: () => {},
		source: `(function() {
	const a = document.createElement('div');
	const b = 'Y29uc29sZS5sb2co';
	const c = 'IlJFc3RyaW5nZXIiKQ==';
	a.innerHTML = b + c;
	const atb = window.atob || function (val) {return Buffer.from(val, 'base64').toString()};
	let dbt = {};
	const abc = a.innerHTML;
	dbt['toString'] = ''.constructor.constructor(atb(abc));
	dbt = dbt + "this will execute dbt's toString method";
})();`,
		expected: `console.log("REstringer")`,
	},
	{
		enabled: true,
		name: 'functionToArray - TP-1',
		processors: __dirname + '/../src/processors/functionToArray',
		// prepareTest: () => {},
		// prepareResult: () => {},
		source: `function getArr() {return ['One', 'Two', 'Three']} const a = getArr(); console.log(a[0] + ' + ' + a[1] + ' = ' + a[2]);`,
		expected: `function getArr() {\n  return [\n    'One',\n    'Two',\n    'Three'\n  ];\n}\nconst a = [\n  'One',\n  'Two',\n  'Three'\n];\nconsole.log(a[0] + ' + ' + a[1] + ' = ' + a[2]);`,
	},
	{
		enabled: true,
		name: 'functionToArray - TP-2',
		processors: __dirname + '/../src/processors/functionToArray',
		// prepareTest: () => {},
		// prepareResult: () => {},
		source: `const a = (function(){return ['One', 'Two', 'Three']})(); console.log(a[0] + ' + ' + a[1] + ' = ' + a[2]);`,
		expected: `const a = [\n  'One',\n  'Two',\n  'Three'\n];\nconsole.log(a[0] + ' + ' + a[1] + ' = ' + a[2]);`,
	},
	{
		enabled: true,
		name: 'functionToArray - TN-1',
		processors: __dirname + '/../src/processors/functionToArray',
		// prepareTest: () => {},
		// prepareResult: () => {},
		source: `function getArr() {return ['One', 'Two', 'Three']} console.log(getArr()[0] + ' + ' + getArr()[1] + ' = ' + getArr()[2]);`,
		expected: `function getArr() {return ['One', 'Two', 'Three']} console.log(getArr()[0] + ' + ' + getArr()[1] + ' = ' + getArr()[2]);`,
	},
	{
		enabled: true,
		name: 'obfuscatorIo - TP-1',
		processors: __dirname + '/../src/processors/obfuscatorIo',
		// prepareTest: () => {},
		// prepareResult: () => {},
		source: `var a = {
  'removeCookie': function () {
    return 'dev';
  }
}`,
		expected: `var a = { 'removeCookie': 'function () {return "bypassed!"}' };`,
	},
	{
		enabled: true,
		name: 'obfuscatorIo - TP-2',
		processors: __dirname + '/../src/processors/obfuscatorIo',
		// prepareTest: () => {},
		// prepareResult: () => {},
		source: `var a = function (f) {
  this['JoJo'] = function () {
    return 'newState';
  }
}`,
		expected: `var a = function (f) {
  this['JoJo'] = 'function () {return "bypassed!"}';
};`,
	},
];