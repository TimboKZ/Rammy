/**
 * These tests focus on testing expected CLI functionality, they don't go too deep into the business logic.
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2018
 * @license GPL-3.0
 */

const {describe, it, before} = require('mocha');
const assert = require('chai').assert;
const Promise = require('bluebird');
const shell = require('shelljs');
const path = require('path');

const Constants = require('../lib/Constants');
const TU = require('../test/TestUtil');

// Checks for available command line binaries
const hasNode = TU.has('node');
const hasGit = TU.has('git');
const hasPdflatex = TU.has('pdflatex');
const hasLatexmk = TU.has('latexmk');

// Useful paths and name
const configName = Constants.ConfigFileName;

// Executes a Rammy command
const rammyCliScript = path.join(__dirname, 'rammy-cli.js');
const execRammyCommand = (command = '') => {
    return shell.exec(`node ${rammyCliScript} ${command}`, {silent: true});
};

/**
 * @param {string} command
 * @param {int|boolean} expected Exit code or boolean: `true` - should succeed, `false` - should fail.
 */
const assertRammyCommand = (command, expected) => {
    TU.assertShell(execRammyCommand(command), expected);
};

describe('Rammy CLI', () => {

    before(() => Promise.resolve()
        .then(() => assert.isTrue(hasNode, `'node' command is not available! It's required for CLI tests.`))

        // Delete fixtures path if it exists, create an empty folder
        .then(() => TU.resetFixtures())
        .then(() => shell.cd(TU.getFixturesPath())),
    );

    describe('with no arguments', () => {
        it('should execute without errors', () => {
            assertRammyCommand('', 0);
        });
    });

    describe('rammy init', () => {
        it('should succeed in an empty directory', () => {
            TU.removeFixture(configName);
            assertRammyCommand('init', 0);
            assert.isTrue(TU.hasFixture(configName), 'Config file was not created!');
        });
        it('should fail when a project has already been initialised', () => {
            assertRammyCommand('init', 1);
        });
    });

    describe('rammy init --git', () => {
        TU.itIf(hasGit)('should succeed and init a Git repo (has git binary)', () => {
            TU.removeFixture(configName, '.gitignore', '.git');
            TU.assertShell(execRammyCommand('init --git'), 0);

            assert.isTrue(TU.hasFixture(configName), 'Config file was not created!');
            assert.isTrue(TU.hasFixture('.gitignore'), 'Git ignore was not created!');
            assert.isTrue(TU.hasFixture('.git'), 'Git repo was not created!');
        });
    });

    describe('rammy init-module', () => {
        it('should fail when no name is provided', () => {
            assertRammyCommand('init-module', false);
        });
        it('should succeed in an empty directory', () => {
            TU.removeFixture(configName);
            assertRammyCommand('init-module test-name', 0);
        });
        it('should fail when a module has already been initialised', () => {
            assertRammyCommand('init-module test-name', 1);
        });
    });

    describe('rammy add <github-repo> (no git)', () => {
        it('should succeed on shorthand name (in a project)', () => {
            TU.removeFixture('.git', '.gitignore', 'latex-common', configName);
            assertRammyCommand('init', 0);
            assertRammyCommand('add TimboKZ/latex-common', 0);
            TU.hasFixture('latex-common');
        });
        it('should succeed on full repo url (in a project)', () => {
            TU.removeFixture('latex-common');
            assertRammyCommand('add https://github.com/TimboKZ/latex-common.git', 0);
            TU.hasFixture('latex-common');
            TU.hasNoFixture('latex-common.git');
        });
        it('should fail on an invalid name (in a project)', () => {
            assertRammyCommand('add $$/%%', false);

            // Local path without `--path` flag (bad):
            assertRammyCommand('add ./local-path', false);
        });
        it('should succeed on a path (in a project)', () => {
            assertRammyCommand('add ./latex-common --path', 0);
        });
        it('should fail on a bad path (in a project)', () => {
            assertRammyCommand('add ./non-existing-path --path', false);
        });
        it('should succeed on shorthand name (in a module)', () => {
            TU.removeFixture(configName, 'latex-common');
            assertRammyCommand('init-module test-name', 0);
            assertRammyCommand('add TimboKZ/latex-common', 0);
            TU.hasFixture('latex-common');
        });
    });

});
