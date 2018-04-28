/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2018
 * @license GPL-3.0
 */

const Promise = require('bluebird');
const upath = require('upath');
const fs = require('fs-extra');

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
     *
     * @param {object} data
     * @param {string} data.filePath Absolute path to file that we want to create
     * @param {string} data.template Valid template name or path to
     * @return {Promise<void>}
     */
    createFileFromTemplate(data) {
        /** @var {{modules: Object<string, ModuleData>, allTemplates: Object<string, TemplateData>, allSnippets: Object<string, SnippetData}} */
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
            .then(() => this.parseComponentInput({
                componentInput: data.template,
                componentType: Constants.ComponentType.Template,
            }))
            .then(_templateData => templateData = _templateData)

            // Render template and write it out
            .then(() => this.templateManager.renderTemplateToString({templateData, targetFilePath: data.filePath}))
            .then(renderedTemplate => fs.writeFile(data.filePath, renderedTemplate));
    }


    /**
     * @param {object} data
     * @param {string} data.filePath Path to file that the snippet will be added to.
     * @param {string} data.snippet Snippet name or path to a `.tex` file.
     * @returns {Promise<void>}
     */
    addSnippetToFile(data) {
        /** @var {{modules: Object<string, ModuleData>, allTemplates: Object<string, TemplateData>, allSnippets: Object<string, SnippetData}} */
        let allModuleData;
        /** @var {SnippetData} */
        let snippetData;
        return Promise.resolve()
            .then(() => {
                if (!fs.pathExistsSync(data.filePath))
                    throw new RammyError(`Target file does not exist!`);
            })

            .then(() => this.config.getAllModuleData())
            .then(_allModuleData => allModuleData = _allModuleData)

            // Resolve path to the template and generate template data
            .then(() => this.parseComponentInput({
                componentInput: data.snippet,
                componentType: Constants.ComponentType.Snippet,
            }))
            .then(_snippetData => snippetData = _snippetData)

            // Re-render the file adding a snippet and write out.
            .then(() => this.templateManager.rerenderToStringAddingSnippet({snippetData, sourceFilePath: data.filePath}))
            .then(rerenderedFile => fs.writeFile(data.filePath, rerenderedFile));
    }

    /**
     *
     * @param {object} data
     * @param {string} data.componentInput Either a name of a component or a TeX file
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
                    return {absPath: upath.resolve(data.componentInput)};
                }
                throw new RammyError(`The supplied string isn't a valid ${data.componentType} name nor a path to a .tex file: '${data.componentInput}'`);
            });
    }

}

module.exports = TexFileManager;
