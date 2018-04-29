/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2018
 * @license GPL-3.0
 */

const {describe, it} = require('mocha');
const shell = require('shelljs');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const fixturesPath = path.join(os.tmpdir(), 'rammy-fixtures');

class TestUtil {

    /**
     * Conditional Mocha test description. If `flag` is falsy, test will be skipped
     *
     * @param {boolean} flag
     * @returns {Mocha.describe|Mocha.describe.skip}
     */
    static describeIf(flag) {
        return flag ? describe : describe.skip;
    }

    /**
     * Conditional Mocha test description. If `flag` is falsy, test will be skipped
     *
     * @param {boolean} flag
     * @returns {Mocha.it|Mocha.it.skip}
     */
    static itIf(flag) {
        return flag ? it : it.skip;
    }

    /**
     * @returns {string}
     */
    static getFixturesPath() {
        return fixturesPath;
    }

    /**
     * Checks if the specified shell binary is available
     *
     * @param {string} command
     * @returns {boolean}
     */
    static has(command) {
        return !!shell.which(command);
    }

    /**
     * Useful error code assertions when using `shell.exec()`
     *
     * @param {ExecOutputReturnValue} result
     * @param {int|boolean} expectedResult Exit code or boolean. `true` matches 0, `false` matches anything but 0.
     */
    static assertShell(result, expectedResult) {
        let failure;
        let expectedCode;
        if (typeof (expectedResult) === 'number') {
            failure = result.code !== expectedResult;
            expectedCode = expectedResult;
        } else {
            if (expectedResult) {
                failure = result.code !== 0;
                expectedCode = 0;
            }
            else {
                failure = result.code === 0;
                expectedCode = 'not 0';
            }
        }

        if (failure) {
            let message = `\nBad exit code! Expected ${expectedCode}, got ${result.code}!\n`;
            if (result.stdout.trim()) message += `\n${result.stdout}\n`;
            if (result.stderr.trim()) message += `\n${result.stderr}\n`;
            throw new Error(message);
        }
    }

    /**
     * Checks if the specified path inside the fixtures folder exists.
     *
     * @param {string} fixturePath
     * @param {boolean} justReturn
     * @returns {boolean}
     */
    static hasFixture(fixturePath, justReturn = false) {
        const exists = fs.pathExistsSync(path.resolve(fixturesPath, fixturePath));
        if (!justReturn && !exists) throw new Error(`Expected fixture ${fixturePath} to exist but it didn't!`);
        return exists;
    }

    /**
     * Checks if the specified path inside the fixtures folder does not exist.
     *
     * @param {string} fixturePath
     * @param {boolean} justReturn
     * @returns {boolean}
     */
    static hasNoFixture(fixturePath, justReturn = false) {
        const exists = fs.pathExistsSync(path.resolve(fixturesPath, fixturePath));
        if (!justReturn && exists) throw new Error(`Expected fixture ${fixturePath} to not exist, but it did!`);
        return !exists;
    }

    /**
     * Removes the specified path from the fixture path.
     *
     * @param {...string} fixturePath
     */
    static removeFixture(fixturePath) { // eslint-disable-line no-unused-vars
        for (const fxtPath of arguments) {
            fs.removeSync(path.resolve(fixturesPath, fxtPath));
        }
    }

    /**
     * Ensures the fixtures directory exists and is empty.
     */
    static resetFixtures() {
        fs.emptyDirSync(fixturesPath);
    }

}

module.exports = TestUtil;
