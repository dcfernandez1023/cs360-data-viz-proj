var SEASON_AVGS = null;
var SELECTED_STAT = "3P";
var SELECTED_STATS = [
    "3P",
    "TOV"
];

let STAT_COLORS = [
    "blue",
    "green"
]

const renderAvgStats = async () => {
    if(SEASON_AVGS === null) {
        SEASON_AVGS = await readCsvData("./data/season_avgs.csv");
        SEASON_AVGS.reverse();
    }
    console.log(SEASON_AVGS);

    let width = 900;
    let height = 550;

    let svg = d3.select("#section-3-viz")
        .append("svg")
            .attr("width", width + MARGIN.left + MARGIN.right)
            .attr("height", height + MARGIN.top + MARGIN.bottom)
            .style("background-color", "white")
        .append("g")
            .attr("transform", "translate(" + MARGIN.left + "," + MARGIN.top + ")");

    // Render x-axis 
    let xVals = SEASON_AVGS.map((data) => {
        return data.Season;
    });
    let tickVals = [];
    tickVals.push(xVals[0]);
    tickVals.push(xVals[parseInt(xVals.length *.25)]);
    tickVals.push(xVals[parseInt(xVals.length * .5)]);
    tickVals.push(xVals[parseInt(xVals.length * .75)]);
    tickVals.push(xVals[xVals.length - 1]);
    console.log(tickVals);
    let xScale = d3.scalePoint().domain(xVals).range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale)
            .tickValues(tickVals)
        )
        .selectAll(".tick text")
            .attr("font-size", "12");

    // let yVals = SEASON_AVGS.map((data) => {
    //     return parseFloat(data[stat]);
    // });
    let yMax = Number.MAX_VALUE;
    SELECTED_STATS.forEach((stat) => {
        yMax = d3.max(SEASON_AVGS, (d) => {
            return parseFloat(d[stat]);
        });
    });
    console.log(yMax);

    // Render y-axis
    let yScale = d3.scaleLinear().domain([0, yMax]).range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(yScale)
            .tickSize(-5)
            .tickPadding(10)
        ).selectAll(".tick text")
            .attr("font-size", "12");
    SELECTED_STATS.forEach((stat, index) => {
        // Draw lines
        svg.append("path")
            .datum(SEASON_AVGS)
            .attr("fill", "none")
            .attr("stroke", STAT_COLORS[index])
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x((d) => { return xScale(d.Season)})
                .y((d) => {return yScale(d[stat])})
            );
    });

    // // Render y-axis
    // let yVals = SEASON_AVGS.map((data) => {
    //     return parseFloat(data[SELECTED_STAT]);
    // });
    // console.log(yVals);
    // let yScale = d3.scaleLinear().domain([0, d3.max(yVals)]).range([height, 0]);
    // svg.append("g")
    //     .call(d3.axisLeft(yScale)
    //         .tickSize(-width)
    //         .tickPadding(10)
    //     ).selectAll(".tick text")
    //         .attr("font-size", "12");

    // // Draw line chart
    // svg.append("path")
    //     .datum(SEASON_AVGS)
    //     .attr("fill", "none")
    //     .attr("stroke", "blue")
    //     .attr("stroke-width", 1.5)
    //     .attr("d", d3.line()
    //         .x((d) => { return xScale(d.Season)})
    //         .y((d) => {return yScale(d[SELECTED_STAT])})
    //     );
        
    // svg.append("text")
    //     .attr("text-anchor", "end")
    //     .attr("transform", "rotate(-90)")
    //     .attr("y", -MARGIN.left + AXIS_LABEL_MARGIN)
    //     .attr("x", -MARGIN.top)
    //     .attr("font-weight", "bold")
    //     .text(Y_LABEL);
    
    // Render x-axis title
    // svg.append("text")
    //     .attr("text-anchor", "end")
    //     .attr("x", width)
    //     .attr("y", height + MARGIN.top + AXIS_LABEL_MARGIN)
    //     .attr("font-weight", "bold")
    //     .text(X_LABEL);
}