#!/usr/bin/env Rscript

library(tools);


########## Read test results ###################################################

dir         = file.path("data", paste("test-", seedingtype, "-results", sep=""));
dirs        = list.files(dir, full.names=TRUE);
names(dirs) = lapply(dirs, basename);

csvs.test_results  = list();
csvs.test_coverage = list();

for (i in 1:length(dirs)) {
    dir                            = file.path(dirs[[i]], "csv");
    files                          = list.files(dir, pattern="*.csv", full.names=TRUE);
    csvs.test_results[[i]]         = lapply(files, function(file) read.csv(file, header=TRUE));
    names(csvs.test_results[[i]])  = lapply(files, function(file) file_path_sans_ext(basename(file)));

    dir                            = file.path(dirs[[i]], "cov");
    files                          = list.files(dir, pattern="*.csv", full.names=TRUE);
    csvs.test_coverage[[i]]        = lapply(files, function(file) read.csv(file, header=TRUE));
    names(csvs.test_coverage[[i]]) = lapply(files, function(file) file_path_sans_ext(basename(file)));
}

names(csvs.test_results)  = names(dirs);
names(csvs.test_coverage) = names(dirs);


########## Read manual evaluation results ######################################

file                 = file.path("data", "teacher-data", "overview.csv");
csvs.teacher_overview = read.csv(file);

file                     = file.path("data", "teacher-data", "scores-6.csv");
csvs.teacher_points       = read.csv(file, header=TRUE);
file                     = file.path("data", "teacher-data", "scores-7.csv");
csvs.teacher_points       = cbind(csvs.teacher_points, read.csv(file, header=TRUE));
csvs.teacher_points.total = colSums(csvs.teacher_points);


########## Read coverage results ###############################################

dir         = file.path("data", "coverage-results");
dirs        = list.files(dir, full.names=TRUE);
names(dirs) = lapply(dirs, basename);

csvs.coverage = list();

for (i in 1:length(dirs)) {
    dir                       = file.path(dirs[[i]], "cov");
    files                     = list.files(dir, pattern="*.csv", full.names=TRUE);
    csvs.coverage[[i]]        = lapply(files, function(file) read.csv(file, header=TRUE));
    names(csvs.coverage[[i]]) = lapply(files, function(file) file_path_sans_ext(basename(file)));
}

names(csvs.coverage) = names(dirs);


########## Read time results ###############################################

dir         = file.path("data", "time-results");
dirs        = list.files(dir, full.names=TRUE);
names(dirs) = lapply(dirs, basename);

csvs.time   = list();

for (i in 1:length(dirs)) {
    dir                   = file.path(dirs[[i]], "time");
    files                 = list.files(dir, pattern="*.csv", full.names=TRUE);
    csvs.time[[i]]        = lapply(files, function(file) read.csv(file, header=TRUE, check.names=FALSE));
    names(csvs.time[[i]]) = lapply(files, function(file) file_path_sans_ext(basename(file)));
}

names(csvs.time) = names(dirs);


########## Project categories ##################################################

# Projects for which the project file exists
projects.files = c("K6_S01", "K6_S02", "K6_S03", "K6_S05", "K6_S06", "K6_S10", "K6_S11", "K6_S13",
                   "K6_S14", "K6_S15", "K6_S16", "K6_S18", "K6_S19", "K6_S20", "K6_S27", "K6_S29",
                   "K6_S30", "K6_S31", "K6_S33", "K7_S02", "K7_S03", "K7_S04", "K7_S05", "K7_S06",
                   "K7_S07", "K7_S08", "K7_S10", "K7_S11", "K7_S12", "K7_S14", "K7_S15", "K7_S16",
                   "K7_S17", "K7_S18", "K7_S19", "K7_S20", "K7_S26");

# Projects which were scored manually
projects.scored = names(csvs.teacher_points);

# Projects for which the project file exists and which were scored manually
projects.intersect = intersect(projects.files, projects.scored);

# Projects that don't work properly and can be filtered out (e.g. wrong sprite names, don't start on green flag etc.)
projects.filter = c(

    # Some sprite or variable has the wrong name
    "K6_S12", # Deleted variable: time
    "K6_S17", # Renamed variable: "Punkte" to "Bunkte"
    "K7_S24", # Deleted variable: time
    "K7_S27", # Renamed Sprite: "Bowl" to "Figur2" (also uses sprite for red line)

    # Zero Coverage
    "K6_S01", # Starts on up key press instead of green flag
    "K6_S06", # Wrong scratch project file (scored 30 points but has no code)
    "K6_S14", # Starts on space key press instead of green flag

    # Game Over on startup
    "K6_S20", # Has to be started twice
    "K7_S18", # Sprites have to be dragged up to make it work

    # Other reasons
    "K7_S07"  # Resets all position when the "a" key is pressed, which gets picked up by random input generation
);

# Properly working projects for which the project file exists and which were scored manually
projects.filtered = setdiff(projects.intersect, projects.filter);
