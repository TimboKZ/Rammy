/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2018
 * @license GPL-3.0
 */

const Promise = require('bluebird');
const extend = require('extend');
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
     * @private
     * @returns {Promise<object>}
     */
    _readRammyrc() {
        if (!this.rammyrcPath) throw new RammyError('`.rammyrc.json` was not found!', ErrorCodes.MissingRammyrc);
        return fs.readJson(this.rammyrcPath);
    }

    /**
     * @private
     * @param {object} content
     * @param {string} [_path]
     * @returns {Promise<void>}
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
     * @param {string} data.module GitHub repository or path to module
     * @returns {Promise<void>}
     */
    addModule(data) {
        const schema = {
            module: Joi.string().required(),
        };
        return Promise.resolve()
            .then(() => Util.validate(schema, data))
            .then(() => this._readRammyrc())
            .then(rammyrc => {
                const moduleName = path.basename(data.module);
                const pathToModule = path.resolve(data.module);
                if (!fs.pathExistsSync(pathToModule)) {
                    throw new RammyError('That path does not exist!', ErrorCodes.ModuleNotExists);
                }

                const relativePath = path.relative(path.dirname(this.rammyrcPath), pathToModule);
                if (rammyrc.modules[moduleName]) this.logger.warn('Module already defined - overwriting.');
                rammyrc.modules[moduleName] = `./${relativePath}`;
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
     * @private
     * @param {object} data
     * @param {string} data.moduleName
     * @param {string} data.modulePath
     * @returns {{templates: object, inputs: object}}
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

}

module.exports = Rammy;
