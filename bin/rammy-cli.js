#! /usr/bin/env node

/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2018
 * @license GPL-3.0
 */

const cli = require('caporal');

const packageData = require('../package.json');
const Rammy = require('../lib/Rammy');

const rammy = new Rammy({});
cli.version(packageData.version);

cli
    .command('init', 'Initialise a Rammy LaTeX project')
    .argument('[dir]', 'Target directory', null, process.cwd())
    .action((args, options, logger) => {
        Promise.resolve()
            .then(() => rammy.initProject({directory: args.dir}))
            .catch(error => logger.error(error));
    });

cli.parse(process.argv);
