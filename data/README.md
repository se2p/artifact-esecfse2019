# Replication Package

This is the replication package for our work on
"Testing Scratch Programs Automatically".

The package contains our raw results and scripts for generating
the plots of the paper from the raw data.

## Contents

The replication package is structured into two main directories:

* 'data/':
    raw data and scripts that have been used for collecting the data

* 'scripts/':
    scripts for generating the plots that are presented in the paper

### RAW data

* 'data/teacher-data/'
    data from the scratch workshop: sample solution and scores for student solutions

* 'data/code-club-stats/'
    block counts and input methods of the used Code Club projects

* 'data/coverage`/Users/stahlbau/uni/research/papers/testing-scratch-paper/artifact-submission/README
    code for measuring the coverage of automated input generation

* 'data/coverage-results/'
    coverage measurements on the Code Club projects

* 'data/test-seeded/'
    test suites for the projects of the Scratch workshop

* 'data/test-seeded-results/'
    test results from the test suites in 'data/test-seeded/'

* 'data/time/'
    Scratch programs for time measurement (10x the sample solution from 'data/teacher-data/`)

* 'data/time-results/'
    time measurements on the projects in 'data/time/'

## Reproducing the Plots

### Prerequisites

We describe the process based on:

    * the R statistics package in version 3.5
    * an Unix environment (Linux or MacOSX)

Following R packages are required:

    * ggplot2
    * dplyr
    * viridis

The package can be installed with the R command "install.packages".

### Generating the Plots

Coverage (Figure 11)

    ./scripts/coverage-unseeded.R

    The result is a set of "coverage-*.pdf" files

Inconsistency (Figure 9)

    ./scripts/consistency-unseeded.R
    ./scripts/consistency-seeded.R

    The result is a set of "consistency-*.pdf" files

Scatter Plots (Figure 10, Figure 12)

    ./scripts/scatter-unseeded.R
    ./scripts/scatter-seeded.R

    The result is a set of "scatter-*.pdf" files

