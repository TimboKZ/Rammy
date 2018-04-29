/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2018
 * @license GPL-3.0
 */


const git = require('simple-git/promise');
const Promise = require('bluebird');
const shell = require('shelljs');
const _ = require('underscore');
const path = require('upath');
const fs = require('fs-extra');
const Joi = require('joi');
const os = require('os');

const {Util, RammyError, ErrorCode} = require('./Util');
const TexFileManager = require('./TexFileManager');
const Constants = require('./Constants');
const Config = require('./Config');

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

        this.config = new Config({logger: this.logger, rammyrcPath: this.rammyrcPath});
        this.texFileManager = new TexFileManager({logger: this.logger, config: this.config});
    }

    /**
     * @param {object} data
     * @param {string} data.directory Absolute path to directory in which project will be initialised
     * @param {bool} data.initGit Determines whether a Git repo will be initialised
     * @returns {Promise<void>}
     */
    initProject(data) {
        const schema = {
            directory: Joi.string().required(),
            initGit: Joi.bool().optional(),
        };
        let configPath;
        return Promise.resolve()
            .then(() => Util.validate(schema, data))
            .then(() => configPath = path.join(data.directory, Constants.ConfigFileName))
            .then(() => fs.pathExists(configPath))
            .then(configExists => Util.stop(configExists, `'${Constants.ConfigFileName}' already exists.`))

            // Do Git initialisation
            .then(() => {
                if (!data.initGit) return;
                if (!shell.which('git')) throw new RammyError(`'git' command was not found! Install Git if you want to use the '--git' flag.`);

                // Init a Git repo if necessary
                const gitPromise = Promise.resolve()
                    .then(() => git(data.directory).checkIsRepo())
                    .then(isRepo => {
                        if (isRepo) {
                            this.logger.warn(`Directory is already a Git repository - no need for 'git init'.`);
                            return;
                        }

                        return git(data.directory).init();
                    });

                return gitPromise
                    .then(() => fs.pathExists(Constants.TexIgnorePath))
                    .then(texIgnoreExists => Util.verify(texIgnoreExists, new Error(`TeX ignore template was not found!`)))
                    .then(() => fs.readFile(Constants.TexIgnorePath))
                    .then(texIgnoreContents => {
                        const gitignorePath = path.join(data.directory, '.gitignore');
                        const ignoreExists = fs.pathExistsSync(gitignorePath);

                        // Make sure we have a string.
                        texIgnoreContents = texIgnoreContents.toString();

                        const texIgnoreToWrite = os.EOL === '\n' ? texIgnoreContents : texIgnoreContents.replace('\n', os.EOL);
                        if (ignoreExists) {
                            this.logger.warn(`'.gitignore' already exists - appending TeX ignore in the end.`);
                            return fs.appendFile(gitignorePath, texIgnoreToWrite);
                        }
                        else {
                            return fs.writeFile(gitignorePath, texIgnoreToWrite);
                        }
                    });
            })

            // Then write out the config
            .then(() => this.config.initProjectConfig({filePath: configPath}));
    }

    /**
     * @param {object} data
     * @param {string} data.directory Directory in which `.rammyrc.json` will be created.
     * @param {string} data.name Name of the module
     * @returns {Promise<void>}
     */
    initModule(data) {
        const schema = {
            directory: Joi.string().required(),
            name: Joi.string().required(),
        };
        let configPath;
        return Promise.resolve()
            .then(() => Util.validate(schema, data))
            .then(() => configPath = path.join(data.directory, Constants.ConfigFileName))
            .then(() => this.config.initModuleConfig({filePath: configPath, moduleName: data.name}));
    }

    /**
     * @param {Object} data
     * @param {string} data.module Git(Hub) repository or (possibly relative) path to module
     * @param {boolean} data.isPath Indicates if `data.module` is a path
     * @returns {Promise<void>}
     */
    addModule(data) {
        const schema = {
            module: Joi.string().required(),
            isPath: Joi.boolean().required(),
        };
        let rammyrcDir;
        let moduleName;
        let modulePath;
        return Promise.resolve()
            .then(() => Util.validate(schema, data))

            // Check that config exist beforehand.
            .then(() => this.config.load())
            .then(() => rammyrcDir = path.dirname(this.rammyrcPath))

            .then(() => {
                moduleName = path.basename(data.module);

                // Check if we're working with a local path
                if (data.isPath) {
                    modulePath = path.resolve(data.module);
                    if (!fs.pathExistsSync(modulePath)) {
                        throw new RammyError('That path does not exist!', ErrorCode.ModuleNotExists);
                    }
                    return Promise.resolve();
                }

                // If we end up here, we either have a full Git path or shorthand for GitHub repo
                if (!shell.which('git')) throw new RammyError(`'git' command was not found! Install Git or use local paths to add modules.`);

                // Figure out what format we have
                let remote;
                if (/^[a-z]+\/[a-z\-_]+$/i.test(data.module)) {
                    remote = `https://github.com/${data.module}.git`;
                } else {
                    moduleName = moduleName.replace(/\.git$/, '');
                    remote = data.module;
                }

                // Use repository name as the folder name.
                modulePath = path.resolve(moduleName);

                // If `.rammyrc.json` is in a Git repo, we add a submodule. Otherwise we clone afresh.
                return Promise.resolve()
                    .then(() => git(rammyrcDir).silent().checkIsRepo())
                    .then(rammyrcInGitRepo => {
                        if (rammyrcInGitRepo) {
                            this.logger.debug(`Looks like we're in a Git repository - adding a Git submodule.`);
                            return git(rammyrcDir).submoduleAdd(remote, moduleName);
                        }
                        else {
                            this.logger.debug(`We're not in a Git repository - cloning the repo afresh.`);
                            return git(rammyrcDir).clone(remote, modulePath);
                        }
                    });
            })
            .then(() => {
                const moduleConfigPath = path.join(modulePath, Constants.ConfigFileName);
                if (!fs.pathExistsSync(moduleConfigPath)) return null;
                return fs.readJson(moduleConfigPath);
            })
            .then(moduleRammyrc => {
                if (moduleRammyrc && moduleRammyrc.name) moduleName = moduleRammyrc.name;
                else this.logger.warn(`Can't resolve module name (is module's '${Constants.ConfigFileName}' valid?) - using folder name instead: '${moduleName}'.`);

                return this.config.addModule({moduleName, modulePath});
            });
    }

    /**
     * @param {Object} data
     * @param {string} data.module Module name
     * @returns {Promise<void>}
     */
    removeModule(data) {
        const schema = {
            module: Joi.string().required(),
        };
        return Promise.resolve()
            .then(() => Util.validate(schema, data))
            .then(() => this.config.removeModule({moduleName: data.module}));
    }

    /**
     * @returns {Promise<{modules: Object<string, ModuleData>, allTemplates: Object<string, TemplateData>, allSnippets: Object<string, SnippetData}>}
     */
    getAllModuleData() {
        return Promise.resolve()
            .then(() => this.config.getAllModuleData());
    }

    /**
     * @param {object} data
     * @param {string} data.filePath Path to file that will be created
     * @param {string} data.template Template name or absolute path to a .tex file
     * @returns {Promise<void>}
     */
    createFile(data) {
        const schema = {
            filePath: Joi.string().required(),
            template: Joi.string().required(),
        };

        return Promise.resolve()
            .then(() => Util.validate(schema, data))
            .then(() => this.texFileManager.createFileFromTemplate({filePath: data.filePath, template: data.template}));
    }

    /**
     * @param {object} data
     * @param {string} data.filePath Path to file that will be created
     * @param {string} data.snippet Snippet name or absolute path to a .tex file
     * @returns {Promise<void>}
     */
    addSnippetToFile(data) {
        const schema = {
            filePath: Joi.string().required(),
            snippet: Joi.string().required(),
        };

        return Promise.resolve()
            .then(() => Util.validate(schema, data))
            .then(() => this.texFileManager.addSnippetToFile({filePath: data.filePath, snippet: data.snippet}));
    }

    /**
     * @param {object} data
     * @param {string} data.filePath Absolute path to the TeX file that we want to compile
     * @returns {Promise<void>}
     */
    compile(data) {
        const schema = {
            filePath: Joi.string().required(),
        };
        return Promise.resolve()
            .then(() => Util.validate(schema, data))
            .then(() => new Promise((resolve, reject) => {
                const potentialCommands = [
                    {name: 'pdflatex', arguments: '-halt-on-error'},
                    {name: 'latexmk', arguments: '-pdf'},
                ];
                let commandToUse;
                for (let command of potentialCommands) {
                    if (shell.which(command.name)) {
                        commandToUse = command;
                        break;
                    }
                }
                if (!commandToUse) {
                    const supportedCommandNames = _.map(potentialCommands, command => command.name);
                    return reject(new RammyError(`Couldn't find a supported program to compile the file with. Install one of these: ${supportedCommandNames.join(', ')}`));
                }

                const compileResult = shell.exec(`${commandToUse.name} ${commandToUse.arguments} ${data.filePath}`, {silent: true});
                if (compileResult.code !== 0) {
                    return reject(new RammyError(`Couldn't compile the file using '${commandToUse.name}'!`));
                }

                resolve();
            }));
    }

    /**
     * TODO: Move this to TexFileManager
     *
     * @param {object} data
     * @param {string} [data.directory] Absolute path to directory to clean
     * @param {string} [data.filePath] Absolute path to a `.tex` file
     * @returns {Promise<void>}
     */
    clean(data) {
        const schema = Joi.object().keys({
            directory: Joi.string(),
            filePath: Joi.string(),
        }).or('directory', 'filePath');

        return Promise.resolve()
            .then(() => Util.validateFull(schema, data))
            .then(() => {
                // Single file, can just clean around it directly
                if (data.filePath) return this._cleanAroundTexFile({filePath: data.filePath});

                // Iterate through files in current directory and clean around them
                return Promise.resolve()
                    .then(() => fs.readdir(data.directory))
                    .then(files => {
                        const promises = [];
                        for (let file of files) {
                            if (!file.endsWith('.tex')) continue;
                            const filePath = path.join(data.directory, file);
                            promises.push(this._cleanAroundTexFile({filePath}));
                        }
                        return Promise.all(promises);
                    });
            });
    }

    /**
     * TODO: Move this to TexFileManager
     *
     * @param {object} data
     * @param {string} data.filePath Absolute path to a `.tex` file
     * @returns {Promise<void>}
     * @private
     */
    _cleanAroundTexFile(data) {
        const pathData = path.parse(data.filePath);
        if (pathData.ext !== '.tex') throw new RammyError(`'${pathData.base}' isn't a TeX file!`);

        const extensionsToClean = [
            '.aux',
            '.fdb_latexmk',
            '.fls',
            '.log',
            '.out',
        ];
        const promises = new Array(extensionsToClean.length);
        for (let i = 0; i < extensionsToClean.length; i++) {
            const ext = extensionsToClean[i];
            const filePath = path.join(pathData.dir, `${pathData.name}${ext}`);
            promises[i] = Promise.resolve()
                .then(() => fs.pathExists(filePath))
                .then(fileExists => fileExists ? fs.unlink(filePath) : null);

        }
        return Promise.all(promises);
    }

}

module.exports = Rammy;
