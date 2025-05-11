import requests
import uuid
import json

API_URL = 'https://api.prizepicks.com/projections'

def fetch_all_data(device_id: str):
    """
    Fetch the raw /projections payload, which includes both
    'projection' entries and all related resources (new_player, team, etc.).
    """
    headers = {
        'User-Agent': (
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/114.0.0.0 Safari/537.36'
        ),
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
    From the mixed data list:
    1) Build a lookup of new_player.id -> display_name
    2) Filter only 'projection' entries whose stat is "points"
    3) Extract each threshold (line_score or projection)
    4) Group thresholds by player name
    """
    # 1) player_id -> display_name
    player_map = {
        item['id']: item['attributes']['display_name']
        for item in data
        if item['type'] == 'new_player'
    }

    players = {}
    for entry in data:
        if entry.get('type') != 'projection':
            continue

        attrs = entry['attributes']
        # detect "points" stat under either 'stat' or 'stat_type'
        stat = (
            attrs.get('stat') or
            attrs.get('stat_type', '')
        ).lower()
        if stat != 'points':
            continue

        # threshold lives under 'projection' or 'line_score'
        threshold = attrs.get('projection', attrs.get('line_score'))

        # resolve the player ID (may be under 'new_player' or 'player_data')
        rel = (
            entry['relationships'].get('new_player') or
            entry['relationships'].get('player_data')
        )
        pid = rel['data']['id'] if rel and rel.get('data') else None

        # name fallback: either attrs['player_name'] or lookup in player_map
        name = attrs.get('player_name') or player_map.get(pid, 'Unknown Player')

        players.setdefault(name, []).append(threshold)

    # 4) build the final list
    return [
        { "player_name": name, "thresholds": thr_list }
        for name, thr_list in players.items()
    ]


if __name__ == '__main__':
    # 1) Copy your X-Device-ID from PrizePicks LocalStorage:
    #    DevTools → Application → Local Storage → app.prizepicks.com → device_id
    DEVICE_ID = 'YOUR_REAL_X_DEVICE_ID_HERE'

    # 2) Fetch & process
    raw = fetch_all_data(DEVICE_ID)
    formatted = group_point_thresholds(raw)

    # 3) Print JSON
    print(json.dumps(formatted, indent=2))
