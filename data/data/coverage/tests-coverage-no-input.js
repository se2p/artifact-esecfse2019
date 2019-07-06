const measureCoverage = async function (t) {
    for (let timestamp = 1000; timestamp <= 600000; timestamp += 1000) {
        await t.runUntil(() => t.getTotalTimeElapsed() >= timestamp);
        t.logCoverage(timestamp, t.isProjectRunning());
    }

    t.end();
}

module.exports = [
    {
        test: measureCoverage,
        name: 'Coverage Test',
        description: 'Print the coverage after the program has run for set intervals of time.',
        categories: []
    }
];
