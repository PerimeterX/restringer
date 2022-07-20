# Helpers

## Table of Contents
* [Config](#config)
* [Debug Helper](#debug-helper)
* [Safe Implementations](#safe-implementations)
* [Additional Files](#additional-files)

## Config
[config.js](config.js) <br/>
Grouped names of items to be used while deobfuscating, as well as rules to defuse code traps.

## Debug Helper
[debugHelper.js](debugHelper.js) <br/>
A module that handles printing debug messages.

## Safe Implementations
[safeImplementations.js](safeImplementations.js) <br/>
A module used when resolving call expressions where the callee is a builtin function. <br/>
The module contains a version of a browser builtin that can be used by this node deobfuscator.

## Additional Files
* [jquery.slim.min.js](jquery.slim.min.js) <br/>
  Used when running eval on parts of the code which require jQuery present.