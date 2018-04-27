#! /usr/bin/env node

/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2018
 * @license GPL-3.0
 */

const colors = require('colors/safe');
const Promise = require('bluebird');
const winston = require('winston');
const _ = require('underscore');
const cli = require('caporal');
const path = require('path');

const packageData = require('../package.json');
const Rammy = require('../lib/Rammy');
const Util = require('../lib/Util');

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.splat(),
        winston.format.colorize(),
        winston.format.simple(),
    ),
    transports: [new winston.transports.Console()],
});
const config = {
    logger,
    rammyrcPath: Util.discoverRammyrc(process.cwd()),
};
if (config.rammyrcPath) logger.debug(`Discovered config: ${config.rammyrcPath}`);
const rammy = new Rammy(config);

const handleError = (error) => {
    if (error instanceof Util.RammyError) {
        logger.error(error.message);
        if (error.comment) logger.error(error.comment);
    }
    else console.error(error);
};

cli.logger(logger);
cli.version(packageData.version);

//--------- Init
cli
    .command('init', 'Initialise a Rammy LaTeX project')
    .argument('[dir]', 'Target directory', null, process.cwd())
    .action((args) => {
        Promise.resolve()
            .then(() => rammy.initProject({directory: args.dir}))
            .catch(handleError);
    });
cli
    .command('init-module', 'Initialise a Rammy module')
    .argument('<name>', 'Name of the module')
    .argument('[dir]', 'Target directory', null, process.cwd())
    .action((args) => {
        Promise.resolve()
            .then(() => rammy.initModule({directory: args.dir, name: args.name}))
            .catch(handleError);
    });


//--------- Adding/removing modules
cli
    .command('add', 'Add a Rammy module')
    .argument('<module>', 'GitHub repo or ath to module')
    .option('-p, --path', 'Required if the provided argument is a path', cli.BOOL, false)
    .action((args, options) => {
        Promise.resolve()
            .then(() => rammy.addModule({module: args.module, isPath: options.path}))
            .catch(handleError);
    });
cli
    .command('remove', 'Remove previously defined module')
    .argument('<module>', 'Name of the module')
    .action((args) => {
        Promise.resolve()
            .then(() => rammy.removeModule({module: args.module}))
            .catch(handleError);
    });


//--------- Listing modules
cli
    .command('list', 'List modules, templates and inputs')
    .option('-m, --modules-only', 'Display modules only', cli.BOOL, false)
    .action((args, options) => {
        Promise.resolve()
            .then(() => rammy.getAllModuleData())
            .then(modulesDetails => {
                const modules = modulesDetails.modules;
                let detailsString = 'All available modules:\n';
                const mapDescObject = (templateData, templateName) => {
                    detailsString += `    - ${colors.cyan(colors.bold(templateName))} ${templateData.description}\n`;
                };
                let i = 1;
                _.mapObject(modules, (moduleData, moduleName) => {
                    detailsString += `\n${colors.gray(i++)} ${colors.bold(moduleName)}\n`;
                    if (options.modulesOnly) return;
                    detailsString += `   ${colors.gray('Templates')}:\n`;
                    if (_.isEmpty(moduleData.templates)) detailsString += `    - ${colors.gray('Nothing to show.')}\n`;
                    else _.mapObject(moduleData.templates, mapDescObject);
                    detailsString += `   ${colors.gray('Inputs')}:\n`;
                    if (_.isEmpty(moduleData.inputs)) detailsString += `    - ${colors.gray('Nothing to show.')}\n`;
                    else _.mapObject(moduleData.inputs, mapDescObject);
                });
                if (i === 1) detailsString += colors.gray('\nNothing to show.\n');
                logger.info(detailsString);
            })
            .catch(handleError);
    });


//--------- Manipulating files
cli
    .command('create', 'Create a TeX file from template')
    .argument('<file>', 'Name of the file to create')
    .argument('<template>', 'Template to use')
    .action((args) => {
        Promise.resolve()
            .then(() => rammy.createFile({filePath: path.resolve(process.cwd(), args.file), template: args.template}))
            .catch(handleError);
    });


//--------- Compile a file
cli
    .command('compile', 'Compile a TeX file into a PDF')
    .argument('<file>', 'Name of the TeX file to compile')
    .option('-c, --clean', 'Clean the directory after compilation', cli.BOOL, false)
    .action((args, options) => {
        const pathToFile = path.resolve(process.cwd(), args.file);
        Promise.resolve()
            .then(() => rammy.compile({filePath: pathToFile}))
            .then(() =>  options.clean ? rammy.clean({filePath: pathToFile}) : null)
            .catch(handleError);
    });


//--------- Cleaning secondary TeX files
cli
    .command('clean', 'Delete secondary TeX files in the current directory')
    .argument('[file]', 'Single .tex file to target')
    .action((args) => {
        Promise.resolve()
            .then(() => rammy.clean({directory: process.cwd(), filePath: args.file}))
            .catch(handleError);
    });


cli.parse(process.argv);
