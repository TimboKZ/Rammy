/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2018
 * @license GPL-3.0
 */

const {describe, it, before} = require('mocha');
const assert = require('chai').assert;
const Promise = require('bluebird');
const shell = require('shelljs');
const fs = require('fs-extra');
const path = require('path');

const Constants = require('../lib/Constants');

// Checks for available command line commands
const hasNode = !!shell.which('node');
const hasGit = !!shell.which('git');
const hasPdflatex = !!shell.which('pdflatex');
const hasLatexmk = !!shell.which('latexmk');

// Useful definitions for the tests
const fixturesPath = path.resolve(__dirname, '..', 'test', 'fixtures');
const testConfigPath = path.join(fixturesPath, Constants.ConfigFileName);
const testGitignoreDir = path.join(fixturesPath, '.gitignore');
const rammyCliScript = path.join(__dirname, 'rammy-cli.js');
const execRammyCommand = (command = '') => {
    return shell.exec(`node ${rammyCliScript} ${command}`, {silent: true});
};
const describeIf = flag => flag ? describe : describe.skip;
const itIf = flag => flag ? it : it.skip;

// These tests focus on testing expected CLI functionality, they don't go too deep into the business logic.

describe('Rammy CLI', () => {

    before(() => Promise.resolve()
        .then(() => assert.isTrue(hasNode, `'node' command is not available! It's required for CLI tests.`))

        // Delete fixtures path if it exists, create an empty folder
        .then(() => fs.pathExists(fixturesPath))
        .then(fixturesExist => fixturesExist ? fs.remove(fixturesPath) : null)
        .then(() => fs.ensureDir(fixturesPath))
        .then(() => shell.cd(fixturesPath)),
    );

    describe('with no arguments', () => {
        it('should execute without errors', () => {
            const result = execRammyCommand();
            assert.equal(result.code, 0);
        });
    });

    describe('rammy init', () => {
        it('should succeed in an empty directory', () => {
            fs.removeSync(testConfigPath);
            const result = execRammyCommand('init');
            assert.equal(result.code, 0);
            assert.isTrue(fs.pathExistsSync(testConfigPath), 'Config file was not created!');
        });
        it('should fail when a project has already been initialised', () => {
            const result = execRammyCommand('init');
            assert.equal(result.code, 1);
        });
    });

    describe('rammy init --git', () => {
        itIf(hasGit)('should succeed and init a Git repo (has git binary)', () => {
            fs.removeSync(testConfigPath);
            fs.removeSync(testGitignoreDir);
            const result = execRammyCommand('init --git');
            assert.equal(result.code, 0);
            assert.isTrue(fs.pathExistsSync(testConfigPath), 'Config file was not created!');
            assert.isTrue(fs.pathExistsSync(testGitignoreDir), 'Git ignore was not created!');
            // Since fixtures are in a Git repo, `.git` won't be created.
        });
    });

    describe('rammy init-module', () => {
        it('should fail when no name is provided', () => {
            const result = execRammyCommand('init-module');
            assert.notEqual(result.code, 0);
        });
        it('should succeed in an empty directory', () => {
            fs.removeSync(testConfigPath);
            const result = execRammyCommand('init-module test-name');
            assert.equal(result.code, 0);
        });
        it('should fail when a module has already been initialised', () => {
            const result = execRammyCommand('init-module test-name');
            assert.equal(result.code, 1);
        });
    });

});
