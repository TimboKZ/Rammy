/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2018
 * @license GPL-3.0
 */

const readline = require('readline');
const Promise = require('bluebird');
const path = require('upath');
const fs = require('fs-extra');
const os = require('os');

const {Util, RammyError} = require('./Util');
const Constants = require('./Constants');

/**
 * @enum {string}
 */
const RammyFileType = {
    RawTemplate: 'raw-template',
    ExistingFile: 'existing-file',
};

class RammyFile {

    /**
     * @param {object} data
     * @param {Logger} data.logger
     * @param {object} data.path Absolute path to the file
     * @param {RammyFileType} data.fileType Type of file that `data.path` points to
     */
    constructor(data) {
        this.logger = data.logger;
        this.path = data.path;
        this.fileType = data.fileType;

        this.loaded = false;
        this.lines = null;
        this.rammySectionPos = -1;
    }

    /**
     * Loads the file from `this.path` extracting the Rammy section and other meta data.
     */
    load() {
        if (this.loaded) this.logger.warn(`'RammyFile.load()' was called after the file was loaded!`);

        return new Promise((resolve, reject) => {
            const fileReader = readline.createInterface({input: fs.createReadStream(this.path)});
            let inRammySection = false;
            let rammySectionLines = [];
            fileReader.on('line', line => {
                // TODO: Add check for start/end of Rammy section here
                inRammySection = false; // Replace with logic
                this.rammySectionPos = 99; // Replace with actual line number
                if (inRammySection) {
                    rammySectionLines.push(line);
                } else {
                    // TODO: Replace lines array with a queue?
                    this.lines.push(line);
                }
            });
            fileReader.on('close', () => {
                this.parseRammySectionLines({lines: rammySectionLines});

                this.loaded = true;
                resolve();
            });
        });
    }

    
    parseRammySectionLines(data) {

    }

}

module.exports = RammyFile;
module.exports.RammyFileType = RammyFileType;

