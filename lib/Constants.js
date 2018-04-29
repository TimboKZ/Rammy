/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2018
 * @license GPL-3.0
 */

const upath = require('upath');

/**
 * The values for these should be lowercase since they can be used in sentences, e.g. "$@ is not a valid snippet name!".
 * @readonly
 * @enum {string}
 */
const ComponentType = {
    Template: 'template',
    Snippet: 'snippet',
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

    },
    TexIgnorePath: upath.resolve(__dirname, '../assets/TeX.gitignore'),
    AuxiliaryExtensions: [
        '.aux',
        '.lof',
        '.log',
        '.lot',
        '.fls',
        '.out',
        '.toc',
        '.fmt',
        '.fot',
        '.cb',
        '.cb2',
        '.bbl',
        '.bcf',
        '.blg',
        '-blx.aux',
        '-blx.bib',
        '.run.xml',
        '.fdb_latexmk',
        '.synctex',
        '.synctex.gz',
        '.pdfsync',
        '.alg',
        '.loa',
    ],
};
