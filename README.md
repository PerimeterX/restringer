# Restringer
[![Node.js CI](https://github.com/PerimeterX/restringer/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/PerimeterX/restringer/actions/workflows/node.js.yml)
[![Downloads](https://img.shields.io/npm/dm/restringer.svg?maxAge=43200)](https://www.npmjs.com/package/restringer)

Deobfuscate Javascript and reconstruct strings.
Simplify cumbersome logic where possible while adhering to scope limitations.

Try it online @ [restringer.tech](https://restringer.tech).

For comments and suggestions feel free to open an issue or find me on Twitter - [@ctrl__esc](https://twitter.com/ctrl__esc) 

## Table of Contents
* [Installation](#installation)
  * [npm](#npm)
  * [Clone The Repo](#clone-the-repo)
* [Usage](#usage)
  * [Command-Line Usage](#command-line-usage) 
  * [Use as a Module](#use-as-a-module) 
* [Create Custom Deobfuscators](#create-custom-deobfuscators)
* [Read More](#read-more)
***

## Installation 
### npm
```bash
npm install restringer
```

### Clone The Repo
Requires Node 16 or newer.
```bash
git clone git@github.com:PerimeterX/restringer.git
cd restringer
npm install
```

***

## Usage
The [restringer.js](src/restringer.js) uses generic deobfuscation methods that reconstruct and restore obfuscated strings and simplifies redundant logic meant only to encumber.
REstringer employs the [Obfuscation Detector](https://github.com/PerimeterX/obfuscation-detector/blob/main/README.md) to identify specific types of obfuscation for which
there's a need to apply specific deobfuscation methods in order to circumvent anti-debugging mechanisms or other code traps
preventing the script from being deobfuscated.   

### Command-Line Usage

```
Usage: restringer input_filename [-h] [-c] [-q | -v] [-m M] [-o [output_filename]]

positional arguments:
	input_filename                  The obfuscated JS file

optional arguments:
	-h, --help                      Show this help message and exit.
	-c, --clean                     Remove dead nodes from script after deobfuscation is complete (unsafe).
	-q, --quiet                     Suppress output to stdout. Output result only to stdout if the -o option is not set.
																	Does not go with the -v option.
	-m, --max-iterations M          Run at most M iterations
	-v, --verbose                   Show more debug messages while deobfuscating. Does not go with the -q option.
	-o, --output [output_filename]  Write deobfuscated script to output_filename. 
																	Use <input_filename>-deob.js if no filename is provided.
```
### Use as a Module

```javascript
const {REstringer} = require('restringer');

const restringer = new REstringer('"RE" + "stringer"');
if (restringer.deobfuscate()) {
  console.log(restringer.script);
} else {
  console.log('Nothing was deobfuscated :/');
}
// Output: 'REstringer';
```

***
## Create Custom Deobfuscators
REstringer is highly modularized. It exposes modules that allow creating custom deobfuscators 
that can solve specific problems.

The basic structure of such a deobfuscator would be an array of deobfuscation modules 
(either [safe](src/modules/safe) or [unsafe](src/modules/unsafe)), run via flAST's applyIteratively utility function.

Unsafe modules run code through `eval` (using [isolated-vm](https://www.npmjs.com/package/isolated-vm) to be on the safe side) while safe modules do not.

```javascript
const {
  safe: {normalizeComputed},
  unsafe: {resolveDefiniteBinaryExpressions, resolveLocalCalls},
} = require('restringer').deobModules;
const {applyIteratively} = require('flast').utils;
let script = 'obfuscated JS here';
const deobModules = [
  resolveDefiniteBinaryExpressions,
  resolveLocalCalls,
  normalizeComputed,
];
script = applyIteratively(script, deobModules);
console.log(script); // Deobfuscated script
```

With the additional `candidateFilter` function argument, it's possible to narrow down the targeted nodes:
```javascript
const {
  unsafe: {resolveLocalCalls},
} = require('restringer').deobModules;
const {applyIteratively} = require('flast').utils;
let script = 'obfuscated JS here';

// It's better to define a function with a meaningful name that can show up in the log 
function resolveLocalCallsInGlobalScope(arb) {
  return resolveLocalCalls(arb, n => n.parentNode?.type === 'Program');
}
script = applyIteratively(script, [resolveLocalCallsInGlobalScope]);
console.log(script); // Deobfuscated script
```

You can also customize any deobfuscation method while still using REstringer without running the loop yourself:
```javascript
const fs = require('node:fs');
const {REstringer} = require('restringer');

const inputFilename = process.argv[2];
const code = fs.readFileSync(inputFilename, 'utf-8');
const res = new REstringer(code);

// res.logger.setLogLevelDebug();
res.detectObfuscationType = false;  // Skip obfuscation type detection, including any pre and post processors

const targetFunc = res.unsafeMethods.find(m => m.name === 'resolveLocalCalls');
let changes = 0;		// Resolve only the first 5 calls
res.safeMethods[res.unsafeMethods.indexOf(targetFunc)] = function customResolveLocalCalls(n) {return targetFunc(n, () => changes++ < 5)}

res.deobfuscate();

if (res.script !== code) {
  console.log('[+] Deob successful');
  fs.writeFileSync(`${inputFilename}-deob.js`, res.script, 'utf-8');
} else console.log('[-] Nothing deobfuscated :/');
```
***

## Read More
* [Processors](src/processors/README.md)
* [Tests](tests/README.md)
* [Contribution guide](CONTRIBUTING.md)
* [Obfuscation Detector](https://github.com/PerimeterX/obfuscation-detector/blob/main/README.md)
* [flAST](https://github.com/PerimeterX/flast/blob/main/README.md)
