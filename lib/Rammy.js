/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2018
 * @license GPL-3.0
 */


const git = require('simple-git/promise');
const Promise = require('bluebird');
const extend = require('extend');
const shell = require('shelljs');
const _ = require('underscore');
const fs = require('fs-extra');
const path = require('path');
const Joi = require('joi');

const {Util, RammyError, ErrorCodes} = require('./Util');
const packageData = require('../package.json');
const Constants = require('./Constants');

class Rammy {

    /**
     * @param {object} data
     * @param {Logger} data.logger
     * @param {string} data.rammyrcPath
     */
    constructor(data) {
        const schema = {
            logger: Joi.object().required(),
            rammyrcPath: Joi.string().optional(),
        };
        Util.validate(schema, data);

        this.logger = data.logger;
        this.rammyrcPath = data.rammyrcPath;
    }

    /**
     * @returns {Promise<object>}
     * @private
     */
    _readRammyrc() {
        if (!this.rammyrcPath) throw new RammyError('`.rammyrc.json` was not found!', ErrorCodes.MissingRammyrc);
        return fs.readJson(this.rammyrcPath);
    }

    /**
     * @param {object} content
     * @param {string} [_path]
     * @returns {Promise<void>}
     * @private
     */
    _writeRammyrc(content, _path = this.rammyrcPath) {
        return fs.writeJson(_path, content, {spaces: 2});
    }

    /**
     * @param {object} data
     * @param {string} data.directory Directory in which `.rammyrc.json` will be created.
     * @returns {Promise<void>}
     */
    initProject(data) {
        const schema = {
            directory: Joi.string().required(),
        };
        const defaultConfig = {
            rammyVersion: packageData.version,
            modules: {},
        };
        // TODO: Support `--git` flag
        // TODO: Add .gitignore extension here
        return Promise.resolve()
            .then(() => Util.validate(schema, data))
            .then(() => path.join(data.directory, Constants.CONFIG_NAME))
            .then(pathToConfig => this._writeRammyrc(defaultConfig, pathToConfig));
    }

    /**
     * @param {object} data
     * @param {string} data.directory Directory in which `.rammyrc.json` will be created.
     * @param {string} data.name Name of the module
     * @returns {Promise<void>}
     */
    initModule(data) {
        const schema = {
            directory: Joi.string().required(),
            name: Joi.string().required(),
        };
        const defaultConfig = {
            rammyVersion: packageData.version,
            name: data.name,
            module: true,
            templates: {},
            inputs: {},
        };
        return Promise.resolve()
            .then(() => Util.validate(schema, data))
            .then(() => path.join(data.directory, Constants.CONFIG_NAME))
            .then(pathToConfig => this._writeRammyrc(defaultConfig, pathToConfig));
    }

    /**
     * @param {Object} data
     * @param {string} data.module Git(Hub) repository or (possibly relative) path to module
     * @param {boolean} data.isPath Indicates if `data.module` is a path
     * @returns {Promise<void>}
     */
    addModule(data) {
        const schema = {
            module: Joi.string().required(),
            isPath: Joi.boolean().required(),
        };
        const rammyrcDir = path.dirname(this.rammyrcPath);
        let moduleName;
        let pathToModule;
        return Promise.resolve()
            .then(() => Util.validate(schema, data))

            // Check that config exist beforehand.
            .then(() => this._readRammyrc())

            .then(() => {
                moduleName = path.basename(data.module);

                // Check if we're working with a local path
                if (data.isPath) {
                    pathToModule = path.resolve(data.module);
                    if (!fs.pathExistsSync(pathToModule)) {
                        throw new RammyError('That path does not exist!', ErrorCodes.ModuleNotExists);
                    }
                    return Promise.resolve();
                }

                // If we end up here, we either have a full Git path or shorthand for GitHub repo
                if (!shell.which('git')) throw new RammyError(`'git' command was not found! Install Git or use local paths to add modules.`);

                // Figure out what format we have
                let remote;
                if (/^[a-z]+\/[a-z\-_]+$/i.test(data.module)) remote = `https://github.com/${data.module}.git`;
                else remote = data.module;

                // Use repository name as the folder name.
                pathToModule = path.resolve(moduleName);

                // If `.rammyrc.json` is in a Git repo, we add a submodule. Otherwise we clone afresh.
                return Promise.resolve()
                    .then(() => git(rammyrcDir).silent().checkIsRepo())
                    .then(rammyrcInGitRepo => {
                        if (rammyrcInGitRepo) {
                            this.logger.debug(`Looks like we're in a Git repository - adding a Git submodule.`);
                            return git(rammyrcDir).submoduleAdd(remote, pathToModule);
                        }
                        else {
                            this.logger.debug(`We're not in a Git repository - cloning the repo afresh.`);
                            return git(rammyrcDir).clone(remote, pathToModule);
                        }
                    });
            })
            .then(() => {
                const moduleConfigPath = path.join(pathToModule, Constants.CONFIG_NAME);
                if (!fs.pathExistsSync(moduleConfigPath)) return null;
                return fs.readJson(moduleConfigPath);
            })
            .then(moduleRammyrc => {
                if (moduleRammyrc && moduleRammyrc.name) moduleName = moduleRammyrc.name;
                else this.logger.warn(`Can't resolve module name (is module's '${Constants.CONFIG_NAME}' valid?) - using folder name instead: '${moduleName}'.`);

                const relativeModulePath = path.relative(rammyrcDir, pathToModule);
                return this._addModuleToRammyrc({moduleName, relativeModulePath});
            });
    }

    /**
     * @param {object} data
     * @param {string} data.moduleName
     * @param {string} data.relativeModulePath Path to the module, relative to .rammyrc location
     * @private
     */
    _addModuleToRammyrc(data) {
        return Promise.resolve()
            .then(() => this._readRammyrc())
            .then(rammyrc => {
                if (rammyrc.modules[data.moduleName]) this.logger.warn('Module already defined - overwriting.');
                rammyrc.modules[data.moduleName] = `./${data.relativeModulePath}`;
                return this._writeRammyrc(rammyrc);
            });
    }

    /**
     * @param {Object} data
     * @param {string} data.module Module name
     * @returns {Promise<void>}
     */
    removeModule(data) {
        const schema = {
            module: Joi.string().required(),
        };
        return Promise.resolve()
            .then(() => Util.validate(schema, data))
            .then(() => this._readRammyrc())
            .then(rammyrc => {
                if (!rammyrc.modules[data.module]) this.logger.warn(`Module '${data.module}' was not defined.`);
                delete rammyrc.modules[data.module];
                return this._writeRammyrc(rammyrc);
            });
    }

    /**
     * @returns {{modules: object, allTemplates: object, allInputs: object}}
     */
    getAllModuleData() {
        return Promise.resolve()
            .then(() => this._readRammyrc())
            .then(rammyrc => {
                const modules = {};
                const allTemplates = {};
                const allInputs = {};
                for (let moduleName in rammyrc.modules) {
                    if (!rammyrc.modules.hasOwnProperty(moduleName)) continue;

                    const modulePath = path.resolve(path.dirname(this.rammyrcPath), rammyrc.modules[moduleName]);
                    const moduleData = this._getModuleData({moduleName, modulePath});
                    modules[moduleName] = moduleData;
                    extend(allTemplates, moduleData.templates);
                    extend(allInputs, moduleData.inputs);
                }

                return {modules, allTemplates, allInputs};
            });
    }

    /**
     * @param {object} data
     * @param {string} data.moduleName
     * @param {string} data.modulePath
     * @returns {{templates: object, inputs: object}}
     * @private
     */
    _getModuleData(data) {
        const moduleRcPath = path.join(data.modulePath, Constants.CONFIG_NAME);

        if (!fs.pathExistsSync(moduleRcPath)) {
            this.logger.warn(`Module '${data.moduleName}' has no '${Constants.CONFIG_NAME}'. Assuming it's empty.`);
            return {templates: {}, inputs: {}};
        }

        const moduleRammyrc = fs.readJsonSync(moduleRcPath);
        const augmentObject = (objectData, name) => {
            objectData.path = path.resolve(data.modulePath, objectData.path);
            objectData.name = name;
            objectData.moduleName = data.moduleName;
            objectData.modulePath = data.modulePath;
            return objectData;
        };
        if (moduleRammyrc.templates) _.mapObject(moduleRammyrc.templates, augmentObject);
        else moduleRammyrc.templates = {};
        if (moduleRammyrc.inputs) _.mapObject(moduleRammyrc.inputs, augmentObject);
        else moduleRammyrc.inputs = {};

        return {templates: moduleRammyrc.templates, inputs: moduleRammyrc.inputs};
    }

    /**
     * @param {object} data
     * @param {string} data.filePath Path to file that will be created
     * @param {string} data.template Name of the template to use
     * @returns {Promise<void>}
     */
    createFile(data) {
        const schema = {
            filePath: Joi.string().required(),
            template: Joi.string().required(),
        };

        let templateData;
        return Promise.resolve()
            .then(() => Util.validate(schema, data))
            .then(() => {
                if (fs.pathExistsSync(data.filePath)) throw new RammyError(`File already exists! Delete it and try again.`);
            })
            .then(() => this.getAllModuleData())
            .then(allModuleData => {
                const templateParts = data.template.split('/', 1);
                if (templateParts.length === 1) {
                    // Format: `<template-name>`
                    const templateName = templateParts[0];
                    templateData = allModuleData.allTemplates[templateName];
                } else {
                    // Format: `<module-name>/<template-name>`
                    const module = allModuleData.modules[templateParts[0]];
                    if (module) templateData = module.templates[templateParts[1]];
                }
                if (!templateData) throw new RammyError(`Could not resolve template name '${data.template}'!`);
            })
            .then(() => fs.readFile(templateData.path))
            .then(templateContents => {
                const varMap = {
                    MODULE_HOME: path.relative(path.dirname(data.filePath), templateData.modulePath),
                };
                const processVarMatch = varMatch => {
                    const _var = varMatch.replace(/%/g, '');
                    const value = varMap[_var];
                    if (value === undefined) {
                        this.logger.warn(`Unknown variable in template: ${varMatch}`);
                        return varMatch;
                    }
                    return value;
                };

                const templateString = templateContents.toString();
                const compiledTemplate = templateString.replace(/%[a-z_]+%/gi, processVarMatch);
                let prefix = `% Generated using Rammy v${packageData.version}, https://github.com/TimboKZ/Rammy\n`;
                prefix += `% Module: ${templateData.moduleName}\n`;
                prefix += `% Template: ${templateData.name}\n\n`;

                return fs.writeFile(data.filePath, `${prefix}${compiledTemplate}`);
            });
    }

    /**
     * @param {object} data
     * @param {string} data.filePath Absolute path to the TeX file that we want to compile
     * @returns {Promise<void>}
     */
    compile(data) {
        const schema = {
            filePath: Joi.string().required(),
        };
        return Promise.resolve()
            .then(() => Util.validate(schema, data))
            .then(() => new Promise((resolve, reject) => {
                const potentialCommands = [
                    {name: 'pdflatex', arguments: ''},
                    {name: 'latexmk', arguments: '-pdf'},
                ];
                let commandToUse;
                for (let command of potentialCommands) {
                    if (shell.which(command.name)) {
                        commandToUse = command;
                        break;
                    }
                }
                if (!commandToUse) {
                    const supportedCommandNames = _.map(potentialCommands, command => command.name);
                    return reject(new RammyError(`Couldn't find a supported program to compile the file with. Install one of these: ${supportedCommandNames.join(', ')}`));
                }

                const compileResult = shell.exec(`${commandToUse.name} ${commandToUse.arguments} ${data.filePath}`, {silent: true});
                if (compileResult.code !== 0) {
                    return reject(new RammyError(`Couldn't compile the file using '${commandToUse.name}'!`));
                }

                resolve();
            }));
    }

    /**
     * @param {object} data
     * @param {string} [data.directory] Absolute path to directory to clean
     * @param {string} [data.filePath] Absolute path to a `.tex` file
     * @returns {Promise<void>}
     */
    clean(data) {
        const schema = Joi.object().keys({
            directory: Joi.string(),
            filePath: Joi.string(),
        }).or('directory', 'filePath');

        return Promise.resolve()
            .then(() => Util.validateFull(schema, data))
            .then(() => {
                // Single file, can just clean around it directly
                if (data.filePath) return this._cleanAroundTexFile({filePath: data.filePath});

                // Iterate through files in current directory and clean around them
                return Promise.resolve()
                    .then(() => fs.readdir(data.directory))
                    .then(files => {
                        const promises = [];
                        for (let file of files) {
                            if (!file.endsWith('.tex')) continue;
                            const filePath = path.join(data.directory, file);
                            promises.push(this._cleanAroundTexFile({filePath}));
                        }
                        return Promise.all(promises);
                    });
            });
    }

    /**
     * @param {object} data
     * @param {string} data.filePath Absolute path to a `.tex` file
     * @private
     */
    _cleanAroundTexFile(data) {
        const pathData = path.parse(data.filePath);
        if (pathData.ext !== '.tex') throw new RammyError(`'${pathData.base}' isn't a TeX file!`);

        const extensionsToClean = [
            '.aux',
            '.fdb_latexmk',
            '.fls',
            '.log',
            '.out',
        ];
        const promises = new Array(extensionsToClean.length);
        for (let i = 0; i < extensionsToClean.length; i++) {
            const ext = extensionsToClean[i];
            const filePath = path.join(pathData.dir, `${pathData.name}${ext}`);
            promises[i] = Promise.resolve()
                .then(() => fs.pathExists(filePath))
                .then(fileExists => fileExists ? fs.unlink(filePath) : null);

        }
        return Promise.all(promises);
    }

}

module.exports = Rammy;
