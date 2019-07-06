#!/usr/bin/env Rscript

library(ggplot2);
library(scales);
library(dplyr);
library(viridis);

source("scripts/read-data.R");
source("scripts/annotate-plot.R");


# The names of the projects to be used in the scatter plot
ids = projects.filtered;

# The names of the data sets for which to make plots for
data_sets = list("random-input" = paste("random-input-", 0:9, sep = ""),
                 "no-input" = paste("no-input-", 0:9, sep = ""));

breaks = c(1, 2, 4, 8, 16, 32, 64, 128, 256, 600);

make_bar_plot = function (data, data_name, total_mean_coverage) {
    bar = ggplot(data = data, aes(x = project, y = percent_diff, fill = time)) +
        geom_col() +
        labs(x = "Project", y = "Coverage", fill = "Seconds") +
        scale_fill_gradientn(colours = viridis(256), trans = "log", breaks = breaks) +
        scale_y_continuous(labels = percent) +
        theme_light() +
        theme(text=element_text(size=13), axis.text.x = element_text(size = 10, angle = 45, hjust = 1));

    label = paste("Mean Coverage:\n", round(total_mean_coverage, digits = 4), sep="");
    bar = annotate_plot(bar, label);

    ggsave(paste("coverage-bar-", data_name, ".pdf", sep=""), plot = bar, width = 20, height = 10, units = "cm");
}

make_line_plot = function (data, data_line_mean, data_name, total_mean_coverage) {
    line = ggplot(data = data, aes(x = time, y = percent, group = project, color = project)) +
        geom_line() +
        geom_line(data = data_line_mean, color = "black", size = 1) +
        scale_size(range = c(.5,2)) +
        scale_x_continuous(trans = 'log', breaks = breaks) +
        scale_y_continuous(labels = percent) +
        labs(x = "Time (in seconds)", y = "Coverage", color = "Project") +
        theme_light() +
        theme(axis.text.x = element_text(angle = 90, hjust = 1), legend.key.size = unit(0.9, 'lines'));

    label = paste("Mean Coverage: ", round(total_mean_coverage, digits = 4), sep="");
    line = annotate_plot(line, label);

    ggsave(paste("coverage-line-", data_name, ".pdf", sep=""), plot = line, width = 25, height = 10, units = "cm");
}

make_plots = function (data, data_name) {
    mean_coverage = as.data.frame(group_by(data, time) %>% summarise(percent = mean(percent)));
    total_mean_coverage = mean_coverage$percent[600];

    make_bar_plot(data, data_name, total_mean_coverage);

    # Show mean in the plot
    data_line_mean = data.frame(time = mean_coverage$time,
                           percent = mean_coverage$percent,
                           percent_diff = 0,
                           project = "mean");

    make_line_plot(data, data_line_mean, data_name, total_mean_coverage);

    max_index = which(data$time == max(data$time));
    print(data_name);
    print(data$percent[max_index]);
    print(mean(data$percent[max_index]));
}

for (set_name in names(data_sets)) {

    coverage_records_mean = list();

    for (data_name in data_sets[[set_name]]) {

        # time, percent, percent_diff, project
        data = data.frame();

        coverage_records_per_project = csvs.coverage[[data_name]];

        # Save data for average plot
        if (length(coverage_records_mean) == 0) {
            coverage_records_mean = coverage_records_per_project;
        } else {
            for (project_name in names(coverage_records_mean)) {
                coverage_records_mean[[project_name]]$percent =
                    coverage_records_mean[[project_name]]$percent + coverage_records_per_project[[project_name]]$percent;
            }
        }

        for (project_name in names(coverage_records_per_project)) {
            coverage_records = coverage_records_per_project[[project_name]][,c("time", "percent")];

            # Add percent-difference column to coverage_records
            coverage_records$percent_diff = coverage_records$percent - c(0, coverage_records$percent[-length(coverage_records$percent)]);

            # Add project column to coverage_records, add coverage_records to data
            data = rbind(data, cbind(coverage_records, project = project_name));
        }

        data$time = data$time / 1000;

        make_plots(data, data_name);
    }

    # Make average plot
    data_name = paste(set_name, "-avg", sep = "");

    for (project_name in names(coverage_records_mean)) {
        coverage_records_mean[[project_name]]$percent =
            coverage_records_mean[[project_name]]$percent / length(data_sets[[set_name]]);
    }

    data = data.frame();

    for (project_name in names(coverage_records_mean)) {
        coverage_records = coverage_records_mean[[project_name]][,c("time", "percent")];

        # Add percent-difference column to coverage_records
        coverage_records$percent_diff = coverage_records$percent - c(0, coverage_records$percent[-length(coverage_records$percent)]);

        # Add project column to coverage_records, add coverage_records to data
        data = rbind(data, cbind(coverage_records, project = project_name));
    }

    data$time = data$time / 1000;

    make_plots(data, data_name);
}
