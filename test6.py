import requests

def _fetch_scoreboard() -> dict:
    """Pull raw JSON for a single YYYYMMDD date."""
    resp = requests.get("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard")
    resp.raise_for_status()
    return resp.json()

import re
from typing import Optional, Dict, Any
def extract_open_spread(comp: Dict[str, Any]) -> Optional[float]:
    odds_list = comp.get("odds", [])
    if not odds_list:
        return None
    line = odds_list[0]
    # 1) explicit
    try:
        return float(line.get("open", {}).get("spread"))
    except (TypeError, ValueError):
        pass
    # 2) free–text
    open_details = (
        line.get("openDetails")
        or line.get("open", {}).get("details")
        or line.get("details")
    )
    if isinstance(open_details, str):
        nums = re.findall(r'[-+]?\d+(?:\.\d+)?', open_details)
        if nums:
            try:
                return float(nums[-1])
            except ValueError:
                pass
    # 3) fallback → current
    try:
        return float(line.get("spread"))
    except (TypeError, ValueError):
        return None

# 0️⃣  Find the correct competition for this player’s team
sb      = _fetch_scoreboard()
events  = sb["events"]
try:
    comp = next(
        e["competitions"][0] for e in events
        if any(t["team"]["displayName"] == "Indiana Pacers"
            for t in e["competitions"][0]["competitors"])
    )
except StopIteration:
    raise ValueError(f"No ESPN odds found for {"Indiana Pacers"}")

odds = comp["odds"][0]

# 1️⃣ spreads & totals
spread_current = float(odds["spread"])
spread_open    = extract_open_spread(comp)
spread_move    = (spread_current - spread_open) if spread_open is not None else 0.0

total_current  = float(odds["current"]["total"]["american"])
total_open     = float(
    odds.get("open", {}).get("total", {}).get("american", total_current)
)
total_move     = total_current - total_open

# 2️⃣ favourite / underdog
player_is_home = True
player_is_fav  = (
    (spread_current < 0 and player_is_home) or
    (spread_current > 0 and not player_is_home)
)
favoriteFlag = int(player_is_fav)
underdogFlag = int(not player_is_fav)

# 3️⃣ implied team totals
home_pts = (total_current / 2) - (spread_current / 2)
away_pts = total_current - home_pts
team_imp = home_pts if player_is_home else away_pts
opp_imp  = away_pts if player_is_home else home_pts

# 4️⃣ implied probability that GAME goes over
decimal_over = float(odds["current"]["over"]["decimal"])
impliedOverProb = round(1 / decimal_over, 3)

# 5️⃣  shove into player doc
doc = {
    "vegasSpread":    spread_current,
    "vegasTotal":     total_current,
    "spreadMove":     round(spread_move, 1),
    "totalMove":      round(total_move, 1),
    "teamImpliedPts": round(team_imp, 1),
    "oppImpliedPts":  round(opp_imp, 1),
    "details":        odds.get("details"),
    "overUnder":      odds.get("overUnder"),
    "blowoutRisk":    round(max(0, min(1, (abs(spread_current) - 8) / 12)), 3),
}

print(doc)