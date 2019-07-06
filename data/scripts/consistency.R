#!/usr/bin/env Rscript

library(ggplot2);

source("scripts/read-data.R");

# The names of the projects to be used in the scatter plot
ids = projects.filtered;

# The names of the data sets for which to make scatter plots for
data_sets = list("normal" = paste("normal-", 0:9, sep=""),
                 "constraint" = paste("constraint-", 0:9, sep=""),
                 "random" = paste("random-", 0:9, sep=""));


percent_format = function(total) {
    function(x) paste(x, " (", round(x * 100 / total), "%)", sep = "");
}

make_bar_plot = function(data, total, xlabel, ylabel, file_name) {
    bar = ggplot(data = data, aes(x = items, y = inconsistencies)) +
          geom_col(width = 0.8) +
          geom_hline(aes(yintercept = mean(inconsistencies))) +
          scale_y_continuous(breaks = 0:10, labels = percent_format(total)) +
          labs(x = xlabel, y = ylabel) +
          theme_light() +
          theme(text = element_text(size=9), axis.text.x = element_text(size = 6, angle = 90, hjust = 1));
    ggsave(file_name, plot = bar, width = 12.5, height = 5, units = "cm");
}

is_compatible = function(old, new) {
    old = as.character(old);
    new = as.character(new);

    if (old == "skip") {
        return (c(compatible = FALSE, new_outcome = new));
    } else if (new == "skip") {
        return (c(compatible = FALSE, new_outcome = old));
    } else {
        return (c(compatible = old != new, new_outcome = old));
    }
}

main = function() {
    for (set_name in names(data_sets)) {
        datas = list();
        for (data_name in data_sets[[set_name]]) {
            datas[[data_name]] = csvs.test_results[[data_name]][ids];
        }

        num_datas = length(datas);
        num_projects = length(datas[[1]]);
        num_tests = nrow(datas[[1]][[1]]);

        differences = matrix(nrow = num_projects, ncol = num_tests);
        rownames(differences) = names(datas[[1]]);
        colnames(differences) = 1:num_tests;

        for (p in 1:num_projects) {
            for (t in 1:num_tests) {
                test_outcome = datas[[1]][[p]]$status[t];
                differences[p,t] = 0;
                for (d in 2:num_datas) {
                    new_test_outcome = datas[[d]][[p]]$status[t];
                    res = is_compatible(test_outcome, new_test_outcome);
                    test_outcome = res["new_outcome"];
                    if (res["compatible"]) {
                        differences[p,t] = 1;
                        break;
                    }
                }
            }
        }


        if (grepl("normal", set_name)) {
            test_name = "Test Case";
        } else {
            test_name = "Constraint";
        }

        inconsistencies_per_project = rowSums(differences);
        data = data.frame(inconsistencies = inconsistencies_per_project,
                          items = names(inconsistencies_per_project));
        file_name = paste("consistency-per-project-", set_name, "-", seedingtype, ".pdf", sep="")
        make_bar_plot(data, num_tests, "Project", paste("Inconsistent ", test_name, "s", sep = ""), file_name);

        inconsistencies_per_test = colSums(differences);
        inconsistencies_per_test = inconsistencies_per_test[order(as.numeric(names(inconsistencies_per_test)))];
        data = data.frame(inconsistencies = inconsistencies_per_test,
                          items = reorder(as.numeric(names(inconsistencies_per_test)), as.numeric(names(inconsistencies_per_test))));
        file_name = paste("consistency-per-test-", set_name, "-", seedingtype, ".pdf", sep="")
        make_bar_plot(data, num_projects, test_name, "Inconsistent Projects", file_name);

        print("-------------------------")
        print(set_name);
        print("");

        print(inconsistencies_per_test);
        cat("Mean inconsistent projects per test: ");
        print(mean(inconsistencies_per_test));
        cat("Percentage of inconsistent test-project pairs: ");
        print(mean(inconsistencies_per_test) / num_projects);
        print("");

        print(inconsistencies_per_project);
        cat("Mean inconsistent tests per project: ");
        print(mean(inconsistencies_per_project));
        cat("Percentage of inconsistent test-project pairs: ");
        print(mean(inconsistencies_per_project) / num_tests);
        print("");

        print(differences);
        print("");
        print("");
    }
}

main();
