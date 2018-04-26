#! /usr/bin/env node

/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2018
 * @license GPL-3.0
 */

const winston = require('winston');
const Promise = require('bluebird');
const cli = require('caporal');

const packageData = require('../package.json');
const Rammy = require('../lib/Rammy');
const Util = require('../lib/Util');

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.splat(),
        winston.format.colorize(),
        winston.format.simple()
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
cli
    .command('init', 'Initialise a Rammy LaTeX project')
    .argument('[dir]', 'Target directory', null, process.cwd())
    .action((args, options) => {
        Promise.resolve()
            .then(() => rammy.initProject({directory: args.dir}))
            .catch(handleError);
    });
cli
    .command('add', 'Add a Rammy module')
    .argument('<path>', 'Path to module')
    .action((args, options) => {
        Promise.resolve()
            .then(() => rammy.addModule({module: args.path}))
            .catch(handleError);
    });
cli
    .command('remove', 'Remove previously defined module')
    .argument('<module>', 'Name of the module')
    .action((args, options, logger) => {
        Promise.resolve()
            .then(() => rammy.removeModule({module: args.module}))
            .catch(handleError);
    });

cli.parse(process.argv);
