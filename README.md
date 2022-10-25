# Restringer
[![Node.js CI](https://github.com/PerimeterX/restringer/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/PerimeterX/restringer/actions/workflows/node.js.yml)
[![Downloads](https://img.shields.io/npm/dm/restringer.svg?maxAge=43200)](https://www.npmjs.com/package/restringer)

Deobfuscate Javascript and reconstruct strings.
Simplify cumbersome logic where possible while adhering to scope limitations.

Try it online @ [restringer.tech](https://restringer.tech).

For comments and suggestions feel free to open an issue or find me on Twitter - [@ctrl__esc](https://twitter.com/ctrl__esc) 

## Table of Contents
* [Installation](#installation)
* [Usage](#usage)
  * [Command-Line Usage](#command-line-usage) 
  * [Use as a Module](#use-as-a-module) 
* [Read More](#read-more)
***

## Installation 
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

## Read More
* [Processors](src/processors/README.md)
* [Tests](tests/README.md)
* [Contribution guide](CONTRIBUTING.md)
* [Obfuscation Detector](https://github.com/PerimeterX/obfuscation-detector/blob/main/README.md)
* [flAST](https://github.com/PerimeterX/flast/blob/main/README.md)
