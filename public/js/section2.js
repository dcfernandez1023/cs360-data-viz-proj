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

const showVizModal = () => {
    var modal = new bootstrap.Modal(document.getElementById("viz-modal"), {});
    modal.show();
}

/**
 * 
 * @param {*} data - Array of data 
 * @param {*} labelKey - Key of the label to display on list group element
 * @param {*} onClick - Event handler for when user selects the list element. Gets called as onClick(e, item, idKey)
 * @param {*} parentId - The id of the HTML element to append the list group to 
 */
const renderListGroup = (data, labelKey, idKey, onClick, parentId) => {
    let parentElement = document.getElementById(parentId);
    parentElement.innerHTML = "";
    let listGroup = document.createElement("ul");
    listGroup.classList.add("list-group");
    data.forEach((item, index) => {
        let listItem = document.createElement("li");
        listItem.classList.add("list-group-item");
        listItem.classList.add("list-group-item-action");
        let label = item[labelKey];
        listItem.innerHTML = (index+1).toString() + ". " + label;
        listItem.onclick = (e) => {onClick(e, item, idKey)};
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

const onClickListItem = (e, item, idKey) => {
    showVizModal();
}

const renderBestTeamsAndPlayers = async (seasonStart, seasonEnd) => {
    let teamsData = await readCsvData("./data/team_standings.csv");
    let playersData = await readCsvData("./data/player_stats.csv");
    let team_conf_lookup = await readJsonData("./data/team_conf_lookup.json");
    
    // Get best teams by standing
    let bestEastTeams = [];
    let bestWestTeams = [];
    teamsData.forEach((team) => {
        if(team.seasonStart === seasonStart && team.seasonEnd === seasonEnd) {
            if(team_conf_lookup[team.id] === "East") {
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
    playersData.forEach((player) => {
        if(player.SEASON_START === seasonStart && player.SEASON_END === seasonEnd) {
            bestPlayers.push(player);
        }
    });
    bestPlayers.sort((player1, player2) => {
        return parseInt(player1.RANK) - parseInt(player2.RANK);
    });
    // Isolate 10 best players
    tenBestPlayers = [];
    for(var i = 0; i < 10; i++) {
        tenBestPlayers.push(bestPlayers[i]);
    }

    // Even out the lists 
    let maxSize = Math.max(bestEastTeams.length, bestWestTeams.length, tenBestPlayers.length);
    evenOutList(bestEastTeams, maxSize, "name");
    evenOutList(bestWestTeams, maxSize, "name");
    evenOutList(tenBestPlayers, maxSize, "PLAYER");

    // Render best east teams 
    renderListGroup(bestEastTeams, "name", "id", onClickListItem, "best-east-teams");

    // Render best west teams
    renderListGroup(bestWestTeams, "name", "id", onClickListItem, "best-west-teams");

    // Render best players 
    renderListGroup(tenBestPlayers, "PLAYER", "PLAYER_ID", onClickListItem, "best-players");
}

const clearBestTeamsAndPlayers = () => {

}

const onSelectSeasonDropdown = (e, seasonOption, seasonStart, seasonEnd) => {
    let dropdownButton = document.getElementById("season-dropdown-button");
    dropdownButton.innerHTML = seasonOption;
    console.log(seasonStart.toString());
    console.log(seasonEnd.toString());
    renderBestTeamsAndPlayers(seasonStart, seasonEnd);
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