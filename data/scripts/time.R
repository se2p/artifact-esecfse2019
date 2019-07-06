#!/usr/bin/env Rscript

library(ggplot2);

source("scripts/read-data.R");
source("scripts/annotate-plot.R");

data_sets = c("normal-pc",
              "normal-laptop",
              "constraint-pc",
              "constraint-laptop",
              "random-pc",
              "random-laptop");

for (set_name in data_sets) {
    data = data.frame(NA, NA, NA, NA, NA, NA, NA);
    names(data) = c("callbacks-before",
                    "random-inputs",
                    "inputs",
                    "sprites",
                    "scratch",
                    "callbacks-after",
                    "constraints");

    for (times in csvs.time[[set_name]]) {
        data = rbind(data, times);
    }

    data = data[-1,];

    print(set_name);
    print("--------------------");
    print(paste("mean callbacks-before", round(mean(data[,"callbacks-before"]), digits = 3)));
    print(paste("mean random-inputs"   , round(mean(data[,"random-inputs"]   ), digits = 3)));
    print(paste("mean inputs"          , round(mean(data[,"inputs"]          ), digits = 3)));
    print(paste("mean sprites"         , round(mean(data[,"sprites"]         ), digits = 3)));
    print(paste("mean scratch"         , round(mean(data[,"scratch"]         ), digits = 3)));
    print(paste("mean callbacks-after" , round(mean(data[,"callbacks-after"] ), digits = 3)));
    print(paste("mean constraints"     , round(mean(data[,"constraints"]     ), digits = 3)));
    print(paste("mean total"           , round(mean(rowSums(data)            ), digits = 3)));
    print(paste("mean whisker"         , round(mean(rowSums(data) - data[,"scratch"]), digits = 3)));
    print(paste("max callbacks-before" , round( max(data[,"callbacks-before"]), digits = 3)));
    print(paste("max random-inputs"    , round( max(data[,"random-inputs"]   ), digits = 3)));
    print(paste("max inputs"           , round( max(data[,"inputs"]          ), digits = 3)));
    print(paste("max sprites"          , round( max(data[,"sprites"]         ), digits = 3)));
    print(paste("max scratch"          , round( max(data[,"scratch"]         ), digits = 3)));
    print(paste("max callbacks-after"  , round( max(data[,"callbacks-after"] ), digits = 3)));
    print(paste("max constraints"      , round( max(data[,"constraints"]     ), digits = 3)));
    print(paste("max total"            , round( max(rowSums(data)            ), digits = 3)));
    print(paste("max whisker"          , round( max(rowSums(data) - data[,"scratch"]), digits = 3)));
    print("");

    totals = sort(rowSums(data));
    sort(totals);
    n = length(totals);
    print("highest totals")
    print(totals[(n-5):n]);
    print("");
}

###############################################################################

data_sets = c("normal-pc",
              "normal-laptop",
              "constraint-pc",
              "constraint-laptop",
              "random-pc",
              "random-laptop");

for (set_name in data_sets) {
    data = data.frame(NA, NA, NA);
    names(data) = c("time",
                    "step",
                    "run");

    for (times in csvs.time[[set_name]]) {
        new_data = data.frame(time = rowSums(times),
                              step = 1:nrow(times),
                              run  = set_name);
        data = rbind(data, new_data);
        break;
    }

    data = data[-1,];

    line = ggplot(data = data, aes(x = step, y = time)) +
        geom_line() +
        geom_hline(aes(yintercept = 1000/30), color = "darkgray", size = 1) +
        labs(x = "Step (30 per second)", y = "Step execution time (in ms)") +
        theme_light() +
        scale_y_continuous(breaks = c(0, 5, 10, 15, 20, 25, 30, 35)) +
        coord_cartesian(ylim=c(0, 35));

    ggsave(paste("time-", set_name, ".pdf", sep=""), plot = line, width = 15, height = 6.5, units = "cm");
}
