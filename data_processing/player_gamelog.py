# Use this file to get player game by game data for each season
import json
import time
from nba_api.stats.endpoints import playergamelog
from nba_api.stats.static.teams import teams
from nba_api.stats.static.players import players, get_players, find_player_by_id
from pprint import pprint
import csv

START_SEASON = 1980
END_SEASON = 2020

FIELD_MAPPING = {
    "PTS": "points",
    "FG3M": "3pm",
    "STL": "steals",
    "REB": "rebounds",
    "TOV": "turnovers",
    "AST": "assists",
    "BLK": "blocks",
    "GAME_DATE": "date",
    "MATCHUP": "matchup"
}

# print(playergamelog.PlayerGameLog(2544, season="2015-16").get_dict())
# exit(0)

def parse_season(season):
    arr = season.split("-")
    return arr[0] + "-" + arr[1][2] + arr[1][3]

data = {}
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
        csv_rows = list(csvreader)
        season_index = fields.index("SEASON")
        player_id_index = fields.index("PLAYER_ID")
        season_start_index = fields.index("SEASON_START")
        season_end_index = fields.index("SEASON_END")
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
                    playergamelog_data = playergamelog.PlayerGameLog(player_id, season=parse_season(season)).get_dict()
                    rowset_headers = playergamelog_data.get("resultSets")[0].get("headers")
                    rowset = playergamelog_data.get("resultSets")[0].get("rowSet")
                    for d in rowset:
                        dict_row = {}
                        dict_row.update({"player_name": find_player_by_id(player_id).get("full_name")})
                        for i in range(len(rowset_headers)):
                            if FIELD_MAPPING.get(rowset_headers[i]) is not None:
                                dict_row.update({FIELD_MAPPING.get(rowset_headers[i]): d[i]})
                            else:
                                dict_row.update({rowset_headers[i]: d[i]})
                        data.get(season).get(player_id).append(dict_row)
                    count += 1
                    print("\t* Count: " + str(count) + " | Player: " + player_id + " | Season: " + season + " | Data Received: " + str((len(data.get(season).get(player_id)) > 0)))
                    time.sleep(1)
                else:
                    break
        with open("./data/player_gamelog.json", "w", encoding="utf-8") as json_f:
            json.dump(data, json_f)
    except Exception as e:
        with open("./data/player_gamelog.json", "w", encoding="utf-8") as json_f:
            json.dump(data, json_f)        
            raise(e)
