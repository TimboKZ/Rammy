/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2018
 * @license GPL-3.0
 */

const {describe, it, before} = require('mocha');
const assert = require('chai').assert;
const shell = require('shelljs');
const path = require('path');

const rammyCliScript = path.join(__dirname, 'rammy-cli.js');
const execRammyCommand = (command = '') => {
    return shell.exec(`node ${rammyCliScript} ${command}`, {silent: true});
};

describe('Rammy CLI', () => {

    before(() => {
        // Make `node` command is available
        assert.isOk(shell.which('node'), `'node' command is not available! It is required to run CLI tests.`);
    });

    describe('with no arguments', () => {
        it('should execute without errors', () => {
            const result = execRammyCommand();
            assert.equal(result.code, 0);
        });
    });

});
