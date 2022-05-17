# Use this file to test reading the player_shotlog.json file
import json
from pprint import pprint

with open("./player_shotlog.json", "r", encoding="utf-8") as json_f:
    shotlog = json.load(json_f)
    print("Stephen Curry Shot Log (2015-2016")
    shot_data = shotlog.get("2015-2016").get("201939")
    print("Shot Log Length: " + str(len(shot_data)))
    pprint(shot_data)