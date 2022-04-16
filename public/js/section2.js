var BEST_TEAMS = null;
var BEST_PLAYERS = null;
var TEAM_CONF_LOOKUP = null;
var TEAM_STATS = null;
var PLAYER_STATS = null;

const TEAM = "team";
const PLAYER = "player";

var MODAL_TYPE = "";

var SEASON_START = "1980";
var SEASON_END = "1981";
var SELECTED_TEAM_ID = "";
var SELECTED_PLAYER_ID = "";

let VIZ_MODAL_PARENTS = [
    "plus-minus",
    "team-stats"
]

var VIZ_MODAL_BAR_VARS = [
    {value: "points", display: "Points per Game"},
    {value: "3pm", display: "3-point Makes per Game"},
    {value: "steals", display: "Steals per Game"},
    {value: "rebounds", display: "Rebounds per Game"},
    {value: "turnovers", display: "Turnovers per Game"},
    {value: "assists", display: "Assists per Game"},
    {value: "blocks", display: "Blocks per Game"}
];
var VIZ_MODAL_BAR_VAR_DISPLAY = {
    "points": "Points",
    "3pm": "3-point Makes",
    "steals": "Steals",
    "rebounds": "Rebounds",
    "turnovers": "Turnovers",
    "assists": "Assists",
    "blocks": "Blocks"
};
var VIZ_MODAL_BAR_VARIABLE = "points";

const MARGIN = {top: 30, right: 30, bottom: 30, left: 30};

const generateRectId = (d) => {
    return (d.matchup + d.date).replace(/\s+/g, '').replace(/\./g,'').replace(/\,/g,'').replace(/\@/g,'');
}

/**
 * 
 * @param {*} csvSrc - path/url to CSV file
 * @param {*} callback - callback func upon successful reading of csv 
 * @param {*} onErr - callback func on error reading csv 
 */
 const readCsvData = async (csvSrc) => {
    return d3.csv(csvSrc);
}

const readJsonData = async (jsonSrc) => {
    return d3.json(jsonSrc);
}

const clearInnerHTML = (elemId) => {
    document.getElementById(elemId).innerHTML = "";
}

const showVizModal = (id, listItemType) => {
    VIZ_MODAL_PARENTS.forEach((vizParentId) => {
        clearInnerHTML(vizParentId);
    });
    // Reset selected variable for stat per game visualization
    VIZ_MODAL_BAR_VARIABLE = "points";
    let seasonOption = SEASON_START + "-" + SEASON_END[2] + SEASON_END[3];
    if(listItemType === TEAM) {
        MODAL_TYPE = TEAM;
        renderTeamStats(id, seasonOption);
        renderWinLossBarChart(id, seasonOption);
        SELECTED_TEAM_ID = id;
    }
    else if(listItemType === PLAYER) {
        MODAL_TYPE = PLAYER;
        renderPlayerStats(id, seasonOption);
        SELECTED_PLAYER_ID = id;
    }
    var modal = new bootstrap.Modal(document.getElementById("viz-modal"), {});
    modal.show();
}

const renderPlayerStats = async (playerId, seasonOption) => {
    clearInnerHTML("team-stats");

    // Initialize tooltip
    var tooltip = d3.select("body").append("span")	
        .attr("class", "tooltip")				
        .style("opacity", 0);

    if(PLAYER_STATS === null) {
        PLAYER_STATS = await readJsonData("./data/player_gamelog.json");
    }
    let startSeason = parseInt(seasonOption.split("-")[0])
    let endSeason = (startSeason + 1).toString();
    seasonOption = startSeason.toString() + "-" + endSeason;
    let seasonData = PLAYER_STATS[seasonOption];
    let gameData = seasonData[playerId];
    let playerName = gameData[0].player_name;
    document.getElementById("viz-modal-title").innerHTML = "<h3>" + playerName + " in the " + seasonOption + " Season</h3>";

    // Produce bar chart
    let xVals = gameData.map((game) => {
        return game.date;
    });

    let yVals = gameData.map((game) => {
        if(game[VIZ_MODAL_BAR_VARIABLE] === null) {
            return 0;
        }
        return game[VIZ_MODAL_BAR_VARIABLE];
    }); 

    let height = 400;
    let width = 1050;
    let xScale = d3.scaleBand().domain(xVals).range([0, width]).padding(0.3);
    let yScale = d3.scaleLinear().domain([0, d3.max(yVals)]).range([height, 0]);

    let svg = d3.select("#team-stats")
        .append("svg")
            .attr("width", width + MARGIN.left + MARGIN.right)
            .attr("height", height + MARGIN.top + MARGIN.bottom)
        .append("g")
            .attr("transform", "translate(" + MARGIN.left + "," + MARGIN.top + ")");

    // Render x-axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale)
            .tickFormat("")
        )
        .selectAll(".tick text")
            .attr("font-size", "12");

    // Render y-axis
    svg.append("g")
        .call(d3.axisLeft(yScale)
        ).selectAll(".tick text")
            .attr("font-size", "12");

    // Draw bars 
    svg.selectAll("rect")
        .data(gameData)
        .enter()
            .append("rect")
            .attr("id", (d) => {return generateRectId(d)})
            .attr("x", (d) => {return xScale(d.date)})
            .attr("y", (d) => {
                try {
                    return yScale(d[VIZ_MODAL_BAR_VARIABLE]);
                }
                catch(err) {
                    alert("No data available for " + VIZ_MODAL_BAR_VARIABLE + " in this season");
                }
            })
            .attr("width", xScale.bandwidth())
            .attr("height", (d) => {
                try {
                    return height - yScale(d[VIZ_MODAL_BAR_VARIABLE]);
                }
                catch(err) {
                    alert("No data available for " + VIZ_MODAL_BAR_VARIABLE + " in this season");
                }
            })
            .attr("fill", (d) => {
                return d.winLoss === 0 ? "#EC7063" : "#52BE80";
            })
            .on("mouseover", (e, d) => {
                let rectId = generateRectId(d);
                d3.select("#" + rectId)
                    .style("stroke", "black");
                tooltip.transition()		
                    .duration(200)		
                    .style("opacity", .9);		
                tooltip.html(d.date + "<br>" + d.matchup + "<br>" + VIZ_MODAL_BAR_VAR_DISPLAY[VIZ_MODAL_BAR_VARIABLE] + ": " + d[VIZ_MODAL_BAR_VARIABLE])	
                    .style("padding", "8px")
                    .style("left", (e.pageX) + "px")		
                    .style("top", (e.pageY+15) + "px")
                    .style("background-color", "#D6DBDF");
                })
            .on("mouseout", (e, d) => {		
                let rectId = generateRectId(d);
                d3.select("#" + rectId)
                    .style("stroke", "none");
                tooltip.transition()		
                    .duration(500)	
                    .style("opacity", 0);	
            });

    renderVizModalVarDropdown();
}

const renderPlusMinusStats = (id, seasonOption) => {

}

/**
 * 
 * @param {*} data - Array of data 
 * @param {*} labelKey - Key of the label to display on list group element
 * @param {*} onClick - Event handler for when user selects the list element. Gets called as onClick(e, item, idKey)
 * @param {*} parentId - The id of the HTML element to append the list group to 
 */
const renderListGroup = (data, labelKey, idKey, onClick, parentId, listItemType) => {
    let parentElement = document.getElementById(parentId);
    clearInnerHTML(parentId);
    let listGroup = document.createElement("ul");
    listGroup.classList.add("list-group");
    data.forEach((item, index) => {
        let listItem = document.createElement("li");
        listItem.classList.add("list-group-item");
        listItem.classList.add("list-group-item-action");
        let label = item[labelKey];
        listItem.innerHTML = (index+1).toString() + ". " + label;
        listItem.onclick = (e) => {onClick(e, item, idKey, listItemType)};
        listGroup.appendChild(listItem);
    });
    parentElement.appendChild(listGroup);
}

const evenOutList = (arr, maxSize, labelKey) => {
    if(arr.length < maxSize) {
        let diff = maxSize - arr.length;
        let start = 0;
        while(start < diff) {
            arr.push({[labelKey]: "--"});
            start++;
        }
    }
}

const onClickListItem = (e, item, idKey, listItemType) => {
    if(item[idKey] === undefined) {
        return;
    }
    showVizModal(item[idKey], listItemType);
}

const renderBestTeamsAndPlayers = async (seasonStart, seasonEnd) => {
    // Start loader 
    document.getElementById("section2-loader").style.display = "inline-block";

    // Only read data files once
    if(BEST_TEAMS === null) {
        BEST_TEAMS = await readCsvData("./data/team_standings.csv");
    }
    if(BEST_PLAYERS === null) {
        BEST_PLAYERS = await readCsvData("./data/player_stats.csv");
    }
    if(TEAM_CONF_LOOKUP === null) {
        TEAM_CONF_LOOKUP = await readJsonData("./data/team_conf_lookup.json");
    }

    // Get best teams by standing
    let bestEastTeams = [];
    let bestWestTeams = [];
    BEST_TEAMS.forEach((team) => {
        if(team.seasonStart === seasonStart && team.seasonEnd === seasonEnd) {
            if(TEAM_CONF_LOOKUP[team.id] === "East") {
                bestEastTeams.push(team);
            }
            else {
                bestWestTeams.push(team);
            }
        }
    });
    bestEastTeams.sort((team1, team2) => {
        return parseInt(team1.standing) - parseInt(team2.standing);
    });
    bestWestTeams.sort((team1, team2) => {
        return parseInt(team1.standing) - parseInt(team2.standing);
    });

    // Get best players by ranking
    let bestPlayers = [];
    BEST_PLAYERS.forEach((player) => {
        if(player.SEASON_START === seasonStart && player.SEASON_END === seasonEnd) {
            bestPlayers.push(player);
        }
    });
    bestPlayers.sort((player1, player2) => {
        return parseInt(player1.RANK) - parseInt(player2.RANK);
    });
    // Isolate 10 best players
    let tenBestPlayers = [];
    for(var i = 0; i < 10; i++) {
        tenBestPlayers.push(bestPlayers[i]);
    }

    // Even out the lists 
    let maxSize = Math.max(bestEastTeams.length, bestWestTeams.length, tenBestPlayers.length);
    evenOutList(bestEastTeams, maxSize, "name");
    evenOutList(bestWestTeams, maxSize, "name");
    evenOutList(tenBestPlayers, maxSize, "PLAYER");

    // Render best east teams 
    renderListGroup(bestEastTeams, "name", "id", onClickListItem, "best-east-teams", TEAM);

    // Render best west teams
    renderListGroup(bestWestTeams, "name", "id", onClickListItem, "best-west-teams", TEAM);

    // Render best players
    renderListGroup(tenBestPlayers, "PLAYER", "PLAYER_ID", onClickListItem, "best-players", PLAYER);

    // Stop loader
    document.getElementById("section2-loader").style.display = "none";
}

const onSelectSeasonDropdown = (e, seasonOption, seasonStart, seasonEnd) => {
    let dropdownButton = document.getElementById("season-dropdown-button");
    dropdownButton.innerHTML = seasonOption;
    renderBestTeamsAndPlayers(seasonStart, seasonEnd);
    SEASON_START = seasonStart;
    SEASON_END = seasonEnd;
}

const renderSeasonDropdownOptions = () => {
    let startYear = 1980;
    let endYear = 2020;
    let dropdownMenu = document.getElementById("season-dropdown-menu");
    while(startYear <= endYear) {
        let startYearStr = startYear.toString();
        let endYearStr = (startYear+1).toString();
        let seasonOption = startYearStr + "-" + endYearStr[2] + endYearStr[3];
        
        let dropdownItem = document.createElement("li");
        let dropdownLink = document.createElement("a");
        dropdownLink.classList.add("dropdown-item");
        dropdownLink.innerHTML = seasonOption;
        dropdownItem.onclick = (e) => {onSelectSeasonDropdown(e, seasonOption, startYearStr, endYearStr)};
        dropdownItem.appendChild(dropdownLink);
        dropdownMenu.appendChild(dropdownItem);

        startYear++;
    }
}

const onSelectVizModalVarDropdown = (selectedVar, display) => {
    let seasonOption = SEASON_START + "-" + SEASON_END[2] + SEASON_END[3];
    VIZ_MODAL_BAR_VARIABLE = selectedVar;
    if(MODAL_TYPE === TEAM) {
        renderTeamStats(SELECTED_TEAM_ID, seasonOption);
    }
    else if(MODAL_TYPE === PLAYER) {
        renderPlayerStats(SELECTED_PLAYER_ID, seasonOption);
    }
    document.getElementById("variable-dropdown-button").innerHTML = display;
}

const renderVizModalVarDropdown = () => {
    let dropdownButton = document.getElementById("variable-dropdown-button");
    let dropdownMenu = document.getElementById("variable-dropdown-menu");

    // Clear children first
    dropdownMenu.innerHTML = "";
    dropdownButton.innerHTML = "";

    // Set dropdownButton with default value
    dropdownButton.innerHTML = VIZ_MODAL_BAR_VARS[0].display;

    // Render options
    VIZ_MODAL_BAR_VARS.forEach((metadata) => {
        let dropdownItem = document.createElement("li");
        let dropdownLink = document.createElement("a");
        dropdownLink.classList.add("dropdown-item");
        dropdownLink.innerHTML = metadata.display;
        dropdownItem.onclick = (e) => {
            onSelectVizModalVarDropdown(metadata.value, metadata.display);
        }
        dropdownItem.appendChild(dropdownLink);
        dropdownMenu.appendChild(dropdownItem);
    });
}

const renderTeamStats = async (teamId, seasonOption) => {
    clearInnerHTML("team-stats");

    // Initialize tooltip
    var tooltip = d3.select("body").append("span")	
        .attr("class", "tooltip")				
        .style("opacity", 0);

    if(TEAM_STATS === null) {
        TEAM_STATS = await readJsonData("./data/team_stats_details.json");
    }
    let seasonData = TEAM_STATS[seasonOption];
    let gameData = seasonData[teamId].games;
    let teamName = seasonData[teamId].name;
    document.getElementById("viz-modal-title").innerHTML = "<h3>" + teamName + " in the " + seasonOption + " Season</h3>";

    // Produce bar chart
    let xVals = gameData.map((game) => {
        return game.date;
    });

    let yVals = gameData.map((game) => {
        if(game[VIZ_MODAL_BAR_VARIABLE] === null) {
            return 0;
        }
        return game[VIZ_MODAL_BAR_VARIABLE];
    }); 

    let height = 400;
    let width = 1050;
    let xScale = d3.scaleBand().domain(xVals).range([0, width]).padding(0.3);
    let yScale = d3.scaleLinear().domain([0, d3.max(yVals)]).range([height, 0]);

    let svg = d3.select("#team-stats")
        .append("svg")
            .attr("width", width + MARGIN.left + MARGIN.right)
            .attr("height", height + MARGIN.top + MARGIN.bottom)
        .append("g")
            .attr("transform", "translate(" + MARGIN.left + "," + MARGIN.top + ")");

    // Render x-axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale)
            .tickFormat("")
        )
        .selectAll(".tick text")
            .attr("font-size", "12");

    // Render y-axis
    svg.append("g")
        .call(d3.axisLeft(yScale)
        ).selectAll(".tick text")
            .attr("font-size", "12");

    // Draw bars 
    svg.selectAll("rect")
        .data(gameData)
        .enter()
            .append("rect")
            .attr("id", (d) => {return generateRectId(d)})
            .attr("x", (d) => {return xScale(d.date)})
            .attr("y", (d) => {
                try {
                    return yScale(d[VIZ_MODAL_BAR_VARIABLE]);
                }
                catch(err) {
                    alert("No data available for " + VIZ_MODAL_BAR_VARIABLE + " in this season");
                }
            })
            .attr("width", xScale.bandwidth())
            .attr("height", (d) => {
                try {
                    return height - yScale(d[VIZ_MODAL_BAR_VARIABLE]);
                }
                catch(err) {
                    alert("No data available for " + VIZ_MODAL_BAR_VARIABLE + " in this season");
                }
            })
            .attr("fill", (d) => {
                return d.winLoss === 0 ? "#EC7063" : "#52BE80";
            })
            .on("mouseover", (e, d) => {
                let rectId = generateRectId(d);
                d3.select("#" + rectId)
                    .style("stroke", "black");
                tooltip.transition()		
                    .duration(200)		
                    .style("opacity", .9);		
                tooltip.html(d.date + "<br>" + d.matchup + "<br>" + VIZ_MODAL_BAR_VAR_DISPLAY[VIZ_MODAL_BAR_VARIABLE] + ": " + d[VIZ_MODAL_BAR_VARIABLE] + "<br>Result: " + (d.winLoss === 0 ? "Loss" : "Win"))	
                    .style("padding", "8px")
                    .style("left", (e.pageX) + "px")		
                    .style("top", (e.pageY+15) + "px")
                    .style("background-color", "#D6DBDF");
                })
            .on("mouseout", (e, d) => {		
                let rectId = generateRectId(d);
                d3.select("#" + rectId)
                    .style("stroke", "none");
                tooltip.transition()		
                    .duration(500)	
                    .style("opacity", 0);	
            });

    renderVizModalVarDropdown();
}

const renderWinLossBarChart = async (teamId, seasonOption) => {
    if(TEAM_STATS === null) {
        TEAM_STATS = await readJsonData("./data/team_stats_details.json");
    }
    let seasonData = TEAM_STATS[seasonOption];
    let gameData = seasonData[teamId].games;
    let teamName = seasonData[teamId].name;

    // Negative values = losing streak. Ex: -1 = 1 game losing streak, -3 = 3 game losing streak
    // Positive values = winning streak. Ex: 1 = 1 game win streak, 3 = 3 game win streak 
    let winLossData = [];
    for(var i = 0; i < gameData.length; i++) {
        let game = gameData[i];
        if(i-1 >= 0) {
            let currentStreak = winLossData[i-1];
            if(game.winLoss === 0) {
                if(currentStreak < 0) {
                    winLossData.push(currentStreak-1);
                }
                else {
                    winLossData.push(-1);
                }
            }
            else {
                if(currentStreak > 0) {
                    winLossData.push(currentStreak+1);
                }
                else {
                    winLossData.push(1);
                }
            }
        }
        else {
            winLossData.push(game.winLoss === 0 ? -1 : 1);
        }
    }

    let xVals = winLossData.map((d, index) => {
        return index;
    });

    let yVals = winLossData.map((d) => {
        return d;
    });

    let height = 200;
    let width = 1050;

    let minY = d3.min(yVals);
    let maxY = d3.max(yVals);

    let commonY = Math.max(Math.abs(minY), maxY);
    minY = 0 - commonY;
    maxY = Math.abs(commonY);

    let xScale = d3.scaleBand().domain(xVals).range([0, width]).padding(0.3);
    let yScale = d3.scaleLinear().domain([minY, maxY]).range([height, 0]);

    // Initialize tooltip
    var tooltip = d3.select("body").append("span")	
        .attr("class", "tooltip")				
        .style("opacity", 0);

    let svg = d3.select("#plus-minus")
        .append("svg")
            .attr("width", width + MARGIN.left + MARGIN.right)
            .attr("height", height + MARGIN.top + MARGIN.bottom)
        .append("g")
            .attr("transform", "translate(" + MARGIN.left + "," + MARGIN.top + ")");

    // Render x-axis
    svg.append("g")
        .attr("transform", "translate(0," + height/2 + ")")
        .call(d3.axisBottom(xScale)
            .tickFormat("")
        )
        .selectAll(".tick text")
            .attr("font-size", "12");

    // Render y-axis
    svg.append("g")
        .call(d3.axisLeft(yScale)
            .tickSize(-5)
        ).selectAll(".tick text")
            .attr("font-size", "12");

    svg.selectAll("circle")
        .data(yVals)
        .enter()
            .append("circle")
                .attr("cx", (d, index) => {return xScale(index)+4})
                .attr("cy", (d) => {return yScale(d)})
                .attr("r", 4.5)
                .attr("fill", "#2E86C1")
                .on("mouseover", (e, d) => {
                    tooltip.transition()		
                        .duration(200)		
                        .style("opacity", .9);		
                    tooltip.html((d > 0) ? "🏆 Winning Streak: " + d : "❌ Losing Streak: " + Math.abs(d))	
                        .style("padding", "8px")
                        .style("left", (e.pageX) + "px")		
                        .style("top", (e.pageY+15) + "px")
                        .style("background-color", "#D6DBDF");
                    })
                .on("mouseout", (e, d) => {		
                    tooltip.transition()		
                        .duration(500)	
                        .style("opacity", 0);	
                });

    // Draw lines
    svg.append("path")
        .datum(yVals)
        .attr("fill", "none")
        .attr("stroke", (d) => {
            return "#5DADE2"
        })
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x((d, index) => { return xScale(index)+4})
            .y((d) => {return yScale(d)})
        );

    // Draw bars
    // svg.selectAll("rect")
    //     .data(yVals)
    //     .enter()
    //         .append("rect")
    //         .attr("x", (d, index) => {return xScale(index)})
    //         .attr("y", (d) => {
    //             if(d < 0) {
    //                 return height/2;
    //             }
    //             return yScale(Math.abs(d));
    //         })
    //         .attr("width", xScale.bandwidth())
    //         .attr("height", (d) => {
    //             if(d < 0) {
    //                 return height/2 - yScale(Math.abs(d));
    //             }
    //             return height/2 - yScale(Math.abs(d));
    //             // if(d < 0) {
    //             //     console.log(yScale(Math.abs(d)));
    //             //     return yScaleNeg(d);
    //             // }
    //             // else {
    //             //     return height/2 - yScale(d);
    //             //}
    //         })
    //         .attr("fill", (d) => {
    //             return d < 0 ? "#E74C3C" : "#229954";
    //         });
}