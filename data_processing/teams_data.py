# Use this file to get common team data
from nba_api.stats.endpoints import commonplayerinfo, teamyearbyyearstats, teamgamelog
from nba_api.stats.static.teams import teams
from pprint import pprint
import time
import csv

SEASON_START = 1980
SEASON_END = 2020

# teams.csv
teams_csv_headers = [
    "id",
    "abbreviation",
    "nickname",
    "year_founded",
    "city",
    "full_name",
    "state",
    "championship_years"
]
teams_copy = teams.copy()
for i in range(len(teams_copy)):
    team = teams_copy[i]
    championship_years = team[len(team)-1]
    years_str = ""
    for x, year in enumerate(championship_years):
        if x == len(championship_years)-1:
            years_str += str(year)
        else:
            years_str += str(year) + "-"
    team[len(team)-1] = years_str

with open("./data/teams.csv", "w", encoding="utf-8", newline="") as teams_csv_f:
    writer = csv.writer(teams_csv_f, quoting=csv.QUOTE_ALL)
    writer.writerow(teams_csv_headers)
    writer.writerows(teams_copy)


# team_standings.csv
team_standings_csv_headers = [
    "id",
    "name",
    "standing",
    "numWins",
    "numLoss",
    "isChampion",
    "season",
    "seasonStart",
    "seasonEnd"
]
result_set_headers = [
    'TEAM_ID',
    'TEAM_CITY',
    'TEAM_NAME',
    'YEAR',
    'GP',
    'WINS',
    'LOSSES',
    'WIN_PCT',
    'CONF_RANK',
    'DIV_RANK',
    'PO_WINS',
    'PO_LOSSES',
    'CONF_COUNT',
    'DIV_COUNT',
    'NBA_FINALS_APPEARANCE',
    'FGM',
    'FGA',
    'FG_PCT',
    'FG3M',
    'FG3A',
    'FG3_PCT',
    'FTM',
    'FTA',
    'FT_PCT',
    'OREB',
    'DREB',
    'REB',
    'AST',
    'PF',
    'STL',
    'TOV',
    'BLK',
    'PTS',
    'PTS_RANK'
]
team_standings_data = []
for team in teams_copy:
    team_id = team[0]
    team_stats = teamyearbyyearstats.TeamYearByYearStats(team_id=team_id).get_dict()
    data = team_stats["resultSets"][0]["rowSet"]
    for stats_list in data:
        # skip over seasons older then 1980
        season = int("".join(num for num in stats_list[result_set_headers.index("YEAR")])[0:4])
        if season < SEASON_START or season > SEASON_END:
            continue
        row = []
        team_id = stats_list[result_set_headers.index("TEAM_ID")]
        name = stats_list[result_set_headers.index("TEAM_NAME")]
        standing = int(stats_list[result_set_headers.index("CONF_RANK")])
        numWins = int(stats_list[result_set_headers.index("WINS")])
        numLoss = int(stats_list[result_set_headers.index("LOSSES")])
        isChampion = False
        seasonStart = season 
        seasonEnd = season+1
        season = str(seasonStart) + "-" + str(seasonEnd)

        row.append(team_id)
        row.append(name)
        row.append(standing)
        row.append(numWins)
        row.append(numLoss)
        row.append(isChampion)
        row.append(season)
        row.append(seasonStart)
        row.append(seasonEnd)

        team_standings_data.append(row)
    time.sleep(2)
with open("./data/team_standings.csv", "w", encoding="utf-8", newline="") as team_standings_f:
    writer = csv.writer(team_standings_f, quoting=csv.QUOTE_ALL)
    writer.writerow(team_standings_csv_headers)
    writer.writerows(team_standings_data)
