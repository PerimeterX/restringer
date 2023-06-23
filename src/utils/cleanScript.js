/*
 * Pass scripts through this tool to help compare pre- and post- deobfuscation
 */
const fs = require('node:fs');
const {parseCode, generateCode} = require('flast');

const inFileName = process.argv[2];
const outFileName = inFileName + '-clean.js';
fs.writeFileSync(outFileName, generateCode(parseCode(fs.readFileSync(inFileName, 'utf-8'))));
console.log(`[+] Created clean file - ${outFileName}`);