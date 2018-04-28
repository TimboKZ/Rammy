/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2018
 * @license GPL-3.0
 */

/**
 * The values for these should be lowercase since they can be used in sentences, e.g. "$$$ is not a valid input name!".
 * @readonly
 * @enum {string}
 */
const ComponentType = {
    Template: 'template',
    Input: 'input',
};

module.exports = {
    ConfigFileName: '.rammyrc.json',
    ComponentNameRegex: /^([a-z0-9\-_]+\/)?[a-z0-9\-_]+$/i,
    ComponentType,
    RammyRegion: {
        Start: '%-- Rammy start',
        StartFull: '%-- Rammy start ----------------',
        End: '%-- Rammy end',
        EndFull: '%-- Rammy end ------------------',
    }
};
