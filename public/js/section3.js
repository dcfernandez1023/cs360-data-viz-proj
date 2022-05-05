var SEASON_AVGS = null;
var SELECTED_STATS = {"3P": true};
var SELECTABLE_STATS = [
    {value: "3P", display: "3-point Makes", color: "#E74C3C"},
    {value: "PTS", display: "Points", color: "#9B59B6"},
    {value: "STL", display: "Steals", color: "#2980B9"},
    {value: "TRB", display: "Rebounds", color: "#1ABC9C"},
    {value: "TOV", display: "Turnovers", color: "#27AE60"},
    {value: "AST", display: "Assists", color: "#F1C40F"},
    {value: "BLK", display: "Blocks", color: "#717D7E"}
];

var SEC_3_MARGIN = {
    left: 75,
    right: 30,
    top: 30,
    bottom: 30
}

var SEASON_START_SEC_3 = "1980";
var SEASON_END_SEC_3 = "1981";

var IS_SMALL_MULTIPLES = false;
var IS_START_ZERO = true;

var STAT_COLORS = {
    "3P": "#E74C3C",
    "PTS": "#9B59B6",
    "STL": "#2980B9",
    "TRB": "#1ABC9C",
    "TOV": "#27AE60",
    "AST": "#F1C40F",
    "BLK": "#717D7E"
};

var STAT_TITLES = {
    "3P": "3-Point Makes",
    "PTS": "Points",
    "STL": "Steals",
    "TRB": "Rebounds",
    "TOV": "Turnovers",
    "AST": "Assists",
    "BLK": "Blocks"
};

const generateCircleId = (d, stat) => {
    return "section3-" + stat + "-" + d.Season;
}

const onChangeSmallMultipleSwitch = () => {
    IS_SMALL_MULTIPLES = !IS_SMALL_MULTIPLES;
    renderSeasonAvgs(SEASON_START_SEC_3, SEASON_END_SEC_3);
}

const onChangeStartZeroSwitch = () => {
    IS_START_ZERO = !IS_START_ZERO;
    renderSeasonAvgs(SEASON_START_SEC_3, SEASON_END_SEC_3);
}

const onSelectStat = (e, stat, display, index) => {
    e.stopPropagation();
    if(SELECTED_STATS[stat]) {
        delete SELECTED_STATS[stat];
        // Remove badge
        document.getElementById(stat).remove();
    }
    else {
        SELECTED_STATS[stat] = true;
        // Add badge 
        let badge = document.createElement("span");
        badge.classList.add("badge");
        badge.classList.add("rounded-pill");
        badge.style.backgroundColor = STAT_COLORS[stat];
        badge.style.marginLeft = "3px";
        badge.style.marginRight = "3px";
        badge.id = stat;
        badge.innerHTML = display;
        document.getElementById("stat-badges").appendChild(badge);
    }
    // Clear svg
    d3.select("#section-3-svg").remove();
    // Re-render graph
    renderSeasonAvgs(SEASON_START_SEC_3,SEASON_END_SEC_3);
}

const renderStatSelectDropdown = () => {
    let dropdownMenu = document.getElementById("statavg-dropdown-menu");

    // Clear children first
    dropdownMenu.innerHTML = "";

    SELECTABLE_STATS.forEach((metadata, index) => {
        let dropdownItem = document.createElement("li");
        let dropdownLink = document.createElement("a");
        dropdownLink.classList.add("dropdown-item");
        dropdownLink.innerHTML = SELECTED_STATS[metadata.value] ? "✔️ " + metadata.display : metadata.display;
        dropdownLink.onclick = (e) => {
            onSelectStat(e, metadata.value, metadata.display, index);
        }
        dropdownItem.appendChild(dropdownLink);
        dropdownMenu.appendChild(dropdownItem);
    });
}

const onChangeGraphSlider = (vals) => {
    let valArr = vals.split(",");
    let start = parseInt(valArr[0]);
    let end = parseInt(valArr[1]);
    SEASON_START_SEC_3 = start.toString();
    SEASON_END_SEC_3 = end.toString();
    // Clear svg
    d3.select("#section-3-svg").remove();
    // Re-render graph
    renderSeasonAvgs(start, end);
}

const parseYearsFromSeason = (season) => {
    let valArr = season.split("-");
    let start = parseInt(valArr[0]);
    return [start, start+1];
}

const renderGraphSlider = () => {
    let seasonStart = parseInt(SEASON_START_SEC_3);
    let seasonEnd = 2021;
    let seasons = [];
    let start = seasonStart;
    while(start <= seasonEnd) {
        seasons.push(start++);
    }
    var slider = new rSlider({
        target: '#slider',
        values: seasons,
        range: true,
        set: [seasonStart, seasonEnd],
        tooltip: true,
        labels: false,
        onChange: (vals) => {
            onChangeGraphSlider(vals);
        }
    });
}

const renderSmallMultiples = async (startYear, endYear) => {
    renderStatSelectDropdown();

    if(SEASON_AVGS === null) {
        SEASON_AVGS = await readCsvData("./data/season_avgs.csv");
        SEASON_AVGS.reverse();
    }

    let filteredAvgs = [];
    for(var i = 0; i < SEASON_AVGS.length; i++) {
        let d = SEASON_AVGS[i];
        if(startYear === undefined || endYear === undefined) {
            filteredAvgs.push(d);
        }
        else {
            let startEnd = parseYearsFromSeason(d.Season);
            let seasonStartYear = startEnd[0];
            let seasonEndYear = startEnd[1];
            if(seasonStartYear >= startYear && seasonEndYear <= endYear) {
                filteredAvgs.push(d);
            }
        }
    }

    let row = document.getElementById("small-multiples");
    row.innerHTML = "";

    // Initialize tooltip
    var tooltip = d3.select("body").append("span")	
        .attr("class", "tooltip")				
        .style("opacity", 0);

    let height = 200;
    let selectedStats = Object.keys(SELECTED_STATS);
    selectedStats.forEach((stat, index) => {
        let col = document.createElement("div");
        col.classList.add("col-md-6");
        let colId = "small-multiple-" + stat;
        col.id = colId;
        col.style.marginBottom = "12px";
        row.appendChild(col);
        let width = col.clientWidth - (SEC_3_MARGIN.left + SEC_3_MARGIN.right) - 15;

        let svg = d3.select("#" + colId)
            .append("svg")
                .attr("id", "section-3-svg")
                .attr("width", width + SEC_3_MARGIN.left + SEC_3_MARGIN.right)
                .attr("height", height + SEC_3_MARGIN.top + SEC_3_MARGIN.bottom)
                .style("background-color", "white")
            .append("g")
                .attr("transform", "translate(" + SEC_3_MARGIN.left + "," + SEC_3_MARGIN.top + ")");

        // Render x-axis 
        let xVals = filteredAvgs.map((data) => {
            return data.Season;
        });
        let tickVals = [];
        tickVals.push(xVals[0]);
        tickVals.push(xVals[parseInt(xVals.length *.25)]);
        tickVals.push(xVals[parseInt(xVals.length * .5)]);
        tickVals.push(xVals[parseInt(xVals.length * .75)]);
        tickVals.push(xVals[xVals.length - 1]);
        let xScale = d3.scalePoint().domain(xVals).range([0, width]);
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xScale)
                .tickValues(tickVals)
            )
            .selectAll(".tick text")
                .attr("font-size", "12");

        // Render y-axis
        let yMin = IS_START_ZERO ? 0 : d3.min(filteredAvgs, (d) => {
            return parseFloat(d[stat]);
        });
        let yMax = d3.max(filteredAvgs, (d) => {
            return parseFloat(d[stat]);
        });
        let yScale = d3.scaleLinear().domain([yMin, yMax]).range([height, 0]);
        svg.append("g")
            .call(d3.axisLeft(yScale)
                .tickSize(-5)
                .tickPadding(10)
                .ticks(5)
            ).selectAll(".tick text")
                .attr("font-size", "12");
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", 0)
            .attr("y", -10)
            .attr("font-size", 14)
            .attr("font-weight", "bold")
            .attr("fill", STAT_COLORS[stat])
            .text(STAT_TITLES[stat]);
        svg.append("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("x", -(height/2) + SEC_3_MARGIN.bottom)
            .attr("y", -SEC_3_MARGIN.left + 25)
            .attr("font-size", 11)
            .text("Avg. Stat Amount per Season");

        // Draw lines
        svg.append("path")
            .datum(filteredAvgs)
            .attr("fill", "none")
            .attr("stroke", STAT_COLORS[stat])
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x((d) => { return xScale(d.Season)})
                .y((d) => {return yScale(d[stat])})
            );

        // Draw circles
        filteredAvgs.forEach((seasonAvg) => {
            svg.append("circle")
                .attr("id", generateCircleId(seasonAvg, stat))
                .attr("cx", xScale(seasonAvg.Season))
                .attr("cy", yScale(seasonAvg[stat]))
                .attr("r", 5)
                .attr("fill", STAT_COLORS[stat])
                .on("mouseover", (e, d) => {
                    let circleId = generateCircleId(seasonAvg, stat);
                    d3.select("#" + circleId)
                        .style("stroke", "black");
                    tooltip.transition()		
                        .duration(200)		
                        .style("opacity", .9);		
                    tooltip.html("Season: " + seasonAvg.Season + "<br>Avg. " + stat + ": " + seasonAvg[stat])	
                        .style("padding", "8px")
                        .style("left", (e.pageX) + "px")		
                        .style("top", (e.pageY+15) + "px")
                        .style("background-color", "#D6DBDF");
                    })
                .on("mouseout", (e, d) => {	
                    let circleId = generateCircleId(seasonAvg, stat);
                    d3.select("#" + circleId)
                        .style("stroke", "none");
                    tooltip.transition()		
                        .duration(500)	
                        .style("opacity", 0);	
                });
        });
    });
}

const renderAvgStats = async (startYear, endYear) => {
    renderStatSelectDropdown();

    if(SEASON_AVGS === null) {
        SEASON_AVGS = await readCsvData("./data/season_avgs.csv");
        SEASON_AVGS.reverse();
    }

    let width = 1200;
    let height = 400;

    let svg = d3.select("#section-3-viz")
        .append("svg")
            .attr("id", "section-3-svg")
            .attr("width", width + SEC_3_MARGIN.left + SEC_3_MARGIN.right)
            .attr("height", height + SEC_3_MARGIN.top + SEC_3_MARGIN.bottom)
            .style("background-color", "white")
        .append("g")
            .attr("transform", "translate(" + SEC_3_MARGIN.left + "," + SEC_3_MARGIN.top + ")");

    let filteredAvgs = [];
    for(var i = 0; i < SEASON_AVGS.length; i++) {
        let d = SEASON_AVGS[i];
        if(startYear === undefined || endYear === undefined) {
            filteredAvgs.push(d);
        }
        else {
            let startEnd = parseYearsFromSeason(d.Season);
            let seasonStartYear = startEnd[0];
            let seasonEndYear = startEnd[1];
            if(seasonStartYear >= startYear && seasonEndYear <= endYear) {
                filteredAvgs.push(d);
            }
        }
    }

    // Render x-axis 
    let xVals = filteredAvgs.map((data) => {
        return data.Season;
    });
    let tickVals = [];
    tickVals.push(xVals[0]);
    tickVals.push(xVals[parseInt(xVals.length *.25)]);
    tickVals.push(xVals[parseInt(xVals.length * .5)]);
    tickVals.push(xVals[parseInt(xVals.length * .75)]);
    tickVals.push(xVals[xVals.length - 1]);
    let xScale = d3.scalePoint().domain(xVals).range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale)
            .tickValues(tickVals)
        )
        .selectAll(".tick text")
            .attr("font-size", "12");
    
    // Initialize tooltip
    var tooltip = d3.select("body").append("span")	
        .attr("class", "tooltip")				
        .style("opacity", 0);
        
    let selectedStats = Object.keys(SELECTED_STATS);
    let yMin = Number.MAX_VALUE;
    let yMax = Number.MIN_VALUE;
    selectedStats.forEach((stat) => {
        let statMin = d3.min(filteredAvgs, (d) => {
            return parseFloat(d[stat]);
        });
        let statMax = d3.max(filteredAvgs, (d) => {
            return parseFloat(d[stat]);
        });
        yMin = statMax < yMin ? statMin : yMin;
        yMax = statMax > yMax ? statMax : yMax;
    });

    // Render y-axis
    yMin = IS_START_ZERO ? 0 : yMin;
    let yScale = d3.scaleLinear().domain([yMin, yMax]).range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(yScale)
            .tickSize(-5)
            .tickPadding(10)
        ).selectAll(".tick text")
            .attr("font-size", "12");
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height/2) + SEC_3_MARGIN.bottom)
        .attr("y", -SEC_3_MARGIN.left + 25)
        .text("Avg. Stat Amount per Season");

    selectedStats.forEach((stat, index) => {
        // Draw lines
        svg.append("path")
            .datum(filteredAvgs)
            .attr("fill", "none")
            .attr("stroke", STAT_COLORS[stat])
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x((d) => { return xScale(d.Season)})
                .y((d) => {return yScale(d[stat])})
            );
        // Draw circles
        filteredAvgs.forEach((seasonAvg) => {
            svg.append("circle")
                .attr("id", generateCircleId(seasonAvg, stat))
                .attr("cx", xScale(seasonAvg.Season))
                .attr("cy", yScale(seasonAvg[stat]))
                .attr("r", 5)
                .attr("fill", STAT_COLORS[stat])
                .on("mouseover", (e, d) => {
                    let circleId = generateCircleId(seasonAvg, stat);
                    d3.select("#" + circleId)
                        .style("stroke", "black");
                    tooltip.transition()		
                        .duration(200)		
                        .style("opacity", .9);		
                    tooltip.html("Season: " + seasonAvg.Season + "<br>Avg. " + stat + ": " + seasonAvg[stat])	
                        .style("padding", "8px")
                        .style("left", (e.pageX) + "px")		
                        .style("top", (e.pageY+15) + "px")
                        .style("background-color", "#D6DBDF");
                    })
                .on("mouseout", (e, d) => {	
                    let circleId = generateCircleId(seasonAvg, stat);
                    d3.select("#" + circleId)
                        .style("stroke", "none");
                    tooltip.transition()		
                        .duration(500)	
                        .style("opacity", 0);	
                });
        });
    });
}

const renderSeasonAvgs = async (startYear, endYear) => {
    // Clear innerHTML to reset on every render
    document.getElementById("section-3-viz").innerHTML = "";
    document.getElementById("small-multiples").innerHTML = "";
    if(IS_SMALL_MULTIPLES) {
        renderSmallMultiples(startYear, endYear);
    }
    else {
        renderAvgStats(startYear, endYear);
    }
}