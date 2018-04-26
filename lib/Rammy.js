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
const Util = require('./Util');

class Rammy {

    constructor(data) {

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
            .then(() => path.join(data.directory, '.rammyrc.json'))
            .then(pathToConfig => fs.writeJson(pathToConfig, defaultConfig, {spaces: 2}));
    }

}

module.exports = Rammy;
