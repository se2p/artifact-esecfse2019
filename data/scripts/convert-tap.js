#!/usr/bin/env node

/*
 * Usage: convert-tap.js [--constraint] [FILE]...
 *
 * Splits TAP13 output from multiple projects into single files and converts them to CSV.
 * The output files are renamed according to the map below.
 * A single TAP13 file for every project is placed into ${PWD}/tap.
 * A single CSV file for every project is placed into ${PWD}/csv.
 * A single CSV file for the coverage of every project is placed into ${PWD}/cov.
 *
 * If "--constraint" is specified, parse the TAP13 output according to a different format that
 * is used by the constraint tests.
 *
 * Required dependencies:
 * tap-parser
 * csv-stringify
 * js-yaml
 * minimist
 */

const fs = require('fs');
const path = require('path');

const Parser = require('tap-parser');
const csvStringify = require('csv-stringify/lib/sync');
const yaml = require('js-yaml');
const minimist = require('minimist');

let isConstraintTests = false;

/**
 * Maps the project names to the names to the student id in the manual evaluation.
 */
const nameMap = {
    'FS_001': 'K6_S01',
    'FS_002': 'K6_S02',
    'FS_003': 'K6_S03',
    'FS_005': 'K6_S05',
    'FS_006': 'K6_S06',
    'FS_010': 'K6_S10',
    'FS_011': 'K6_S11',
    'FS_012': 'K6_S12',
    'FS_013': 'K6_S13',
    'FS_014': 'K6_S14',
    'FS_015': 'K6_S15',
    'FS_016': 'K6_S16',
    'FS_017': 'K6_S17',
    'FS_018': 'K6_S18',
    'FS_019': 'K6_S19',
    'FS_020': 'K6_S20',
    'FS_027': 'K6_S27',
    'FS_029': 'K6_S29',
    'FS_030': 'K6_S30',
    'FS_031': 'K6_S31',
    'FS_033': 'K6_S33',
    '2': 'K7_S02',
    '3': 'K7_S03',
    '4': 'K7_S04',
    '5': 'K7_S05',
    '6': 'K7_S06',
    '7': 'K7_S07',
    '8': 'K7_S08',
    '10': 'K7_S10',
    '11': 'K7_S11',
    '12': 'K7_S12',
    '14': 'K7_S14',
    '15': 'K7_S15',
    '16': 'K7_S16',
    '17': 'K7_S17',
    '18': 'K7_S18',
    '19': 'K7_S19',
    '20': 'K7_S20',
    '24': 'K7_S24',
    '26': 'K7_S26',
    '27': 'K7_S27'
}

/**
 * Converts a TAP13 string into a CSV string.
 */
const convertToCsv = function (str) {
    return new Promise ((resolve, reject) => {
        const result = [];
        const parser = new Parser();

        parser.on('assert', test => {
            if (isConstraintTests) {
                for (const entry of test.diag.log) {
                    const id = entry.id;
                    const name = entry.name;
                    const status = entry.status
                    const message = entry.message
                    result.push([id, name, status, message]);
                }
            } else {
                const id = test.id;
                const name = test.name;
                const status = test.ok ? 'pass' : test.diag.severity;
                const message = test.ok ? '' : test.diag.error.message;
                result.push([id, name, status, message]);
            }
        });

        parser.on('complete', () => {
            result.sort((a, b) => a[0] - b[0]);
            result.unshift(['id', 'name', 'status', 'message']);
            resolve(csvStringify(result));
        });

        parser.on('bailout', reason => {
            reject(reason);
        });

        parser.end(str);
        parser.push(null);
    });
}

/**
 * Converts the coverage statistics of a commented out YAML string into a CSV string.
 */
const convertCoverageToCsv = function (str) {
    let coverageString = str.split('# coverage:\n')[1];
    if (typeof coverageString === 'undefined') {
        return null;
    }

    coverageString = coverageString.replace(/^# /gm, '');
    const coverage = yaml.safeLoad(coverageString);

    const result = [['sprite', 'percent', 'total', 'covered']];

    const getRowFromString = (name, coverageStr) => {
        const row = [name];
        const coverage = coverageStr.match(/(.*)\s\((\d+)\/(\d+)\)/);
        row.push(coverage[1]);
        row.push(coverage[2]);
        row.push(coverage[3]);
        return row;
    }

    result.push(getRowFromString("combined", coverage.combined));
    for (const spriteName in coverage.individual) {
        result.push(getRowFromString(spriteName, coverage.individual[spriteName]));
    }

    return(csvStringify(result));
}

/**
 * Splits a raw output string into TAP13, CSV, and coverage CSV files for each project and saves them.
 */
const exportTapAndCsv = async function (str) {
    const projectName = str.match(/# project: (.*)\./)[1];
    let name = nameMap[projectName];

    if (typeof name === 'undefined') {
        console.log(`Can't match project name: ${projectName}`);
        name = projectName;
    }

    const tapPath = path.join('.', 'tap', name + '.tap');
    const csvPath = path.join('.', 'csv', name + '.csv');
    const covPath = path.join('.', 'cov', name + '.csv');
    const csvStr = await convertToCsv(str);
    const covStr = convertCoverageToCsv(str);

    fs.writeFileSync(tapPath, str);
    console.log(tapPath);
    fs.writeFileSync(csvPath, csvStr);
    console.log(csvPath);
    fs.writeFileSync(covPath, covStr);
    console.log(covPath);
}

const main = function () {
    const argv = minimist(process.argv.slice(2), {boolean: true});

    try {
        fs.mkdirSync(path.join('.', 'tap'));
    } catch (err) {
        if (err.code !== 'EEXIST') throw err;
    }
    try {
        fs.mkdirSync(path.join('.', 'csv'));
    } catch (err) {
        if (err.code !== 'EEXIST') throw err;
    }
    try {
        fs.mkdirSync(path.join('.', 'cov'));
    } catch (err) {
        if (err.code !== 'EEXIST') throw err;
    }

    if (argv.constraint || argv.c) {
        isConstraintTests = true;
    }

    for (const file of argv._) {
        const str = fs.readFileSync(file, 'utf-8');
        const taps = str.split(/(?=# project)/);
        for (const tap of taps) {
            exportTapAndCsv(tap);
        }
    }
}

main();
