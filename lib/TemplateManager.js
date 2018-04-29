/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2018
 * @license GPL-3.0
 */

const readline = require('readline');
const upath = require('upath');
const fs = require('fs-extra');
const os = require('os');

const {Util, RammyError} = require('./Util');
const Constants = require('./Constants');

class TemplateManager {

    /**
     * @param {object} data
     * @param {Logger} data.logger
     */
    constructor(data) {
        this.logger = data.logger;
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
                let output = '';
                output += `%-- Generated using Rammy v${Util.getPackageVersion()} | github.com/TimboKZ/Rammy${os.EOL}`;
                output += `%-- Module: ${data.templateData.module.name}${os.EOL}`;
                output += `%-- Template: ${data.templateData.name}${os.EOL}${os.EOL}`;

                let inRammyRegion = false;
                let lineNumber = 1;
                const templateReader = readline.createInterface({input: fs.createReadStream(data.templateData.absPath)});
                templateReader.on('line', line => {

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
                    output += `${processedLine}${os.EOL}`;

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

        const targetFileDir = upath.dirname(data.targetFilePath);
        let line = data.line;

        let customTypeValuePair;
        let doReplace = true;
        const newLine = line.replace(this._inputLineRegex, (fullMatch, inputPath, type, value, trailing) => {
            let pathToRender = inputPath;

            if ([Constants.ComponentType.Snippet, Constants.ComponentType.Template].includes(type)) {

                let collection;
                const module = data.templateData.module;
                if (type === Constants.ComponentType.Snippet) collection = module.snippets;
                else if (type === Constants.ComponentType.Template) collection = module.templates;
                else throw new Error(`Unrecognized component type: '${type}'`);

                const component = collection[value];
                if (component) {
                    pathToRender = upath.relative(targetFileDir, component.absPath);
                    customTypeValuePair = `module-${type}: ${module.name}/${component.name}`;
                } else {
                    this.logger.warn(`Couldn't resolve ${type} name '${value}' on line ${data.lineNumber} - ignoring this line of template.`);
                    doReplace = false;
                    return;
                }

            } else if (type === 'path') {
                let absoluteInputPath;
                switch (value) {
                    case 'module-relative':
                        pathToRender = upath.relative(targetFileDir, upath.resolve(data.templateData.module.absPath, inputPath));
                        break;
                    case 'file-relative':
                        absoluteInputPath = upath.resolve(upath.dirname(data.templateData.absPath), inputPath);
                        pathToRender = upath.relative(targetFileDir, absoluteInputPath);
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

            if (customTypeValuePair) return `\\input{${pathToRender}} %-- ${customTypeValuePair}${trimmedTrailing}`;
            return `\\input{${pathToRender}} %-- ${type}: ${value}${trimmedTrailing}`;
        });

        return doReplace ? newLine : line;
    }

    /**
     * @param {object} data
     * @param {SnippetData} data.snippetData
     * @param {string} data.sourceFilePath Absolute path to file that we want to re-render
     */
    rerenderToStringAddingSnippet(data) {
        return new Promise((resolve, reject) => {
            try {
                // Figure out what line we want to add.
                const resolvedPath = upath.relative(upath.dirname(data.sourceFilePath), data.snippetData.absPath);
                let lineToAdd = `\\input{${resolvedPath}}`;
                if (data.snippetData.module && data.snippetData.name)
                    lineToAdd += ` %-- module-snippet: ${data.snippetData.module.name}/${data.snippetData.name}`;
                lineToAdd += `${os.EOL}`;

                // Find where to append that line. The logic is as follows:
                //
                //     1. Look for the first valid Rammy region - with correct opening and closing comments. When found,
                //        append the line right before the closing comment.
                //     2. If during (1) we find a Rammy region that has an opening comment but no closing comment, we
                //        append the new snippet in the beginning (and show a warning).
                //     3. If the file doesn't have a Rammy region, we initialise a Rammy region right before the
                //        `\begin{document}` command and add the line there.
                //     4. If we can't find `\begin{document}`, we initialise a Rammy region right after the
                //        `\documentclass{...}` command.
                //
                // If none of the above work, we just error out.
                const sectionType = {
                    AfterDocClass: 1,
                    AfterRammyRegionStart: 3,
                    BeforeRammyRegionEnd: 4,
                    BeforeDocBegin: 2,
                };
                let currentTarget = 0;
                let targetLine = 0;

                // Commence first run, to discover best place for the snippet
                let lineNumber = 1;
                let inRammyRegion = false;
                const firstRunReader = readline.createInterface({input: fs.createReadStream(data.sourceFilePath)});
                firstRunReader.on('line', line => {

                    if (currentTarget < sectionType.AfterDocClass && line.startsWith('\\documentclass{')) {
                        currentTarget = sectionType.AfterDocClass;
                        targetLine = lineNumber + 1;
                    } else if (currentTarget < sectionType.AfterRammyRegionStart && line.startsWith(Constants.RammyRegion.Start)) {
                        currentTarget = sectionType.AfterRammyRegionStart;
                        inRammyRegion = true;
                        targetLine = lineNumber + 1;
                    } else if (currentTarget < sectionType.BeforeRammyRegionEnd && inRammyRegion && line.startsWith(Constants.RammyRegion.End)) {
                        currentTarget = sectionType.BeforeRammyRegionEnd;
                        inRammyRegion = false;
                        targetLine = lineNumber;
                    } else if (currentTarget < sectionType.BeforeDocBegin && line.startsWith('\\begin{document}')) {
                        currentTarget = sectionType.BeforeDocBegin;
                        targetLine = lineNumber;
                    }

                    lineNumber++;
                });
                firstRunReader.on('close', () => {
                    if (!currentTarget) return reject(new RammyError(`Couldn't find a single place to add the snippet! Is your TeX file malformed?`));
                    if (inRammyRegion) this.logger.warn(`Rammy region in the template never ends - did the developer forget to close it?`);

                    // Commence second and final run, adding the snippet
                    let output = '';
                    lineNumber = 1;
                    const finalRunReader = readline.createInterface({input: fs.createReadStream(data.sourceFilePath)});
                    finalRunReader.on('line', line => {
                        if (lineNumber === targetLine) {
                            // If we have one of these sections, we need to create a new Rammy region.
                            if ([sectionType.BeforeDocBegin, sectionType.AfterDocClass].includes(currentTarget)) {
                                lineToAdd = `${os.EOL}${Constants.RammyRegion.StartFull}${os.EOL}${lineToAdd}${Constants.RammyRegion.EndFull}${os.EOL}${os.EOL}`;
                            }

                            output += `${lineToAdd}${line}${os.EOL}`;
                        } else {
                            output += `${line}${os.EOL}`;
                        }
                        lineNumber++;
                    });
                    finalRunReader.on('close', () => {
                        resolve(output);
                    });
                });


            } catch (error) {
                reject(error);
            }
        });
    }

}

module.exports = TemplateManager;
