#!/usr/bin/env node

/*
 * Required dependencies:
 * csv-stringify
 */

const fs = require('fs');
const path = require('path');

const csvStringify = require('csv-stringify/lib/sync');

const convertCoverageToCsv = function (str) {
    const coverages = JSON.parse(str);

    const result = [['time', 'running', 'percent', 'total', 'covered']];

    for (const coverage of  coverages) {
        const time = coverage.time;
        const running = Number(coverage.running);
        const total = coverage.combined.total;
        const covered = coverage.combined.covered;
        const percent = total === 0 ? NaN : (covered / total).toFixed(2);

        result.push([time, running, percent, total, covered]);
    }

    return(csvStringify(result));
}

const exportCoverage = async function (str) {
    const lines = str.split('\n');
    const name = lines[0].match(/# project: (.*)\./)[1];

    const covPath = path.join('.', 'cov', name + '.csv');
    const covStr = convertCoverageToCsv(lines[1]);

    fs.writeFileSync(covPath, covStr);
    console.log(covPath);
}

const main = function () {
    try {
        fs.mkdirSync(path.join('.', 'cov'));
    } catch (err) {
        if (err.code !== 'EEXIST') throw err;
    }

    for (const file of process.argv.slice(2)) {
        const str = fs.readFileSync(file, 'utf-8');
        const coverages = str.split(/(?=# project)/);
        for (const coverage of coverages) {
            exportCoverage(coverage);
        }
    }
}

main();
