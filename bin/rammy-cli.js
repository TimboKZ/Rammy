#! /usr/bin/env node

/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2018
 * @license GPL-3.0
 */

const Promise = require('bluebird');
const cli = require('caporal');

const packageData = require('../package.json');
const Rammy = require('../lib/Rammy');
const Util = require('../lib/Util');

const logger = cli.logger();
const config = {
    logger,
    rammyrcPath: Util.discoverRammyrc(process.cwd()),
};
if (config.rammyrcPath) logger.debug(`Discovered config: ${config.rammyrcPath}`);
const rammy = new Rammy(config);


cli.version(packageData.version);
cli
    .command('init', 'Initialise a Rammy LaTeX project')
    .argument('[dir]', 'Target directory', null, process.cwd())
    .action((args, options, logger) => {
        Promise.resolve()
            .then(() => rammy.initProject({directory: args.dir}))
            .catch(error => console.error(error));
    });
cli
    .command('add', 'Add a Rammy module')
    .argument('<path>', 'Path to module')
    .action((args, options, logger) => {
        Promise.resolve()
            .then(() => rammy.addModule({module: args.path}))
            .catch(error => console.error(error));
    });

cli.parse(process.argv);
