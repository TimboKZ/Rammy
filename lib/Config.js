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

const {Util, RammyError, ErrorCode} = require('./Util');
const Constants = require('./Constants');

/**
 * Class that manages the Rammy config file and its state
 */
class Config {

    /**
     * @param {object} data
     * @param {Logger} data.logger
     * @param {string} [data.rammyrcPath] Absolute path to the config file
     */
    constructor(data) {
        this.logger = data.logger;
        this.rammyrcPath = data.rammyrcPath;
        this._configData = null;

        this._moduleDataCache = {};
    }

    /**
     * @param {boolean} force Force config file reload - otherwise cache can be used
     * @returns {Promise<void>}
     */
    load(force = false) {
        if (!this.rammyrcPath) throw new RammyError(`'${Constants.ConfigFileName}' is not available!`, ErrorCode.MissingRammyrc);

        return Promise.resolve()
            .then(() => {
                if (!force && this._configData) return this._configData;
                return fs.readJson(this.rammyrcPath);
            })
            .then(configData => {
                this._configData = configData;
                this.rammyrcDir = path.dirname(this.rammyrcPath);
            });
    }

    /**
     * @returns {null|object}
     */
    getContents() {
        return Promise.resolve()
            .then(() => this.load())
            .then(() => this._configData);
    }

    /**
     * @param {object} [data]
     * @param {boolean} [data.force] Ignore cache, load anyway
     * @returns {Promise<{modules: Object<string, ModuleData>, allTemplates: Object<string, TemplateData>, allInputs: Object<string, InputData}>}
     */
    getAllModuleData(data) {
        if (data && !data.force && this._allModuleDataCache) return Promise.resolve(this._allModuleDataCache);

        return Promise.resolve()
            .then(() => this.load())
            .then(() => {
                const moduleNames = Object.keys(this._configData.modules);
                const promises = new Array(moduleNames.length);
                for (let i = 0; i < moduleNames.length; i++) {
                    const moduleName = moduleNames[i];
                    promises[i] = this.getModuleData({moduleName});
                }
                return Promise.all(promises);
            })
            .then(allModules => {
                const modules = {};
                const allTemplates = {};
                const allInputs = {};
                for (const module of allModules) {
                    modules[module.name] = module;
                    extend(allTemplates, module.templates);
                    extend(allInputs, module.inputs);
                }
                const allModuleData = {modules, allTemplates, allInputs};
                this._allModuleDataCache = allModuleData;
                return allModuleData;
            });
    }

    /**
     *
     * @param {object} data
     * @param {string} data.moduleName
     * @param {boolean} [data.force] Ignore cached data
     * @returns {Promise<ModuleData>}
     */
    getModuleData(data) {
        if (!data.force && this._moduleDataCache[data.moduleName])
            return Promise.resolve(this._moduleDataCache[data.moduleName]);

        /** @type {ModuleData} */
        const moduleData = {
            name: data.moduleName,
            absPath: '',
            templates: {},
            inputs: {},
        };
        let moduleConfigPath;
        return Promise.resolve()
            .then(() => this.load())
            .then(() => {
                const modulePath = this._configData.modules[moduleData.name];
                if (modulePath === undefined)
                    throw new RammyError(`Module '${moduleData.name}' was not found!`, ErrorCode.ModuleNotFound);

                moduleData.absPath = path.resolve(this.rammyrcDir, modulePath);
                return fs.pathExists(moduleData.absPath);
            })
            .then(moduleFolderExists => {
                if (!moduleFolderExists)
                    throw new RammyError(`Folder of module '${moduleData.name}' was not found!`, ErrorCode.MissingModuleFolder);

                moduleConfigPath = path.join(moduleData.absPath, Constants.ConfigFileName);
                return fs.pathExists(moduleConfigPath)
                    .then(moduleConfigExists => moduleConfigExists ? fs.readJson(moduleConfigPath) : null);
            })
            .then(moduleConfig => {
                if (!moduleConfig) {
                    this.logger.warn(`Module '${moduleData.name}' has no '${Constants.ConfigFileName}'. Assuming it's empty.`);
                    return moduleData;
                }

                if (!moduleConfig.module)
                    this.logger.warn(`Module '${moduleData.name}' doesn't have the 'module' property specified in its config. Are you sure it's a Rammy module?`);
                if (moduleData.name !== moduleConfig.name)
                    this.logger.warn(`There is a name mismatch for module '${moduleData.name}' - your project config says '${moduleData.name}' while module config says '${moduleConfig.name}'`);

                moduleData.templates = _.mapObject(moduleConfig.templates, (data, name) => Config._processConfigComponent({
                    configComponentName: name,
                    configComponentData: data,
                    module: moduleData,
                }));
                moduleData.inputs = _.mapObject(moduleConfig.inputs, (data, name) => Config._processConfigComponent({
                    configComponentName: name,
                    configComponentData: data,
                    module: moduleData,
                }));

                this._moduleDataCache[moduleData.name] = moduleData;
                return moduleData;
            });
    }

    /**
     * Takes a raw component extracted from the config and augments it with useful information. Meant to be used with
     * underscore's `mapObject()` method.
     *
     * @param {object} data
     * @param {string} data.configComponentName
     * @param {object} data.configComponentData
     * @param {ModuleData} data.module
     * @returns {ComponentData}
     * @private
     */
    static _processConfigComponent(data) {
        return {
            name: data.configComponentName,
            absPath: path.resolve(data.module.absPath, data.configComponentData.path),
            description: data.configComponentData.description,
            module: data.module,
        };
    }

}

module.exports = Config;
