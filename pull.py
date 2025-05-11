import requests
import uuid
import json

API_URL = 'https://api.prizepicks.com/projections'

def fetch_all_data(device_id: str):
    """Fetch the raw projections payload (includes projections & new_player resources)."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                      ' AppleWebKit/537.36 (KHTML, like Gecko)'
                      ' Chrome/114.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://app.prizepicks.com/',
        'X-Device-ID': device_id,
    }
    params = {
        'league_id': 7,       # NBA
        'per_page': 250,
        'single_stat': 'true',
        'game_mode': 'pickem',
    }
    resp = requests.get(API_URL, headers=headers, params=params)
    resp.raise_for_status()
    return resp.json()['data']

def group_point_thresholds(data):
    """
    Given the mixed 'data' list, extract only the Points projections,
    map them to player names via the new_player entries,
    and group all thresholds per player.
    """
    # 1) Build id → name map for every new_player resource
    player_map = {
        item['id']: item['attributes']['display_name']
        for item in data
        if item['type'] == 'new_player'
    }

    # 2) Filter only projection entries whose stat_type == "Points"
    point_projs = [
        p for p in data
        if p['type'] == 'projection'
        and p['attributes'].get('stat_type', '').lower() == 'points'
    ]

    # 3) Group thresholds by player name
    players = {}
    for p in point_projs:
        pid = p['relationships']['new_player']['data']['id']
        name = player_map.get(pid, 'Unknown Player')
        threshold = p['attributes']['line_score']
        players.setdefault(name, []).append(threshold)

    # 4) Convert to list of dicts
    return [
        { "player_name": name, "thresholds": thr_list }
        for name, thr_list in players.items()
    ]

if __name__ == '__main__':
    # 1) Grab your X-Device-ID from PrizePicks localStorage:
    #    DevTools → Application → Local Storage → app.prizepicks.com → device_id
    DEVICE_ID = 'YOUR_REAL_X_DEVICE_ID_HERE'

    # 2) Fetch & process
    raw_data = fetch_all_data(device_id=DEVICE_ID)
    formatted = group_point_thresholds(raw_data)

    # 3) Print nicely
    print(json.dumps(formatted, indent=2))
