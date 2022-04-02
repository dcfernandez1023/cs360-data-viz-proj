import time
from nba_api.stats.endpoints import teamgamelog
from pprint import pprint
import csv
import json

SEASON_START = 1980
SEASON_END = 2020

teams_by_season = None
with open("./data/team_standings.csv", "r") as teams_csv_f:
    csv_reader = csv.reader(teams_csv_f)
    teams_by_season = list(csv_reader)
    teams_by_season.pop(0)

result_set_headers = ['Team_ID',
              'Game_ID',
              'GAME_DATE',
              'MATCHUP',
              'WL',
              'W',
              'L',
              'W_PCT',
              'MIN',
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
              'STL',
              'BLK',
              'TOV',
              'PF',
              'PTS']

team_details_dict = {}
for team in reversed(teams_by_season):
    team_id = team[0].strip()
    team_name = team[1].strip()
    season_start = str(team[7]).strip()
    season_end = str(team[8]).strip()
    season = str(season_start + "-" + season_end[-2] + season_end[-1]).strip()
    season_game_data = teamgamelog.TeamGameLog(team_id, season=season).get_dict()
    result_set = season_game_data["resultSets"]
    
    if team_details_dict.get(season) is None:
        team_details_dict.update({
            season: {}
        })
    
    if team_details_dict.get(season).get(team_id) is None:
        team_details_dict.get(season).update({
            team_id: {
                "name": team_name,
                "games": []
            }
        })

    for result in result_set:
        row_set = result["rowSet"]
        for row in reversed(row_set):
            game_detail = {}
            is_win = row[result_set_headers.index("WL")] == "W"
            game_detail.update({
                "date": row[result_set_headers.index("GAME_DATE")].strip(),
                "matchup": row[result_set_headers.index("MATCHUP")].strip(),
                "shots": [],
                "points": row[result_set_headers.index("PTS")],
                "3pm": row[result_set_headers.index("FG3M")],
                "steals": row[result_set_headers.index("STL")],
                "rebounds": row[result_set_headers.index("REB")],
                "turnovers": row[result_set_headers.index("TOV")],
                "assists": row[result_set_headers.index("AST")],
                "blocks": row[result_set_headers.index("BLK")],
                "winLoss": 1 if is_win else 0 
            })
            team_details_dict.get(season).get(team_id).get("games").append(game_detail)
    time.sleep(2)

with open("./data/team_stats_details.json", "w") as team_stats_details_json_f:
    json.dump(team_details_dict, team_stats_details_json_f)

