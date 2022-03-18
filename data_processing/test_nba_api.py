from nba_api.stats.endpoints import commonplayerinfo, teamyearbyyearstats
from pprint import pprint

# Basic Request
player_info = commonplayerinfo.CommonPlayerInfo(player_id=2544)

pprint(player_info.get_json())

print("----")

team_info = teamyearbyyearstats.TeamYearByYearStats(team_id=1610612739)
pprint(team_info.get_json())