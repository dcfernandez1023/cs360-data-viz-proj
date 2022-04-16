# use ShotChartDetail class to obtain
import json
import time
from nba_api.stats.endpoints import shotchartdetail
from nba_api.stats.static.teams import teams, find_team_by_abbreviation, get_teams
from nba_api.stats.static.players import players, get_players
from pprint import pprint
import csv

# shot_data = shotchartdetail.ShotChartDetail(1610612744, 0, season_nullable="2015-16").get_dict()
# # pprint(shot_data)
# print("Result Sets Length: " + str(len(shot_data.get("resultSets"))))
# print(shot_data.get("resultSets")[0].get("headers"))
# exit(0)

START_SEASON = 1980
END_SEASON = 2020

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

data = {}
with open("./data/teams.csv", "r", encoding="utf-8") as csv_f:
    try:
        csvreader = csv.reader(csv_f)
        fields = next(csvreader)
        csv_rows = list(csvreader)

        team_id_index = fields.index("id")

        # For each season
        for season in seasons:
            parsed_season = parse_season(season)
            print(season + " | " + parsed_season)
            data.update({season: {}})

            # For each team
            for row in csv_rows:
                # Get the team's shot log 
                team_id = row[team_id_index]
                data.get(season).update({team_id: []})
                shot_data = shotchartdetail.ShotChartDetail(team_id, 0, season_nullable=parsed_season).get_dict()
                rowset_headers = shot_data.get("resultSets")[0].get("headers")
                rowset = shot_data.get("resultSets")[0].get("rowSet")
                for d in rowset:
                    dict_row = {}
                    for i in range(len(rowset_headers)):
                        dict_row.update({rowset_headers[i]: d[i]})
                    data.get(season).get(team_id).append(dict_row)
                print("\t* Team: " + str(team_id) + " | Season: " + season + " | Data Received: " + str((len(data.get(season).get(team_id)) > 0)))
                time.sleep(1)
        with open("./team_shotlog.json", "w", encoding="utf-8") as json_f:
            json.dump(data, json_f)
    except Exception as e:
        with open("./team_shotlog.json", "w", encoding="utf-8") as json_f:
            json.dump(data, json_f)
            raise(e)
    

