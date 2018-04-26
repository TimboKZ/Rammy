/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2018
 * @license GPL-3.0
 */

const Promise = require('bluebird');
const fs = require('fs-extra');
const path = require('path');
const Joi = require('joi');

const packageData = require('../package.json');
const Constants = require('./Constants');
const Util = require('./Util');

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
     */
    readRammyrc() {
        if (!this.rammyrcPath) return Promise.reject(new Error('`.rammyrc.json` was not found!'));
        return fs.readJson(this.rammyrcPath);
    }

    /**
     * @param {object} content
     * @param {string} [_path]
     * @returns {Promise<void>}
     */
    writeRammyrc(content, _path = this.rammyrcPath) {
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
        return Promise.resolve()
            .then(() => Util.validate(schema, data))
            .then(() => path.join(data.directory, Constants.CONFIG_NAME))
            .then(pathToConfig => this.writeRammyrc(defaultConfig, pathToConfig));
    }

    /**
     *
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
            .then(() => this.readRammyrc())
            .then(rammyrc => {
                const moduleName = path.basename(data.module);
                const pathToModule = path.resolve(data.module);
                const relativePath = path.relative(path.dirname(this.rammyrcPath), pathToModule);
                rammyrc.modules[moduleName] = `./${relativePath}`;
                return this.writeRammyrc(rammyrc);
            });
    }

}

module.exports = Rammy;
