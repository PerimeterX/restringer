# Tests
Use the tests to verify code changes did not break any previously working feature. <br />

## Table of Contents
* [Structure](#structure)
  * [testRestringer.js](#testrestringerjs)
    * [Test Files' Structure](#test-files-structure)
  * [testDeobfuscations.js](#testdeobfuscationsjs)
    * [Sample File's Structure](#sample-files-structure)

## Structure
The test files are divided into two parts:
1. The test logic, containing the code for running the test and verifying the results, as well as timing and logging. These files shouldn't be touched often.
2. The test content, containing the test instructions, to which new tests should be added and existing tests should be modified according to need.

The tests themselves are also divided into two categories:
1. [Deobfuscation tests](deobfuscation-tests.js). <br/> 
   Testing specific deobfuscation techniques, sort of like unit-tests but not quite. 
   Making sure that nothing broke during changes made to the code, and if it did break, these tests will help figure out where,
   since they're targeting specific methods that should modify the code during the run.
2. [Deobfuscating samples tests](obfuscated-samples.js). <br/>
   More like end-to-end testing, these tests run against different kinds of obfuscated scripts 
   and verify all the different deobfuscation methods are working well together and that the end result is properly deobfuscated.

The [main test file](testRestringer.js) runs all the tests, but it is also possible to run only one of the test types
by running either [testDeobfuscations.js](testDeobfuscations.js) or [testObfuscatedSamples.js](testObfuscatedSamples.js) to save time
during development.

### testRestringer.js
As stated above, [testRestringer.js](testRestringer.js) is the main test file, which loads the two tests files described below.
It starts a timer to later report how long all the tests took, and prints out the name of the test being run.

### testDeobfuscations.js
The [testDeobfuscations.js](testDeobfuscations.js) file contains the logic for testing specific deobfuscation methods.
The tests are done by running the deobfuscator on a short string of obfuscated code containing (as much as possible) only the type of obfuscation being tested.

A good rule of thumb for making sure the obfuscated code is testing the correct method is to have it fail first by disabling
the target deobfuscation method and verifying the code isn't deobfuscated as expected.

#### Test Files' Structure
<u>Test Objects</u>: <br/>
The test files export an array of objects, with each object being a test case.
The structure of the object is as follows:

* enabled - boolean <br/>
  Whether the test is enabled or should be skipped. If skipped, a reason field must be present.
* reason - string <br/>
  Required if test is disabled. The reason why this test is being skipped.
* name - string <br/>
  The name of the test (a quick description of what it tests).
* source - string <br/>
  The source code to be deobfuscated.
* expected - string <br/>
  The expected deobfuscated output.

<u>Disabling Tests</u>: <br/>
During development it might be useful to disable some tests, or to add tests before the deobfuscation code is created for them.
Set the `enabled` key in the test object to `false` to signal the test is expected to fail.
When disabling a test you must add a `reason` explaining why the test was disabled

### testObfuscatedSamples.js
The [testObfuscatedSamples.js](testObfuscatedSamples.js) file contains the logic for testing complete samples of obfuscated scripts.
These are similar to end-to-end tests, and include detecting the type of obfuscation, and following the relevant steps for deobfuscating it.

#### Sample File's Structure
<u>Test Objects</u>: <br/>
The [test content file](obfuscated-samples.js) export an object,
where the sample name is the key and the filename containing the target code is the value.

<u>Resources Location</u>: <br/>
The [resources folder](resources) contains the obfuscated scripts with their unique obfuscation,
which the Restringer already successfully handles. <br/>
All resources contain the original obfuscated script as well as a deobfuscated version for comparison.
Tests must produce the expected deobfuscate result in order to pass. <br/>

If the changes produces a better deobfuscation (i.e., improved readability),
update the `-deob.js` files in the `Resources` folder to reflect the expected changes.
