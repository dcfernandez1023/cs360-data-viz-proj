# use ShotChartDetail class to obtain player shot chart data for each season
import json
import time
from nba_api.stats.endpoints import shotchartdetail
from nba_api.stats.static.teams import teams, find_team_by_abbreviation, get_teams
from nba_api.stats.static.players import players, get_players
from pprint import pprint
import csv

# shot_data = shotchartdetail.ShotChartDetail(1610612744, 201939, season_nullable="2015-16", context_measure_simple='FGA').get_dict()
# print("Result Sets Length: " + str(len(shot_data.get("resultSets"))))
# pprint(shot_data)
# exit(0)

START_SEASON = 1980
END_SEASON = 2020

def parse_season(season):
    arr = season.split("-")
    return arr[0] + "-" + arr[1][2] + arr[1][3]

data = {}
teams_not_found = {}
team_not_found_lookup = {
    "UTH": "UTA",
    "SAN": "SAS",
    "PHL": "PHI",
    "GOS": "GSW",
    "KCK": "SAC",
    "NJN": "BKN",
    "SDC": "LAC",
    "SEA": "OKC",
    "CHH": "CHA",
    "VAN": "MEM",
    "NOH": "NOP",
    "NOK": "NOP"
}
seasons = []
start = START_SEASON
while start <= END_SEASON:
    end_str = str(start + 1)
    # season = str(start) + "-" + end_str[2] + end_str[3]
    season = str(start) + "-" + end_str
    seasons.append(season)
    start += 1

with open("./data/player_stats.csv", "r", encoding="utf-8") as csv_f:
    try:
        csvreader = csv.reader(csv_f)
        fields = next(csvreader)
        team_index = fields.index("TEAM")
        csv_rows = list(csvreader)
        # for row in csv_rows:
        #     team_abbr = row[team_index]
        #     team_data = find_team_by_abbreviation(team_abbr)
        #     if team_data is None and teams_not_found.get(team_abbr) is None:
        #         new_team_abbr = team_not_found_lookup[team_abbr]
        #         if teams_not_found.get(new_team_abbr) is None:
        #             print(team_abbr + " replaced with " + new_team_abbr)
        #         teams_not_found.update({new_team_abbr: True})
        #         team_data = find_team_by_abbreviation(new_team_abbr)
        #         print(team_data)
        #         exit(0)
        season_index = fields.index("SEASON")
        player_id_index = fields.index("PLAYER_ID")
        for season in seasons:
            data.update({season: {}})
            count = 0
            print(season)
            for row in csv_rows:
                # print(row)
                # print(row[season_index] + " == " + season)
                if count < 10:
                    if row[season_index] != season:
                        continue
                    player_id = row[player_id_index]
                    data.get(season).update({player_id: []})
                    team_abbr = row[team_index]
                    team_data = find_team_by_abbreviation(team_abbr) 
                    team_id = team_data.get("id") if team_data is not None else find_team_by_abbreviation(team_not_found_lookup.get(team_abbr)).get("id")
                    playershot_data = shotchartdetail.ShotChartDetail(
                        team_id, 
                        player_id, 
                        season_nullable=parse_season(season),
                        context_measure_simple='FGA'
                    ).get_dict()
                    rowset_headers = playershot_data.get("resultSets")[0].get("headers")
                    rowset = playershot_data.get("resultSets")[0].get("rowSet")
                    for d in rowset:
                        dict_row = {}
                        for i in range(len(rowset_headers)):
                            dict_row.update({rowset_headers[i]: d[i]})
                        data.get(season).get(player_id).append(dict_row)
                    count += 1
                    print("\t* Count: " + str(count) + " | Player: " + str(player_id) + " | Team: " + str(team_id) + " | Season: " + season + " | Data Received: " + str((len(data.get(season).get(player_id)) > 0)))
                    time.sleep(1)
                    # print(data)
                    # exit(0)
                else:
                    break
        with open("./data/player_shotlog.json", "w", encoding="utf-8") as json_f:
            json.dump(data, json_f)
    except Exception as e:
        with open("./data/player_shotlog.json", "w", encoding="utf-8") as json_f:
            json.dump(data, json_f)
            raise(e)        