/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2018
 * @license GPL-3.0
 */

const Joi = require('joi');

class Util {

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
