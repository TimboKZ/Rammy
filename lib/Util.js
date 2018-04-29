/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2018
 * @license GPL-3.0
 */

const fs = require('fs-extra');
const upath = require('upath');
const Joi = require('joi');

const packageData = require('../package.json');
const Constants = require('./Constants');

/**
 * @enum {number}
 */
const ErrorCode = {
    Unknown: 0,
    MissingRammyrc: 1,
    ModuleNotExists: 2,
    InvalidComponentName: 3,
    FileExists: 4,
    ModuleNotFound: 5,
    MissingModuleFolder: 6,
};

class RammyError extends Error {

    /**
     * @param {string} message
     * @param {ErrorCode} code
     */
    constructor(message, code = ErrorCode.Unknown) {
        super(message);
        this.code = code;
        let comment;
        switch (this.code) {
            case ErrorCode.MissingRammyrc:
                comment = `Did you initialise a Rammy project? 'rammy init'`;
                break;
            case ErrorCode.ModuleNotExists:
                comment = `Did you spell the folder name correctly?`;
                break;
            case ErrorCode.InvalidComponentName:
                comment = `Names can be either 'module/component' or 'component'.`;
                break;
            case ErrorCode.FileExists:
                comment = `You can delete the file and try again.`;
                break;
            case ErrorCode.ModuleNotFound:
                comment = `Did you add the module using 'rammy add'?`;
                break;
            case ErrorCode.MissingModuleFolder:
                comment = `Does config contain the right module path? Try adding the module again.`;
                break;
            default:
            // Do nothing if we don't recognise the error code.
        }
        this.comment = comment;
    }

}

class Util {

    /**
     * @returns {string}
     */
    static getPackageVersion() {
        return packageData.version;
    }

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
                if (fileName.startsWith(Constants.ConfigFileName) && fileName === Constants.ConfigFileName) {
                    // Config found, can return
                    return upath.join(currPath, fileName);
                }
            }

            const newPath = upath.resolve(currPath, '..');
            if (newPath === currPath) break;
            currPath = newPath;
        }

        return undefined;
    }

    /**
     * Checks that a flag is true. If it isn't, throws the specified error.
     *
     * @param {boolean} flag
     * @param {Error} errorToThrow
     */
    static verify(flag, errorToThrow) {
        if (!flag) throw errorToThrow;
    }

    /**
     * Used to validate configs (or any objects for that matter) using a Joi schema.
     *
     * @see https://github.com/hapijs/joi
     * @param {SchemaMap|object} schema
     * @param {object} object
     * @param {string} label
     * @return {object}
     */
    static validate(schema, object, label = 'data') {
        const fullSchema = Joi.object().required().keys(schema);
        return Util.validateFull(fullSchema, object, label);
    }

    /**
     * Same as `validate()` but takes a full Joi schema object (except for `.label()` part). This is useful if you want
     * to specify a fancy custom schema.
     *
     * @param {object} fullSchema
     * @param {object} object
     * @param {string} label
     * @returns {object}
     */
    static validateFull(fullSchema, object, label = 'data') {
        const schemaObject = label ? fullSchema.label(label) : fullSchema;
        const result = Joi.validate(object, schemaObject);
        if (result.error) {
            let errorString = result.error.details.map(detail => detail.message).join(', ');
            throw new RammyError(`Input validation error: ${errorString}.`);
        }
        return result.value;
    }

    /**
     * Checks if the supplied string is a component name. Component names can be either:
     *     1. Template/snippet names on their own, e.g. `latex-common`
     *     2. Module and template/snippet names separated with a slash, e.g. `TimboKZ/latex-common`
     *
     * @param {string} string
     * @returns {boolean}
     */
    static isComponentName(string) {
        return Constants.ComponentNameRegex.test(string);
    }

    /**
     * Decomposes component names into parts.
     *
     * @param {string} componentName
     * @param {ComponentType} componentType
     * @returns {{module?: string, template?: string, snippet?: string}}
     */
    static parseComponentName(componentName, componentType) {
        if (!Util.isComponentName(componentName))
            throw new RammyError(`'${componentName}' is not a valid ${componentType} name!`, ErrorCode.InvalidComponentName);

        const parts = componentName.split('/');
        return {
            module: parts.length === 2 ? parts[0] : null,
            [componentType]: parts[parts.length - 1],
        };
    }

}

module.exports = Util;
module.exports.Util = Util;
module.exports.RammyError = RammyError;
module.exports.ErrorCode = ErrorCode;
