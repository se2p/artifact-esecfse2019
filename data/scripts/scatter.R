#!/usr/bin/env Rscript

library(ggplot2);
library(scales);
library(viridis);

source("scripts/read-data.R");
source("scripts/annotate-plot.R");


# The names of the projects to be used in the scatter plot
ids = projects.intersect;

# The names of the data sets for which to make scatter plots for
data_sets = list("normal" = paste("normal-", 0:9, sep=""),
                 "constraint" = paste("constraint-", 0:9, sep=""),
                 "random" = paste("random-", 0:9, sep=""));

make_scatter_plot = function(data, name) {
    excluded = which(data$excluded == FALSE);
    correlation = cor.test(data$points, data$passes);
    correlation_excluded = cor.test(data$points[excluded], data$passes[excluded])

    if (grepl("normal", name)) {
        test_name = "Test";
    } else {
        test_name = "Constraint";
    }

    print("-------------------")
    print(name);
    print(data);
    print("with excluded:");
    print(paste("r =", correlation[["estimate"]], "p-value =", correlation[["p.value"]]));
    print("without excluded:");
    print(paste("r =", correlation_excluded[["estimate"]], "p-value =", correlation_excluded[["p.value"]]));

    scatter = ggplot(data = data, aes(x = points, y = passes, color = coverage, shape = excluded)) +
        geom_point(size = 3) +
        geom_smooth(method = lm, se = FALSE, data = subset(data, !excluded)) +
        scale_color_viridis(limits = c(0.0, 1.0), labels = percent) +
        scale_shape_manual(values = c(19, 1), labels = c("Included Projects", "Excluded Projects")) +
        guides(color = guide_colorbar(order = 0), shape = guide_legend(order = 1)) +
        labs(x = "Points (Manual Evaluation)", y = paste(test_name, "Passes"), shape = "", color = "Coverage") +
        theme_light() +
        theme(text = element_text(size=14));

    label = paste("without excluded projects:\n",
                  "r = ", format(correlation_excluded[["estimate"]], digits = 3, nsmall = 3), " ",
                  "(p-value = ", format(correlation_excluded[["p.value"]], digits = 3, nsmall = 3, scientific = TRUE), ")\n",
                  "with excluded projects:\n",
                  "r = ", format(correlation[["estimate"]], digits = 3, nsmall = 3), " ",
                  "(p-value = ", format(correlation[["p.value"]], digits = 3, nsmall = 3, scientific = TRUE), ")",
                   sep = "");
    scatter = annotate_plot(scatter, label, 2);

    ggsave(paste("scatter-", seedingtype, "-", name, ".pdf", sep=""), plot = scatter, width = 16, height = 9.6, units = "cm");
}

main = function () {
    for (set_name in names(data_sets)) {
        avg_passes = c(0);
        avg_coverage = c(0);

        for (data_name in data_sets[[set_name]]) {
            test_results  = csvs.test_results[[data_name]];
            test_coverage = csvs.test_coverage[[data_name]];

            passes = unlist(lapply(test_results, function(x) as.vector(table(x$status)["pass"])));
            passes[is.na(passes)] = 0;

            coverage = unlist(lapply(test_coverage, function(x) 100 * x[1,"percent"]));
            coverage[is.na(coverage)] = 0;

            data = data.frame(points = csvs.teacher_points.total[ids],
                              passes = passes[ids],
                              coverage = coverage[ids] / 100,
                              excluded = ! projects.intersect %in% projects.filtered);

            avg_passes = avg_passes + data$passes;
            avg_coverage = avg_coverage + data$coverage;

            make_scatter_plot(data, data_name);
        }

        # If the data set had multiple items, then also make a scatter plot for the average values
        num_items = length(data_sets[[set_name]]);
        if (num_items > 1) {
            avg_passes = avg_passes / num_items;
            avg_coverage = avg_coverage / num_items;

            data = data.frame(points = csvs.teacher_points.total[ids],
                              passes = avg_passes,
                              coverage = avg_coverage,
                              excluded = ! projects.intersect %in% projects.filtered);

            make_scatter_plot(data, paste(set_name, "-avg", sep = ""));
        }
    }
}

main();
