library(ggplot2);
library(grid);
library(gtable);

# https://stackoverflow.com/questions/32506444/ggplot-function-to-add-text-just-below-legend
annotate_plot = function (plot, label, index = 1) {
    g = ggplotGrob(plot);
    leg = g$grobs[[which(g$layout$name == "guide-box")]];
    textgrob = textGrob(x = unit(5, "points"), label, gp = gpar(cex = 0.9), just = "left");
    width = unit(1, "grobwidth",textgrob) + unit(10, "points");
    height = unit(1, "grobheight", textgrob)+ unit(10, "points");
    labelGrob = gTree("labelGrob", children = gList(textgrob));
    pos = subset(leg$layout, grepl("guides", name), t:r)[index,];
    leg = gtable_add_rows(leg, height, pos = pos$t+1);
    leg = gtable_add_grob(leg, labelGrob, t = pos$t+2, l = pos$l);
    leg$widths[pos$l] = max(width, leg$widths[pos$l]);
    leg$heights[pos$t+1] = unit(20, "pt");
    g$grobs[[which(g$layout$name == "guide-box")]] = leg;
    g$widths[g$layout[grepl("guide-box", g$layout$name), "l"]] = max(width, sum(leg$widths));
    return(g);
}
