/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2018
 * @license GPL-3.0
 */

const fs = require('fs-extra');
const path = require('path');
const Joi = require('joi');

const Constants = require('./Constants');

class Util {

    /**
     * Discovers the config by going *upwards* starting from the current directory. If the config is not found, doesn't
     * return anything.
     *
     * @param {string} basePath
     * @param {int} depth
     * @returns {string|void}
     */
    static discoverRammyrc(basePath, depth = 6) {
        let currPath = basePath;
        for (let i = 0; i < depth; i++) {
            const files = fs.readdirSync(currPath);
            for (let fileName of files) {
                if (fileName.startsWith(Constants.CONFIG_NAME) && fileName === Constants.CONFIG_NAME) {
                    // Config found, can return
                    return path.join(currPath, fileName);
                }
            }

            const newPath = path.resolve(currPath, '..');
            if (newPath === currPath) break;
            currPath = newPath;
        }

        return undefined;
    }

    /**
     * Used to validate configs (or any objects for that matter) using a Joi schema.
     *
     * @see https://github.com/hapijs/joi
     * @param {object} schema
     * @param {object} object
     * @param {string} label
     * @return {object}
     */
    static validate(schema, object, label = 'data') {
        let schemaObject = Joi.object().required().keys(schema).label(label);
        const result = Joi.validate(object, schemaObject);
        if (result.error) {
            let errorString = result.error.details.map(detail => detail.message).join(', ');
            throw new Error(`Validation error: ${errorString}.`);
        }
        return result.value;
    }

}

module.exports = Util;
