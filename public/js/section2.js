// Globals holding the data read from the server to avoid re-reading twice
var BEST_TEAMS = null;
var BEST_PLAYERS = null;
var TEAM_CONF_LOOKUP = null;
var TEAM_STATS = null;
var PLAYER_STATS = null;
var PLAYER_SHOTLOG = null;
var TEAM_SHOTLOG = null;

const TEAM = "team";
const PLAYER = "player";

var MODAL_TYPE = "";

var TIME_SERIES_INTERVAL_F = null;

var SEASON_STOP = 2020;

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

const stopTimeProgression = () => {
    clearInterval(TIME_SERIES_INTERVAL_F);
    TIME_SERIES_INTERVAL_F = null;
    let startStopBtn = document.getElementById("start-stop-progression");
    startStopBtn.innerHTML = "▶️ Start";
    startStopBtn.onclick = () => {
        renderBestTeamsAndPlayers(SEASON_START, SEASON_END, true);
    }
}

// Helper function to read CSV 
 const readCsvData = async (csvSrc) => {
    return d3.csv(csvSrc);
}

// Helper function to read JSON
const readJsonData = async (jsonSrc) => {
    return d3.json(jsonSrc);
}

// Helper function to clear children of an HTML element
const clearInnerHTML = (elemId) => {
    document.getElementById(elemId).innerHTML = "";
}

// Loads data for the website and then proceeds to execute @param callback on success, or @param onErr on error
const loadVizData = async (callback, onErr) => {
    try {
        if(BEST_TEAMS === null) {
            BEST_TEAMS = await readCsvData("./data/team_standings.csv");
        }
        if(BEST_PLAYERS === null) {
            BEST_PLAYERS = await readCsvData("./data/player_stats.csv");
        }
        if(TEAM_CONF_LOOKUP === null) {
            TEAM_CONF_LOOKUP = await readJsonData("./data/team_conf_lookup.json");
        }
        if(TEAM_STATS === null) {
            TEAM_STATS = await readJsonData("./data/team_stats_details.json");
        }
        if(PLAYER_SHOTLOG === null) {
            PLAYER_SHOTLOG = await readJsonData("./data/player_shotlog.json");
        }
        callback();
    }
    catch(err) {
        onErr(err);
    }
}

// Shows the visualization modal for the second section after the user selects a team or player
const showVizModal = (id, listItemType) => {
    VIZ_MODAL_PARENTS.forEach((vizParentId) => {
        clearInnerHTML(vizParentId);
    });
    // Reset selected variable for stat per game visualization
    VIZ_MODAL_BAR_VARIABLE = "points";
    let seasonOption = SEASON_START + "-" + SEASON_END[2] + SEASON_END[3];
    // Case for user selecting a team
    if(listItemType === TEAM) {
        MODAL_TYPE = TEAM;
        renderTeamStats(id, seasonOption);
        renderWinLossBarChart(id, seasonOption);
        renderShotLog(id, seasonOption, TEAM);
        SELECTED_TEAM_ID = id;
        document.getElementById("diverging-line-title").innerHTML = "Winning and Losing Streaks";
    }
    // Case for user selecting a player
    else if(listItemType === PLAYER) {
        MODAL_TYPE = PLAYER;
        renderPlayerStats(id, seasonOption);
        renderPlayerPlusMinus(id, seasonOption);
        renderShotLog(id, seasonOption, PLAYER);
        SELECTED_PLAYER_ID = id;
        document.getElementById("diverging-line-title").innerHTML = "Plus Minus (+/-)";
    }
    // Show the modal
    var modal = new bootstrap.Modal(document.getElementById("viz-modal"), {});
    modal.show();   
}

// Helper function to generate the tooltips for the shot chart 
const generateShotLogTooltip = (d, type) => {
    let year = parseInt(d.GAME_DATE[0] + d.GAME_DATE[1] + d.GAME_DATE[2] + d.GAME_DATE[3]);
    let month = parseInt(d.GAME_DATE[4] + d.GAME_DATE[5]);
    let day = parseInt(d.GAME_DATE[6] + d.GAME_DATE[7]);
    let gameDate = new Date(year, month-1, day);
    let makeMiss = "<strong>Result:</strong> " + (d.SHOT_MADE_FLAG === 0 ? "Miss" : "Make");
    let tooltipText = "";
    if(type === PLAYER) {
        tooltipText = "<strong>Matchup:</strong> " + d.HTM + " vs. " + d.VTM + " on " + gameDate.toLocaleDateString() 
        + "<br>" + "<strong>Shot type:</strong> " + d.ACTION_TYPE + ", " + d.SHOT_TYPE 
        + "<br>" + "<strong>Shot Zone:</strong> " + d.SHOT_ZONE_AREA  
        + "<br>" + "<strong>Distance:</strong> " + d.SHOT_DISTANCE + " ft."
        + "<br>" + makeMiss;
    }
    else if(type === TEAM) {
        tooltipText = "<strong>Player:</strong> " + d.PLAYER_NAME + " on " + gameDate.toLocaleDateString() 
        + "<br>" + "<strong>Shot type:</strong> " + d.ACTION_TYPE + ", " + d.SHOT_TYPE 
        + "<br>" + "<strong>Shot Zone:</strong> " + d.SHOT_ZONE_AREA  
        + "<br>" + "<strong>Distance:</strong> " + d.SHOT_DISTANCE + " ft."
        + "<br>" + makeMiss;
    }
    return tooltipText;
}

// Renders the shot log onto the visualization modal
const renderShotLog = async (id, seasonOption, type) => {
    clearInnerHTML("shot-chart-container");
    let startSeason = parseInt(seasonOption.split("-")[0])
    let endSeason = (startSeason + 1).toString();
    seasonOption = startSeason.toString() + "-" + endSeason;
    let shotRoot = {};
    if(PLAYER_SHOTLOG === null) {
        PLAYER_SHOTLOG = await readJsonData("./data/player_shotlog.json");
        shotRoot = PLAYER_SHOTLOG;
    }
    // Reads files by concatenating the season. This avoids sending a huge file to the client
    let filename = "./data/team_shotlogs/shotlog_" + seasonOption + ".json"
    try {
        TEAM_SHOTLOG = await readJsonData(filename);
    }
    catch(err) {
        TEAM_SHOTLOG = {};
    }

    if(type === PLAYER) {
        shotRoot = PLAYER_SHOTLOG;
    }
    else if(type === TEAM) {
        shotRoot = TEAM_SHOTLOG;
    }
    let shotData = [];
    if(type === PLAYER) {
        shotData = shotRoot[seasonOption] === undefined ? [] : shotRoot[seasonOption][id];    
    }
    else if(type === TEAM) {
        shotData = shotRoot[id] === undefined ? [] : shotRoot[id];
    }

    let xMin = d3.min(shotData, (d) => {return parseInt(d.LOC_X)});
    let xMax = d3.max(shotData, (d) => {return parseInt(d.LOC_X)});

    let yMin = d3.min(shotData, (d) => {return parseInt(d.LOC_Y)});
    let yMax = d3.max(shotData, (d) => {return parseInt(d.LOC_Y)});

    let height = 500;
    let width = 600;
    
    let xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, width]);
    let yScale = d3.scaleLinear().domain([yMin, yMax]).range([height, 0]);

    let svg = d3.select("#shot-chart-container")
        .append("svg")
            .attr("width", width + MARGIN.left + MARGIN.right)
            .attr("height", height + MARGIN.top + MARGIN.bottom)

    drawBasketballCourt(svg, shotData, type);
}

// Plus/minus diverging line chart
const renderPlayerPlusMinus = async (playerId, seasonOption) => {
    if(PLAYER_STATS === null) {
        PLAYER_STATS = await readJsonData("./data/player_gamelog.json");
    }
    let startSeason = parseInt(seasonOption.split("-")[0])
    let endSeason = (startSeason + 1).toString();
    seasonOption = startSeason.toString() + "-" + endSeason;
    let seasonData = PLAYER_STATS[seasonOption];
    let gameData = seasonData[playerId];
    gameData.sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    let playerName = gameData[0].player_name;

    let xVals = gameData.map((d, index) => {
        return index;
    });

    let yVals = gameData.map((d) => {
        return d;
    });

    let height = 200;
    let width = 1050;

    let minY = d3.min(yVals, (d) => {
        return d.PLUS_MINUS === null ? 0 : parseInt(d.PLUS_MINUS);
    });
    let maxY = d3.max(yVals, (d) => {
        return d.PLUS_MINUS === null ? 0 : parseInt(d.PLUS_MINUS);
    });

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

    // Render circle at each x,y coord intersection
    svg.selectAll("circle")
        .data(yVals)
        .enter()
            .append("circle")
                .attr("cx", (d, index) => {return xScale(index)+4})
                .attr("cy", (d) => {return yScale(d.PLUS_MINUS === null ? 0 : parseInt(d.PLUS_MINUS))})
                .attr("r", 4.5)
                .attr("fill", "#2E86C1")
                .on("mouseover", (e, d) => {
                    tooltip.transition()		
                        .duration(200)		
                        .style("opacity", .9);		
                    tooltip.html(d.date + "<br>" + d.matchup + "<br>+/-: " + d.PLUS_MINUS)	
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
            .y((d) => {return yScale(d.PLUS_MINUS === null ? 0 : parseInt(d.PLUS_MINUS))})
        );

    // Show start and end dates
    let parentContainer = document.getElementById('plus-minus');

    let row = document.createElement("div");
    row.classList.add("row");

    let startCol = document.createElement("div");
    startCol.classList.add("col");
    startCol.innerHTML = gameData[0].date;

    let endCol = document.createElement("div");
    endCol.classList.add("col");
    endCol.style.textAlign = "right";
    endCol.innerHTML = gameData[gameData.length-1].date;

    row.appendChild(startCol);
    row.appendChild(endCol);

    parentContainer.appendChild(row);
}

// Renders bar chart of player stats in the selected season
const renderPlayerStats = async (playerId, seasonOption) => {
    clearInnerHTML("team-stats");

    document.getElementById("game-lost").style.display = "none";
    document.getElementById("game-won").style.display = "none";

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
    gameData.sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
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

    let height = 200;
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
            .tickValues([gameData[0].date, gameData[gameData.length-1].date])
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
                return "#F5B041";
            })
            .on("mouseover", (e, d, index) => {
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

    // Render the dropdown for the user to select different stats
    renderVizModalVarDropdown();
}

/**
 * Renders the list group for the list of players and teams in section 2
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

// Helper function to even out the list of players and teams. Ensures all player and team lists are of equal length
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

// Onclick function for user clicking a team or player
const onClickListItem = (e, item, idKey, listItemType) => {
    // Handle user clicking a list group with no corresponding ID (occurs due to evening out the lists)
    if(item[idKey] === undefined) {
        return;
    }
    stopTimeProgression();
    showVizModal(item[idKey], listItemType);
}

// Renders best team and player lists
const renderBestTeamsAndPlayers = async (seasonStart, seasonEnd, isStart) => {
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
    if(TEAM_STATS === null) {
        TEAM_STATS = await readJsonData("./data/team_stats_details.json");
    }
    if(PLAYER_SHOTLOG === null) {
        PLAYER_SHOTLOG = await readJsonData("./data/player_shotlog.json");
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
    // Sort teams by standing
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

    if(isStart) {
        let startStopBtn = document.getElementById("start-stop-progression");
        startStopBtn.innerHTML = '⏸️ Pause <span style="margin-left: 3px;" class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span> <span class="visually-hidden">Loading...</span>';
        startStopBtn.onclick = () => {
            stopTimeProgression();
        }
        
        TIME_SERIES_INTERVAL_F = setInterval(() => {
            seasonStartNum = parseInt(SEASON_START);
            seasonEndNum = parseInt(SEASON_END);
            if(seasonStartNum >= 2020) {
                SEASON_START = "1980";
                SEASON_END = "1981";
            } 
            else {
                // Increment by 1
                SEASON_START = (seasonStartNum + 1).toString();
                SEASON_END = (seasonEndNum + 1).toString();
            }
            let dropdownButton = document.getElementById("season-dropdown-button");
            let seasonOption = SEASON_START + "-" + SEASON_END[2] + SEASON_END[3];
            dropdownButton.innerHTML = seasonOption;
            renderBestTeamsAndPlayers(SEASON_START, SEASON_END);
        }, 2500);
    }
}

// Function fired when user selects a new season from the season dropdown
const onSelectSeasonDropdown = (e, seasonOption, seasonStart, seasonEnd) => {
    let dropdownButton = document.getElementById("season-dropdown-button");
    dropdownButton.innerHTML = seasonOption;
    stopTimeProgression();
    renderBestTeamsAndPlayers(seasonStart, seasonEnd);
    SEASON_START = seasonStart;
    SEASON_END = seasonEnd;
}

// Renders the season dropdown 
const renderSeasonDropdownOptions = () => {
    let startYear = 1980;
    let endYear = 2020;
    let dropdownMenu = document.getElementById("season-dropdown-menu");
    dropdownMenu.style.width = "450px";
    let row = document.createElement("div");
    let col = document.createElement("div");
    row.classList.add("row");
    col.classList.add("col-md-3");
    let itemCount = 0;
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
        col.appendChild(dropdownItem);
        itemCount++;
        if(itemCount >= 12) {
            row.appendChild(col);
            col = document.createElement("div");
            col.classList.add("col-md-3");
            itemCount = 0;
        }
        startYear++;
    }
    row.appendChild(col);
    dropdownMenu.appendChild(row);
}

// Function fired when user selects the dropdown to change the stat in the visualization modal
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

// Renders the dropdown in the viz modal for the users to select different stats for the team or player to be graphed
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

// Renders the team's stats per game bar chart in the selected season
const renderTeamStats = async (teamId, seasonOption) => {
    clearInnerHTML("team-stats");

    document.getElementById("game-lost").style.display = "inline-block";
    document.getElementById("game-won").style.display = "inline-block";

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
            .tickValues([gameData[0].date, gameData[gameData.length-1].date])
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

// Renders win/loss bar chart for team
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

    // Show start and end dates
    let parentContainer = document.getElementById('plus-minus');

    let row = document.createElement("div");
    row.classList.add("row");

    let startCol = document.createElement("div");
    startCol.classList.add("col");
    startCol.innerHTML = gameData[0].date;

    let endCol = document.createElement("div");
    endCol.classList.add("col");
    endCol.style.textAlign = "right";
    endCol.innerHTML = gameData[gameData.length-1].date;

    row.appendChild(startCol);
    row.appendChild(endCol);

    parentContainer.appendChild(row);
}

const drawBasketballCourt = (svg, shotData, type) => {
    opts = {
        // basketball hoop diameter (ft)
        basketDiameter: 1.5,
        // distance from baseline to backboard (ft)
        basketProtrusionLength: 4,
        // backboard width (ft)
        basketWidth: 6,
        // title of hexagon color legend
        colorLegendTitle: 'Efficiency',
        // label for starting of hexagon color range
        colorLegendStartLabel: '< avg',
        // label for ending of hexagon color range
        colorLegendEndLabel: '> avg',
        // full length of basketball court (ft)
        courtLength: 94,
        // full width of basketball court (ft)
        courtWidth: 50,
        // distance from baseline to free throw line (ft)
        freeThrowLineLength: 19,
        // radius of free throw line circle (ft)
        freeThrowCircleRadius: 6,
        // d3 scale for hexagon colors
        heatScale: d3.scaleQuantize()
          .domain([0, 1])
          .range(['#5458A2', '#6689BB', '#FADC97', '#F08460', '#B02B48']),
        // height of svg
        height: 500,
        // method of aggregating points into a bin
        hexagonBin: function (point, bin) {
          var attempts = point.attempts || 1;
          var made = +point.made || 0;
          bin.attempts = (bin.attempts || 0) + attempts;
          bin.made = (bin.made || 0) + made;
        },
        // how many points does a bin need to be visualized
        hexagonBinVisibleThreshold: 1,
        // method to determine value to be used with specified heatScale
        hexagonFillValue: function(d) {  return d.made/d.attempts; },
        // bin size with regards to courth width/height (ft)
        hexagonRadius: .75,
        // discrete hexagon size values that radius value is mapped to
        hexagonRadiusSizes: [0, .4, .6, .75],
        // how many points in a bin to consider it while building radius scale
        hexagonRadiusThreshold: 2,
        // method to determine radius value to be used in radius scale
        hexagonRadiusValue: function (d) { return d.attempts; },
        // width of key marks (dashes on side of the paint) (ft)
        keyMarkWidth: .5,
        // width the key (paint) (ft)
        keyWidth: 16,
        // radius of restricted circle (ft)
        restrictedCircleRadius: 4,
        // title of hexagon size legend
        sizeLegendTitle: 'Frequency',
        // label of start of hexagon size legend
        sizeLegendSmallLabel: 'low',
        // label of end of hexagon size legend
        sizeLegendLargeLabel: 'high',
        // distance from baseline where three point line because circular (ft)
        threePointCutoffLength: 14,
        // distance of three point line from basket (ft)
        threePointRadius: 23.75,
        // distance of corner three point line from basket (ft)
        threePointSideRadius: 22, 
        // title of chart
        title: 'Shot chart',
        // method to determine x position of a bin on the court
        translateX: function (d) { return d.x; },
        // method to determine y position of a bin on the court
        translateY: function (d) { return this._visibleCourtLength - d.y; },
        // width of svg
        width: 600
    }
    
    var o = opts
    
    calculateVisibleCourtLength = function () {
          var halfCourtLength = o.courtLength / 2;
          var threePointLength = o.threePointRadius + 
            o.basketProtrusionLength;
          o.visibleCourtLength = threePointLength + 
            (halfCourtLength - threePointLength) / 2;
    }
    
    calculateVisibleCourtLength()
    
    // helper to create an arc path
    appendArcPath = function (base, radius, startAngle, endAngle) {
          var points = 30;
    
          var angle = d3.scaleLinear()
              .domain([0, points - 1])
              .range([startAngle, endAngle]);
    
          var line = d3.lineRadial()
              .radius(radius)
              .angle(function(d, i) { return angle(i); });
    
          return base.append("path").datum(d3.range(points))
              .attr("d", line);
    }
    
    // draw basketball court
    var drawCourt = function () {
          var base = svg.append("svg")
                    .attr('width', o.width)
                    .attr("height", o.height)
                    .attr('viewBox', "0 0 " + o.courtWidth + " " + o.visibleCourtLength)
            .append('g')
              .attr('class', 'shot-chart-court');
                           
          base.append("rect")
            .attr('class', 'shot-chart-court-key')
            .attr("x", (o.courtWidth / 2 - o.keyWidth / 2))
            .attr("y", (o.visibleCourtLength - o.freeThrowLineLength))
            .attr("width", o.keyWidth)
            .attr("height", o.freeThrowLineLength);
    
          base.append("line")
            .attr('class', 'shot-chart-court-baseline')
            .attr("x1", 0)
            .attr("y1", o.visibleCourtLength)
            .attr("x2", o.courtWidth)
            .attr("y2", o.visibleCourtLength);
                  
          var tpAngle = Math.atan(o.threePointSideRadius / 
            (o.threePointCutoffLength - o.basketProtrusionLength - o.basketDiameter/2));
          appendArcPath(base, o.threePointRadius, -1 * tpAngle, tpAngle)
            .attr('class', 'shot-chart-court-3pt-line')
            .attr("transform", "translate(" + (o.courtWidth / 2) + ", " + 
              (o.visibleCourtLength - o.basketProtrusionLength - o.basketDiameter / 2) + 
              ")");
             
          [1, -1].forEach(function (n) {
            base.append("line")
              .attr('class', 'shot-chart-court-3pt-line')
              .attr("x1", o.courtWidth / 2 + o.threePointSideRadius * n)
              .attr("y1", o.visibleCourtLength - o.threePointCutoffLength)
              .attr("x2", o.courtWidth / 2 + o.threePointSideRadius * n)
              .attr("y2", o.visibleCourtLength);
          });
            
          appendArcPath(base, o.restrictedCircleRadius, -1 * Math.PI/2, Math.PI/2)
            .attr('class', 'shot-chart-court-restricted-area')
            .attr("transform", "translate(" + (o.courtWidth / 2) + ", " + 
              (o.visibleCourtLength - o.basketDiameter / 2 - o.basketProtrusionLength) + ")");
                                                             
          appendArcPath(base, o.freeThrowCircleRadius, -1 * Math.PI/2, Math.PI/2)
            .attr('class', 'shot-chart-court-ft-circle-top')
            .attr("transform", "translate(" + (o.courtWidth / 2) + ", " + 
              (o.visibleCourtLength - o.freeThrowLineLength) + ")");
                                                              
          appendArcPath(base, o.freeThrowCircleRadius, Math.PI/2, 1.5 * Math.PI)
            .attr('class', 'shot-chart-court-ft-circle-bottom')
            .attr("transform", "translate(" + (o.courtWidth / 2) + ", " + 
              (o.visibleCourtLength - o.freeThrowLineLength) + ")");
    
          [7, 8, 11, 14].forEach(function (mark) {
            [1, -1].forEach(function (n) {
              base.append("line")
                .attr('class', 'shot-chart-court-key-mark')
                .attr("x1", o.courtWidth / 2 + o.keyWidth / 2 * n + o.keyMarkWidth * n)
                .attr("y1", o.visibleCourtLength - mark)
                .attr("x2", o.courtWidth / 2 + o.keyWidth / 2 * n)
                .attr("y2", o.visibleCourtLength - mark)
            });
          });    
    
          base.append("line")
            .attr('class', 'shot-chart-court-backboard')
            .attr("x1", o.courtWidth / 2 - o.basketWidth / 2)
            .attr("y1", o.visibleCourtLength)
            .attr("x2", o.courtWidth / 2 + o.basketWidth / 2)
            .attr("y2", o.visibleCourtLength)
                                         
          base.append("circle")
            .attr('class', 'shot-chart-court-hoop')
            .attr("cx", o.courtWidth / 2)
            .attr("cy", o.visibleCourtLength - o.basketDiameter / 2 - o.basketProtrusionLength)
            .attr("r", o.basketDiameter / 2)
    
            const scaleShotX = (x) => {
              if(x > 0) {
                return (x/10) + o.courtWidth/2;
              }
              else if(x < 0) {
                x = Math.abs(x);
                return o.courtWidth/2 - (x/10);
              }
              else {
                return o.courtWidth/2;
              }
            }
    
            const scaleShotY = (y) => {
                return o.visibleCourtLength - (Math.abs(y)/10) - (o.threePointRadius - o.freeThrowLineLength);
            }
    
            const scaleRadius = (r) => {
              return r/10;
            }

            // Initialize tooltip
            var tooltip = d3.select("body").append("span")	
                .attr("class", "tooltip")				
                .style("opacity", 0);

            shotData.forEach((d) => {
                base.append("circle")
                    .attr("cx", scaleShotX(d.LOC_X))
                    .attr("cy", scaleShotY(d.LOC_Y))
                    .attr("r", scaleRadius(4.5))
                    .attr("fill", d.SHOT_MADE_FLAG === 0 ? "#EC7063" : "#52BE80")
                    .on("mouseover", (e) => {
                        let tooltipText = generateShotLogTooltip(d, type);
                        tooltip.transition()		
                            .duration(200)		
                            .style("opacity", .9);		
                        tooltip.html(tooltipText)	
                            .style("padding", "8px")
                            .style("left", (e.pageX) + "px")		
                            .style("top", (e.pageY+15) + "px")
                            .style("background-color", "#D6DBDF");
                    })
                    .on("mouseout", () => {		
                        tooltip.transition()		
                            .duration(500)	
                            .style("opacity", 0);	
                    });
            });
            
    }
    
    drawCourt();
}