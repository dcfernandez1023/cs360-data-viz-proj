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

var STAT_COLORS = {
    "3P": "#E74C3C",
    "PTS": "#9B59B6",
    "STL": "#2980B9",
    "TRB": "#1ABC9C",
    "TOV": "#27AE60",
    "AST": "#F1C40F",
    "BLK": "#717D7E"
};

const generateCircleId = (d, stat) => {
    return "section3-" + stat + "-" + d.Season;
}

const onSelectStat = (stat, display, index) => {
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
    renderAvgStats();
}

const renderStatSelectDropdown = () => {
    let dropdownButton = document.getElementById("statavg-dropdown-button");
    let dropdownMenu = document.getElementById("statavg-dropdown-menu");

    // Clear children first
    dropdownMenu.innerHTML = "";

    SELECTABLE_STATS.forEach((metadata, index) => {
        let dropdownItem = document.createElement("li");
        let dropdownLink = document.createElement("a");
        dropdownLink.classList.add("dropdown-item");
        dropdownLink.innerHTML = SELECTED_STATS[metadata.value] ? "✔️ " + metadata.display : metadata.display;
        dropdownLink.onclick = (e) => {
            onSelectStat(metadata.value, metadata.display, index);
        }
        dropdownItem.appendChild(dropdownLink);
        dropdownMenu.appendChild(dropdownItem);
    });
}

const onChangeGraphSlider = (vals) => {
    let valArr = vals.split(",");
    let start = parseInt(valArr[0]);
    let end = parseInt(valArr[1]);
    // Clear svg
    d3.select("#section-3-svg").remove();
    // Re-render graph
    renderAvgStats(start, end);
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

    // let yVals = SEASON_AVGS.map((data) => {
    //     return parseFloat(data[stat]);
    // });
    
    // Initialize tooltip
    var tooltip = d3.select("body").append("span")	
        .attr("class", "tooltip")				
        .style("opacity", 0);
        
    let selectedStats = Object.keys(SELECTED_STATS);
    let yMax = Number.MIN_VALUE;
    selectedStats.forEach((stat) => {
        let statMax = d3.max(filteredAvgs, (d) => {
            return parseFloat(d[stat]);
        });
        yMax = statMax > yMax ? statMax : yMax;
    });

    // Render y-axis
    let yScale = d3.scaleLinear().domain([0, yMax]).range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(yScale)
            .tickSize(-5)
            .tickPadding(10)
        ).selectAll(".tick text")
            .attr("font-size", "12");
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("x", 0)
        .attr("y", -SEC_3_MARGIN.left + 25)
        .attr("font-weight", "bold")
        .text("Avg. Stat Amount per Game");
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
                    tooltip.html("Season: " + seasonAvg.Season + "<br>" + stat + ": " + seasonAvg[stat])	
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