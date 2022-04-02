from nba_api.stats.endpoints import commonplayerinfo, teamyearbyyearstats, teamgamelog, teaminfocommon
from nba_api.stats.static.teams import teams
from pprint import pprint
import time
import csv
import json

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

team_conference_lookup = {}
team_info_common_headers = ['TEAM_ID',
              'SEASON_YEAR',
              'TEAM_CITY',
              'TEAM_NAME',
              'TEAM_ABBREVIATION',
              'TEAM_CONFERENCE',
              'TEAM_DIVISION',
              'TEAM_CODE',
              'TEAM_SLUG',
              'W',
              'L',
              'PCT',
              'CONF_RANK',
              'DIV_RANK',
              'MIN_YEAR',
              'MAX_YEAR']
for team in teams_copy:
    team_id = team[0]
    team_conf_data = teaminfocommon.TeamInfoCommon(team_id).get_dict()
    result_sets = team_conf_data["resultSets"]
    for result in result_sets:
        if result["name"] == "TeamInfoCommon":
            row_set = result["rowSet"]
            for row in row_set:
                team_conference_lookup.update({
                    team_id: row[team_info_common_headers.index("TEAM_CONFERENCE")]
                })
    time.sleep(1)

pprint(team_conference_lookup)