/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2018
 * @license GPL-3.0
 */

const {Util, RammyError, ErrorCode} = require('./Util');
const readline = require('readline');
const Promise = require('bluebird');
const fs = require('fs-extra');
const path = require('path');

const Constants = require('./Constants');

class TexFileManager {

    /**
     *
     * @param {object} data
     * @param {Logger} data.logger
     * @param {Config} data.config
     */
    constructor(data) {
        this.logger = data.logger;
        this.config = data.config;
    }

    /**
     *
     * @param {object} data
     * @param {string} data.filePath Absolute path to file that we want to create
     * @param {string} data.template Valid template name or path to
     * @return {Promise<void>}
     */
    createFileFromTemplate(data) {
        /** @var {{modules: Object<string, ModuleData>, allTemplates: Object<string, TemplateData>, allSnippets: Object<string, InputData}} */
        let allModuleData;
        /** @var {TemplateData} */
        let templateData;
        return Promise.resolve()
            .then(() => {
                if (fs.pathExistsSync(data.filePath))
                    throw new RammyError(`Target file already exists!`, ErrorCode.FileExists);
            })

            .then(() => this.config.getAllModuleData())
            .then(_allModuleData => allModuleData = _allModuleData)

            // Resolve path to the template and generate template data
            .then(() => {
                if (Util.isComponentName(data.template)) {
                    const templateName = Util.parseTemplateName(data.template);
                    let templateData;
                    if (templateName.module) {
                        const module = allModuleData.modules[templateName.module];
                        if (module) templateData = module.templates[templateName.template];
                    } else {
                        templateData = allModuleData.allTemplates[templateName.template];
                    }

                    if (!templateData) throw new RammyError(`Couldn't find this template in the config: '${data.template}'`);
                    // If we have a valid template, return full template data.
                    return templateData;
                } else if (data.template.endsWith('.tex')) {
                    // If we have a .tex file, return partial template data.
                    return {absPath: path.resolve(data.template)};
                }
                throw new RammyError(`The supplied template string isn't a valid template name nor a path to a .tex file: '${data.template}'`);
            })
            .then(_templateData => templateData = _templateData)

            // Render template and write it out
            .then(() => this.renderTemplateToString({templateData, targetFilePath: data.filePath}))
            .then(renderedTemplate => fs.writeFile(data.filePath, renderedTemplate));

    }

    /**
     * @param {object} data
     * @param {TemplateData} data.templateData
     * @param {string} data.targetFilePath
     * @returns {Promise<string>}
     */
    renderTemplateToString(data) {
        return new Promise((resolve, reject) => {
            try {
                const templateReader = readline.createInterface({input: fs.createReadStream(data.templateData.absPath)});
                let output = '';
                output += `%-- Generated using Rammy v${Util.getPackageVersion()} | github.com/TimboKZ/Rammy\n`;
                output += `%-- Module: ${data.templateData.module.name}\n`;
                output += `%-- Template: ${data.templateData.name}\n\n`;

                let inRammyRegion = false;
                let lineNumber = 1;
                templateReader.on('line', line => {
                    // Reminder, `line` does NOT have a trailing `\n`

                    if (line.startsWith(Constants.RammyRegion.End)) {
                        if (!inRammyRegion) this.logger.warn(`Rammy region in the template end before starting - check line ${lineNumber}.`);
                        inRammyRegion = false;
                    }

                    let processedLine;
                    if (inRammyRegion) processedLine = this.renderTemplateLine({
                        templateData: data.templateData,
                        targetFilePath: data.targetFilePath,
                        line,
                        lineNumber,
                    });
                    else processedLine = line;
                    output += `${processedLine}\n`;

                    if (line.startsWith(Constants.RammyRegion.Start)) {
                        if (inRammyRegion) this.logger.warn(`Rammy region in the template starts twice in a row - check line ${lineNumber}.`);
                        inRammyRegion = true;
                    }

                    lineNumber++;
                });

                // TODO: Note sure what `readline` does if reading fails halfway through, do we need to handle this case
                // TODO: explicitly?
                templateReader.on('close', () => {
                    if (inRammyRegion) this.logger.warn(`Rammy region in the template never ends - did the developer forget to close it?`);
                    resolve(output);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * @param {object} data
     * @param {TemplateData} data.templateData
     * @param {string} data.targetFilePath Target template path
     * @param {string} data.line
     * @param {number} data.lineNumber
     * @returns {string}
     */
    renderTemplateLine(data) {
        if (!data.templateData.module) {
            this.logger.warn(`It looks like the template doesn't come from any module - ignoring special comments on line ${data.lineNumber}.`);
            return data.line;
        }

        if (!this._inputLineRegex) {
            // Matches (with arbitrary spaces):   \input{<path>} % <type>: <value><trailing>
            this._inputLineRegex = /^\s*\\input{([^}]*)}\s*%--\s*([a-zA-Z0-9\-_]+):\s*([a-zA-Z0-9\-_]+)(.*)/gi;
        }

        const targetFileDir = path.dirname(data.targetFilePath);
        let line = data.line;

        let doReplace = true;
        const newLine = line.replace(this._inputLineRegex, (fullMatch, inputPath, type, value, trailing) => {
            let pathToRender = inputPath;

            if (['snippet', 'template'].includes(type)) {

                const component = data.templateData.module[`${type}s`][value];
                if (component) {
                    pathToRender = path.relative(targetFileDir, component.absPath);
                } else {
                    this.logger.warn(`Couldn't resolve ${type} name '${value}' on line ${data.lineNumber} - ignoring this line of template.`);
                    doReplace = false;
                    return;
                }

            } else if (type === 'path') {

                switch (value) {
                    case 'module-relative':
                        pathToRender = path.relative(targetFileDir, path.resolve(data.templateData.module.absPath, inputPath));
                        break;
                    case 'file-relative':
                        const absoluteInputPath = path.resolve(path.dirname(data.templateData.absPath), inputPath);
                        pathToRender = path.relative(targetFileDir, absoluteInputPath);
                        break;
                    case 'absolute':
                        pathToRender = inputPath;
                        break;
                    default:
                        this.logger.warn(`Unknown path type '${value}' on line ${data.lineNumber} - ignoring this line of template.`);
                        doReplace = false;
                        return;
                }

            } else {
                this.logger.warn(`Unknown type '${type}' on line ${data.lineNumber} - ignoring this line of template.`);
                doReplace = false;
                return;
            }

            let trimmedTrailing = trailing.trim();
            if (trimmedTrailing) trimmedTrailing = ` ${trimmedTrailing}`;

            // TODO: Instead of re-rendering the same type/value, we can render something useful like module name and
            // TODO: path within the module or component name. This will make it easier to do maintenance of
            // TODO: generated files.

            return `\\input{${pathToRender}} %-- ${type}: ${value}${trimmedTrailing}`;
        });

        return doReplace ? newLine : line;
    }

}

module.exports = TexFileManager;
