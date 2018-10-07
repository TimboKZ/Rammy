/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2018
 * @license GPL-3.0
 */

const Promise = require('bluebird');
const extend = require('extend');
const _ = require('underscore');
const fs = require('fs-extra');
const path = require('upath');

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

        // This should remain null until the config has been successfully loaded - can be used as an indicator.
        this.configData = null;

        this._moduleDataCache = {};
    }

    /**
     * @param {boolean} force Force config file reload - otherwise cache can be used
     * @returns {Bluebird<void>}
     */
    load(force = false) {
        if (!this.rammyrcPath) throw new RammyError(`'${Constants.ConfigFileName}' is not available!`, ErrorCode.MissingRammyrc);

        return Promise.resolve()
            .then(() => {
                if (!force && this.configData) return this.configData;
                return fs.readJson(this.rammyrcPath);
            })
            .then(configData => {
                this.configData = configData;
                this.rammyrcDir = path.dirname(this.rammyrcPath);
            });
    }

    /**
     * @param {object} data
     * @param {string} data.filePath Absolute path to file in which config will be written
     * @returns {Promise<void>}
     */
    initProjectConfig(data) {
        return Promise.resolve()
            .then(() => fs.pathExists(data.filePath))
            .then(configExists => Util.stop(configExists, `'${Constants.ConfigFileName}' already exists.`))
            .then(() => {
                const projectConfig = {
                    rammyVersion: Util.getPackageVersion(),
                    modules: {},
                };
                return fs.writeJson(data.filePath, projectConfig, {spaces: 2});
            });
    }

    /**
     * @param {object} data
     * @param {string} data.filePath Absolute path to file in which config will be written
     * @param {string} data.moduleName
     * @returns {Promise<void>}
     */
    initModuleConfig(data) {
        return Promise.resolve()
            .then(() => fs.pathExists(data.filePath))
            .then(configExists => Util.stop(configExists, `'${Constants.ConfigFileName}' already exists.`))
            .then(() => {
                const moduleConfig = {
                    rammyVersion: Util.getPackageVersion(),
                    name: data.moduleName,
                    module: true,
                    templates: {},
                    snippets: {},
                };
                return fs.writeJson(data.filePath, moduleConfig, {spaces: 2});
            });
    }

    /**
     * Writes out config data to the config file
     *
     * @returns {Promise<void>}
     */
    writeOut() {
        return Promise.resolve()
            .then(() => fs.writeJson(this.rammyrcPath, this.configData, {spaces: 2}));
    }

    /**
     * Adds a module to the config and persists the changes.
     *
     * @param {object} data
     * @param {string} data.moduleName Name of the module
     * @param {string} data.modulePath Absolute path to module directory
     */
    addModule(data) {
        return Promise.resolve()
            .then(() => this.load())
            .then(() => {
                if (!this.configData.modules) this.configData.modules = {};
                if (this.configData.modules[data.moduleName]) this.logger.warn(`Module '${data.moduleName}' already defined - overwriting.`);
                this.configData.modules[data.moduleName] = path.relative(this.rammyrcDir, data.modulePath);

                return this.writeOut();
            });
    }

    /**
     * Removes module from the config and persists the changes.
     *
     * @param {object} data
     * @param {string} data.moduleName Name of the module
     */
    removeModule(data) {
        return Promise.resolve()
            .then(() => this.load())
            .then(() => {
                if (!this.configData.modules || !this.configData.modules[data.moduleName]) {
                    this.logger.warn(`Module '${data.moduleName}' was not defined.`);
                    return;
                }

                delete this.configData.modules[data.moduleName];
                return this.writeOut();
            });
    }

    /**
     * @param {object} [data]
     * @param {boolean} [data.force] Ignore cache, load anyway
     * @returns {Promise<{modules: Object<string, ModuleData>, allTemplates: Object<string, TemplateData>, allSnippets: Object<string, SnippetData}>}
     */
    getAllModuleData(data) {
        if (data && !data.force && this._allModuleDataCache) return Promise.resolve(this._allModuleDataCache);

        return Promise.resolve()
            .then(() => this.load())
            .then(() => {
                const modules = this.configData.modules ? this.configData.modules : {};
                const moduleNames = Object.keys(modules);
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
                const allSnippets = {};
                for (const module of allModules) {
                    modules[module.name] = module;
                    extend(allTemplates, module.templates);
                    extend(allSnippets, module.snippets);
                }
                const allModuleData = {modules, allTemplates, allSnippets};
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
            snippets: {},
        };
        let moduleConfigPath;
        return Promise.resolve()
            .then(() => this.load())
            .then(() => {
                const modulePath = this.configData.modules[moduleData.name];
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
                moduleData.snippets = _.mapObject(moduleConfig.snippets, (data, name) => Config._processConfigComponent({
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
