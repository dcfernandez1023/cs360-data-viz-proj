import time
from nba_api.stats.endpoints import commonplayerinfo, teamyearbyyearstats, teamgamelog, playerprofilev2, leagueleaders
from nba_api.stats.static.teams import teams
from nba_api.stats.static.players import players, get_players
from pprint import pprint
import csv

SEASON_START = 1980
SEASON_END = 2020

# players.csv
players_csv_headers = [
    "id",
    "firstName",
    "lastName",
    "fullName",
    "isActive"
]
player_lookup = {}
for player in players:
    player_lookup.update({
        player[0]: {
            "firstName": player[1],
            "lastName": player[2],
            "fullName": player[3]
        }
    })
with open("./data/players.csv", "w", encoding="utf-8", newline="") as players_csv_f:
    writer = csv.writer(players_csv_f, quoting=csv.QUOTE_ALL)
    writer.writerow(players_csv_headers)
    writer.writerows(players)


# player_stats_csv_headers = [
#     "id",
#     "firstName",
#     "lastName",
#     "fullName",
#     "isMvp",
#     "season",
#     "seasonStart",
#     "seasonEnd",
#     "numPoints",
#     "numRebounds",
#     "numAssists",
#     "numSteals" 
# ]

player_stats_csv_headers = [
    "PLAYER_ID",
    "RANK",
    "PLAYER",
    "TEAM",
    "GP",
    "MIN",
    "FGM",
    "FGA",
    "FG_PCT",
    "FG3M",
    "FG3A",
    "FG3_PCT",
    "FTM",
    "FTA",
    "FT_PCT",
    "OREB",
    "DREB",
    "REB",
    "AST",
    "STL",
    "BLK",
    "TOV",
    "PF",
    "PTS",
    "EFF",
    "AST_TOV",
    "STL_TOV",
    "SEASON",
    "SEASON_START",
    "SEASON_END"
]
player_stats = []
player_stats_f = open("./data/player_stats.csv", "w", encoding="utf-8", newline="")
writer = csv.writer(player_stats_f, quoting=csv.QUOTE_ALL)
writer.writerow(player_stats_csv_headers)

for i in range(SEASON_START, SEASON_END+1):
    season_end_str = str(i+1)
    season_param = str(i) + "-" + season_end_str[2] + season_end_str[3]
    print(season_param)
    player_data = leagueleaders.LeagueLeaders(season=season_param).get_dict()
    for row in player_data["resultSet"]["rowSet"]:
        row.append(str(i) + "-" + str(i+1))
        row.append(i)
        row.append(str(i+1))
        writer.writerow(row)
    time.sleep(2)

player_stats_f.close()

# for player in players:
#     # Skipping steph curry for now b/c got rated limited LOL 
#     if player[0] == 201939 or player[0] == "201939":
#         continue
#     player_data = playerprofilev2.PlayerProfileV2(76001).get_dict()
#     reg_season_totals = None
#     for data_set in player_data["resultSets"]:
#         if data_set["name"] == "SeasonTotalsRegularSeason":
#             reg_season_totals = data_set 
#             break
#     result_set = reg_season_totals["rowSet"]
#     for player_stat_list in result_set:
#         row = []
#         # skip over seasons older then 1980
#         season = int("".join(num for num in player_stat_list[result_set_headers.index("SEASON_ID")])[0:4])
#         if season < SEASON_START or season > SEASON_END:
#             continue
#         player_id = player_stat_list[result_set_headers.index("PLAYER_ID")]
#         first_name = player_lookup[player_id]["firstName"]
#         last_name = player_lookup[player_id]["lastName"]
#         full_name = player_lookup[player_id]["fullName"]
#         isMvp = False
#         season_start = season 
#         season_end = season+1
#         season = str(season_start) + "-" + str(season_end)
#         num_points = int(player_stat_list[result_set_headers.index("PTS")])
#         num_rebounds = int(player_stat_list[result_set_headers.index("REB")])
#         num_assists = int(player_stat_list[result_set_headers.index("AST")])
#         num_steals = int(player_stat_list[result_set_headers.index("STL")])

#         row.append(player_id)
#         row.append(first_name)
#         row.append(last_name)
#         row.append(full_name)
#         row.append(isMvp)
#         row.append(season)
#         row.append(season_start)
#         row.append(season_end)
#         row.append(num_points)
#         row.append(num_rebounds)
#         row.append(num_assists)
#         row.append(num_steals)

        # player_stats.append(row)

    #     writer.writerow(row)

    #     time.sleep(2)
    # break

# with open("./data/player_stats.csv", "w", encoding="utf-8", newline="") as player_stats_f:
#     writer = csv.writer(player_stats_f, quoting=csv.QUOTE_ALL)
#     writer.writerow(player_stats_csv_headers)
#     writer.writerows(player_stats)


