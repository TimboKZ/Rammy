/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2018
 * @license GPL-3.0
 */

/**
 * @typedef {object} ModuleData
 * @property {string} name
 * @property {string} absPath Absolute path to module.
 * @property {Object<string, TemplateData>} templates
 * @property {Object<string, SnippetData>} snippets
 */

/**
 * @typedef {object} ComponentData
 * @property {string} [name]
 * @property {string} absPath
 * @property {string} [description]
 * @property {ModuleData} [module]
 */

/**
 * @typedef {ComponentData} TemplateData
 */

/**
 * @typedef {ComponentData} SnippetData
 */
