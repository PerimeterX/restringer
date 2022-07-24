# Restringer
Deobfuscate Javascript and reconstruct strings.
Simplify cumbersome logic where possible while adhering to scope limitations.

Try it online @ [restringer.tech](https://restringer.tech)

## Table of Contents
* [Installation](#installation)
* [Usage](#usage)
  * [Command-Line Usage](#command-line-usage) 
  * [Use as a Module](#use-as-a-module) 
* [Read More](#read-more)
* [TODO](#todo)

***

## Installation 
Requires Node 17 or newer.
```bash
git clone git@github.com:PerimeterX/restringer.git
cd restringer
npm install
```

***

## Usage
The [restringer.js](restringer.js) uses generic deobfuscation methods that reconstruct and restore obfuscated strings and simplifies redundant logic meant only to encumber.
REstringer employs the [Obfuscation Detector](https://github.com/PerimeterX/obfuscation-detector/blob/main/README.md) to identify specific types of obfuscation for which
there's a need to apply specific deobfuscation methods in order to circumvent anti-debugging mechanisms or other code traps
preventing the script from being deobfuscated.   

### Command-Line Usage

Output deobfuscated result to STDOUT (nothing will print if deobfuscation failed)
> node restringer.js script.js

Show debug information and save deobfuscated script to `script.js-<obfuscation-type>-deob.js`
> export DEOBDEBUG=true && node restringer.js script.js

Log level can be adusted via the `DEOBDEBUGLEVEL` environment variable for more or less granular 
log output. The default level is an arbitrary 50, simply to leave space for other levels to be added when needed.

> export DEOBDEBUG=true && DEOBDEBUGLEVEL=50 && node restringer.js script.js

Level 1 is most verbose, level 2 is a good value to use for debugging.
### Use as a Module
```javascript
const REstringer = require('restringer');

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
* [Processors](processors/README.md)
* [Helpers](helpers/README.md)
* [Tests](tests/README.md)
* [Contribution guide](CONTRIBUTING.md)
* [Obfuscation Detector](https://github.com/PerimeterX/obfuscation-detector/blob/main/README.md)
* [flAST](https://github.com/PerimeterX/flast/blob/main/README.md)

***

## TODO
- [ ] Replace environment variables with proper program arguments.
- [ ] Create binary tool that can be installed via `npm install -g restringer`