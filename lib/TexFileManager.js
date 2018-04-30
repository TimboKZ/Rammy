/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2018
 * @license GPL-3.0
 */

const Promise = require('bluebird');
const fs = require('fs-extra');
const path = require('upath');

const {Util, RammyError, ErrorCode} = require('./Util');
const TemplateManager = require('./TemplateManager');
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
        this.templateManager = new TemplateManager({logger: this.logger});
    }

    /**
     * Prepares a trie of auxiliary file extensions, in reverse order (since extensions will be checked from the end of
     * the file).
     */
    prepareAuxFileTrie() {
        if (this.auxFileTrie) return;
        this.auxFileTrie = {};
        for (const auxExt of Constants.AuxExtensions) {
            let currObject = this.auxFileTrie;
            for (let i = 0; i < auxExt.length; i++) {
                const char = auxExt.charAt(auxExt.length - 1 - i);
                let object;
                if (currObject[char]) {
                    object = currObject[char];
                } else {
                    object = {};
                    currObject[char] = object;
                }
                currObject = object;
            }
            currObject.FINAL = true;
        }
    }

    /**
     * Checks if the specified file is a TeX auxiliary file using its extensions.
     */
    isAuxFile(fileName) {
        this.prepareAuxFileTrie();
        let object = this.auxFileTrie;
        for (let i = 0; i < fileName.length; i++) {
            const char = fileName.charAt(fileName.length - 1 - i);
            let next = object[char];
            if (!next) return false;
            if (next.FINAL) return true;
            object = next;
        }
        return false;
    }

    /**
     *
     * @param {object} data
     * @param {string} data.filePath Absolute path to file that we want to create
     * @param {string} data.template Valid template name or path to
     * @return {Promise<void>}
     */
    createFileFromTemplate(data) {
        /** @var {TemplateData} */
        return Promise.resolve()
            .then(() => {
                if (fs.pathExistsSync(data.filePath))
                    throw new RammyError(`Target file already exists!`, ErrorCode.FileExists);
            })
            .then(() => this.parseComponentInput({
                componentInput: data.template,
                componentType: Constants.ComponentType.Template,
            }))
            .then(templateData => this.templateManager.renderTemplate({templateData, targetFilePath: data.filePath}))
            .then(renderedTemplate => fs.writeFile(data.filePath, renderedTemplate));
    }


    /**
     * @param {object} data
     * @param {string} data.filePath Absolute path to file that the snippet will be added to.
     * @param {string} data.snippet Snippet name or path to a `.tex` file.
     * @returns {Promise<void>}
     */
    addSnippetToFile(data) {
        /** @var {SnippetData} */
        let snippetData;
        return Promise.resolve()
            .then(() => fs.pathExists(data.filePath))
            .then(fileExists => Util.verify(fileExists, `Target file does not exist!`))

            // Resolve path to the template and generate template data
            .then(() => this.parseComponentInput({
                componentInput: data.snippet,
                componentType: Constants.ComponentType.Snippet,
            }))
            .then(_snippetData => snippetData = _snippetData)

            // Re-render the file adding a snippet and write out.
            .then(() => this.templateManager.renderAddingSnippet({snippetData, sourceFilePath: data.filePath}))
            .then(renderedFile => fs.writeFile(data.filePath, renderedFile));
    }

    /**
     *
     * @param {object} data
     * @param {string} data.componentInput Either a name of a component or a path to a TeX file
     * @param {ComponentType} data.componentType
     * @returns {Promise<ComponentData>}
     */
    parseComponentInput(data) {
        return Promise.resolve()
            .then(() => this.config.getAllModuleData())
            .then(allModuleData => {
                if (Util.isComponentName(data.componentInput)) {
                    let collection;
                    let componentData;
                    const componentName = Util.parseComponentName(data.componentInput, data.componentType);

                    if (componentName.module) {
                        const module = allModuleData.modules[componentName.module];
                        if (data.componentType === Constants.ComponentType.Snippet) collection = module.snippets;
                        else if (data.componentType === Constants.ComponentType.Template) collection = module.templates;
                        else throw new Error(`Unrecognized component type: '${data.componentType}'`);

                        if (module) componentData = collection[componentName[data.componentType]];
                    } else {
                        if (data.componentType === Constants.ComponentType.Snippet) collection = allModuleData.allSnippets;
                        else if (data.componentType === Constants.ComponentType.Template) collection = allModuleData.allTemplates;
                        else throw new Error(`Unrecognized component type: '${data.componentType}'`);

                        componentData = collection[componentName[data.componentType]];
                    }

                    if (!componentData) throw new RammyError(`Couldn't find this ${data.componentType} in the config: '${data.componentInput}'`);
                    // If we have a valid template, return full template data.
                    return componentData;
                } else if (data.componentInput.endsWith('.tex')) {
                    // If we have a .tex file, return partial template data.
                    return {absPath: path.resolve(data.componentInput)};
                }
                throw new RammyError(`The supplied string isn't a valid ${data.componentType} name nor a path to a .tex file: '${data.componentInput}'`);
            });
    }

    /**
     * @param {object} data
     * @param {string} data.directory Absolute path to directory to clean
     * @returns {Promise<void>}
     */
    cleanDirectory(data) {
        return Promise.resolve()
            .then(() => fs.readdir(data.directory))
            .then(fileNames => {
                const promises = [];
                for (let fileName of fileNames) {
                    if (!this.isAuxFile(fileName)) continue;
                    promises.push(fs.remove(path.join(data.directory, fileName)));
                }
                return Promise.all(promises);
            });
    }

    /**
     * @param {object} data
     * @param {string} data.filePath Absolute path to a .tex file that we want to clean around
     * @returns {Promise<void>}
     */
    cleanAroundFile(data) {
        return Promise.resolve()
            .then(() => {
                const pathData = path.parse(data.filePath);
                Util.verify(pathData.ext === '.tex', `'${pathData.base}' isn't a TeX file!`);

                const count = Constants.AuxExtensions.length;
                const promises = new Array(count);
                for (let i = 0; i < count; i++) {
                    const ext = Constants.AuxExtensions[i];
                    const filePath = path.join(pathData.dir, `${pathData.name}${ext}`);
                    promises[i] = Promise.resolve()
                        .then(() => fs.pathExists(filePath))
                        .then(fileExists => fileExists ? fs.unlink(filePath) : null);
                }

                return Promise.all(promises);
            });
    }

}

module.exports = TexFileManager;
