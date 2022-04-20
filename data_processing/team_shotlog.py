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

START_SEASON = 1996
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
shots = {}
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
            shots.update({season: {}})
            season_shotlog = {}

            # For each team
            for row in csv_rows:
                # Get the team's shot log 
                team_id = row[team_id_index]
                data.get(season).update({team_id: {}})
                shots.get(season).update({team_id: []})
                season_shotlog.update({team_id: []})
                shot_data = shotchartdetail.ShotChartDetail(team_id, 0, season_nullable=parsed_season, context_measure_simple="FGA").get_dict()
                rowset_headers = shot_data.get("resultSets")[0].get("headers")
                rowset = shot_data.get("resultSets")[0].get("rowSet")
                # For each shot in the shot log, calculate the avg x,y location and shot area 
                shot_aggr = {}
                desired_cols = ["PLAYER_NAME", "LOC_X", "LOC_Y", "SHOT_MADE_FLAG", "GAME_DATE", "SHOT_DISTANCE", "SHOT_TYPE", "ACTION_TYPE", "SHOT_ZONE_AREA"]
                for d in rowset:
                    dict_row = {}
                    shot_row = {}
                    for i in range(len(rowset_headers)):
                        dict_row.update({rowset_headers[i]: d[i]})
                        if rowset_headers[i] in desired_cols:
                            shot_row.update({rowset_headers[i]: d[i]})
                    shots.get(season).get(team_id).append(shot_row)
                    season_shotlog.get(team_id).append(shot_row)
                    # print(shot_row)
                    # data.get(season).get(team_id).append(dict_row)
                    shot_zone = ""
                    try:
                        shot_zone = dict_row.get("SHOT_ZONE_AREA") + ", " + dict_row.get("SHOT_TYPE")
                    except Exception:
                        shot_zone = dict_row.get("SHOT_ZONE_AREA")
                    if shot_aggr.get(shot_zone) is None:
                        shot_aggr.update({
                            shot_zone: {
                                "makes": 0,
                                "misses": 0,
                                "num_shots": len(rowset),
                                "avg_distance": 0
                            }
                        })
                    # Total the data
                    is_make = dict_row.get("SHOT_MADE_FLAG") == 1
                    shot_aggr.get(shot_zone).update({
                        "makes": shot_aggr.get(shot_zone).get("makes") + (1 if is_make else 0)
                    })
                    shot_aggr.get(shot_zone).update({
                        "misses": shot_aggr.get(shot_zone).get("misses") + (0 if is_make else 1)
                    })
                    shot_aggr.get(shot_zone).update({
                        "avg_distance": shot_aggr.get(shot_zone).get("avg_distance") + int(dict_row.get("SHOT_DISTANCE"))
                    })
                if len(rowset) > 0:
                    # Average the distance
                    shot_aggr.get(shot_zone).update({
                        "avg_distance": shot_aggr.get(shot_zone).get("avg_distance") / len(rowset)
                    })
                data.get(season).update({team_id: shot_aggr})
                print("\t* Team: " + str(team_id) + " | Season: " + season + " | Data Received: " + str((len(list(data.get(season).get(team_id).keys())) > 0)))
                time.sleep(1)
            file_name = "./team_shotlogs/shotlog_" + season + ".json"
            with open(file_name, "w", encoding="utf-8") as json_f:
                # print("Writing shot log for " + season + " to " + file_name)
                json.dump(season_shotlog, json_f)
        with open("./team_shotlog.json", "w", encoding="utf-8") as json_f:
            json.dump(data, json_f)
        with open("./team_all_shots.json", "w", encoding="utf-8") as json_f2:
            json.dump(shots, json_f2)
    except Exception as e:
        with open("./team_shotlog.json", "w", encoding="utf-8") as json_f:
            json.dump(data, json_f)
        with open("./team_all_shots.json", "w", encoding="utf-8") as json_f2:
            json.dump(shots, json_f2)
        raise(e)
    

