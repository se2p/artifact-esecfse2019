#!/usr/bin/env node

/*
 * Required dependencies:
 * csv-stringify
 */

const fs = require('fs');
const path = require('path');

const csvStringify = require('csv-stringify/lib/sync');

const convertTimesToCsv = function (str) {
    const times = JSON.parse(str);

    for (let i = 0; i < times.records.length; i++) {
        const record = times.records[i];

        for (let j = record.length - 1; j > 0; j--) {
            record[j] -= record[j-1];
        }

        times.records[i] = record.map(x => x.toFixed(1));
    }

    times.records.unshift(times.names);
    return(csvStringify(times.records));
}

const exportTime = async function (str) {
    const lines = str.split('\n');
    const name = lines[0].match(/# project: (.*)\./)[1];

    const timePath = path.join('.', 'time', name + '.csv');
    const timeStr = convertTimesToCsv(lines[1]);

    fs.writeFileSync(timePath, timeStr);
    console.log(timePath);
}

const main = function () {
    try {
        fs.mkdirSync(path.join('.', 'time'));
    } catch (err) {
        if (err.code !== 'EEXIST') throw err;
    }

    for (const file of process.argv.slice(2)) {
        const str = fs.readFileSync(file, 'utf-8');
        const times = str.split(/(?=# project)/);
        for (const time of times) {
            exportTime(time);
        }
    }
}

main();
