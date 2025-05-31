# chatgpt_bet_explainer.py

import os, json, textwrap
from openai import OpenAI, OpenAIError

# ---------- TEAM-LEVEL CONTEXT ----------
_TEAM_CTX = { 
    "Knicks": {
        "seed"      : 3,
        "arena"     : "Away @ PAC",
        "narrative" : (
            "First ECF trip since 2000. City starving for a title – crowd and "
            "media pressure cranked to 11. Jalen Brunson averaging 26.2 PPG "
            "despite constant traps. Down 2-3 looking to force Game 7 at home. "
            "A Finals trip would be their first since 1999."
        ),
    },
    "Pacers": {
        "seed"      : 4,
        "arena"     : "Home – Gainbridge Fieldhouse",
        "narrative" : (
            "Blew out #1 Cleveland in 5 with NBA-best 121.1 offensive rating. "
            "Tyrese Haliburton fresh after short series. Up 3-2 looking to close "
            "at home. A win would mean their first Finals trip since 2000."
        ),
    },
}

# ---------- PLAYOFF SERIES CONTEXT ----------
series_information = {
    "series_info": {
        "league": "NBA",
        "stage": "Eastern Conference Finals",
        "game_number": 6,
        "teams": {
            "Knicks": {"seed": 3, "series_record": "2-3"},
            "Pacers": {"seed": 4, "series_record": "3-2"}
        },
        "tip_off_time": "5:00 PM",
        "broadcast": ["Max", "TNT", "truTV"]
    },
    "betting_odds": {
        "provider": "DraftKings",
        "lines": [
            {
                "team": "NYK",
                "moneyline": "+145",
                "total": {"type": "Over", "value": 221.5, "vig": -110},
                "spread": {"value": 4.0, "direction": "+", "vig": -110}
            },
            {
                "team": "IND",
                "moneyline": "-175",
                "total": {"type": "Under", "value": 221.5, "vig": -110},
                "spread": {"value": 4.0, "direction": "-", "vig": -110}
            }
        ]
    },
    "game_results": [
        {"game": 1, "winner": {"team": "Pacers", "seed": 4}, "loser": {"team": "Knicks", "seed": 3}, "score": "138-135"},
        {"game": 2, "winner": {"team": "Pacers", "seed": 4}, "loser": {"team": "Knicks", "seed": 3}, "score": "114-109"},
        {"game": 3, "winner": {"team": "Knicks", "seed": 3}, "loser": {"team": "Pacers", "seed": 4}, "score": "106-100"},
        {"game": 4, "winner": {"team": "Pacers", "seed": 4}, "loser": {"team": "Knicks", "seed": 3}, "score": "130-121"},
        {"game": 5, "winner": {"team": "Knicks", "seed": 3}, "loser": {"team": "Pacers", "seed": 4}, "score": "111-94"}
    ],
    "upcoming_games": [
        {"game": 6, "date": "5/31", "matchup": "Knicks vs Pacers", "tip_off_time": "5:00 PM"},
        {"game": 7, "if_necessary": True, "date": "6/2", "matchup": "Pacers vs Knicks", "tip_off_time": "5:00 PM"}
    ]
}

# ---------- ROSTER ANALYSIS ----------
pacers_roster = {
    "Best Players": [
        {"name": "Tyrese Haliburton", "PPG": 18.6},
        {"name": "Pascal Siakam", "PPG": 20.2},
        {"name": "Myles Turner", "PPG": 15.6},
        {"name": "Bennedict Mathurin", "PPG": 16.1},
        {"name": "Andrew Nembhard", "PPG": 10.0}
    ]
}

knicks_roster = {
    "Best Players": [
        {"name": "Jalen Brunson", "PPG": 26.0},
        {"name": "Karl-Anthony Towns", "PPG": 24.4},
        {"name": "Mikal Bridges", "PPG": 17.6},
        {"name": "OG Anunoby", "PPG": 18.0},
        {"name": "Josh Hart", "PPG": 13.6}
    ]
}

def _fmt(label, val, decimals=2):
    """Formats metric for display"""
    try:
        v = float(val)
    except (TypeError, ValueError):
        return ""
    return "" if v == 0 else f"  • {label:<26}: {v:.{decimals}f}"

def _generate_playoff_context(team, opponent):
    """Generates comprehensive playoff context for Knicks/Pacers matchups"""
    if team not in ["Knicks", "Pacers"] or opponent not in ["Knicks", "Pacers"]:
        return ""
    
    # Series information
    series_ctx = textwrap.dedent(f"""
    ───────── PLAYOFF SERIES CONTEXT ─────────
    • Series: {series_information['series_info']['stage']} (Game {series_information['series_info']['game_number']})
    • Tip-off: {series_information['series_info']['tip_off_time']} | Broadcast: {", ".join(series_information['series_info']['broadcast'])}
    • Series Record: 
      - Knicks: {series_information['series_info']['teams']['Knicks']['series_record']}
      - Pacers: {series_information['series_info']['teams']['Pacers']['series_record']}
    
    • Game Results:
    """).strip()
    
    # Add game results
    for game in series_information['game_results']:
        series_ctx += f"\n  - Game {game['game']}: {game['winner']['team']} won {game['score']}"
    
    # Team narratives
    series_ctx += textwrap.dedent(f"""
    
    • Team Context:
      - Knicks: {_TEAM_CTX['Knicks']['narrative']}
      - Pacers: {_TEAM_CTX['Pacers']['narrative']}
    """).strip()
    
    # Rosters
    knicks_stars = "\n".join([f"  - {p['name']}: {p['PPG']} PPG" for p in knicks_roster["Best Players"]])
    pacers_stars = "\n".join([f"  - {p['name']}: {p['PPG']} PPG" for p in pacers_roster["Best Players"]])
    
    series_ctx += textwrap.dedent(f"""
    
    ───────── KEY PLAYERS ─────────
    • Knicks Top Scorers:
{knicks_stars}
    
    • Pacers Top Scorers:
{pacers_stars}
    """).strip()
    
    # Betting odds
    odds = series_information['betting_odds']['lines']
    series_ctx += textwrap.dedent(f"""
    
    ───────── BETTING MARKETS ─────────
    • Moneyline:
      - Knicks: {odds[0]['moneyline']} | Pacers: {odds[1]['moneyline']}
    • Point Spread: 
      - Knicks {odds[0]['spread']['direction']}{odds[0]['spread']['value']} | Pacers {odds[1]['spread']['direction']}{odds[1]['spread']['value']}
    • Over/Under: {odds[0]['total']['value']} points
    """).strip()
    
    return series_ctx

def get_bet_explanation_from_chatgpt(player_data: dict):
    # Core player data
    name = player_data.get("name", "")
    team = player_data.get("team", "")
    opponent = player_data.get("opponent", "")
    threshold = float(player_data.get("threshold", 0) or 0)
    
    # Player metrics
    summary_lines = [
        _fmt("Season avg points", player_data.get("seasonAvgPoints")),
        _fmt("Playoff avg (last 5)", player_data.get("playoffAvg")),
        _fmt(f"Season avg vs {opponent}", player_data.get("seasonAvgVsOpponent")),
        _fmt("Home/Away avg", player_data.get("homeAwayAvg")),
        _fmt("Poisson probability", player_data.get("poissonProbability")),
        _fmt("Monte-Carlo probability", player_data.get("monteCarloProbability")),
        _fmt("Volatility forecast", player_data.get("volatilityPlayOffsForecast")),
    ]
    summary_block = "\n".join(l for l in summary_lines if l)
    
    # Playoff context (only for Knicks/Pacers)
    playoff_context = _generate_playoff_context(team, opponent)
    
    # Full raw data for context
    raw_json = json.dumps(player_data, indent=2, default=str)
    
    # Build the prompt
    prompt = textwrap.dedent(f"""
        NBA PLAYOFF ANALYSIS — {team} vs {opponent}
        
        Player: {name}
        Over/Under threshold: {threshold:.1f} points
        
        {playoff_context}
        
        ───────── PLAYER METRICS ─────────
    {summary_block or '  • (no point-probability metrics available)'}
        
        ───────── TASK ─────────
        1. Use ALL information below to judge the likelihood that {name} will score **over** {threshold:.1f} points tonight.
        2. Consider: home court, playoff pressure, team narratives, key matchups, injury status, and betting markets.
        3. Output STRICT JSON with:
             {{
               "recommendation": one of ["Yes","A High Possible","Maybe","No!"],
               "confidenceRange": short phrase (e.g., "High Confidence"),
               "explanation": 2-3 dense paragraphs justifying the pick
             }}
        4. If player is "Out" in injury report: 
             - Recommendation = "No!" 
             - Explanation must state 0% chance of playing
        
        ───────── FULL DATA ─────────
        ```json
        {raw_json}
        ```
    """).strip()
    
    # Call OpenAI API
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY env var not set.")

    client = OpenAI(api_key=api_key)

    try:
        resp = client.chat.completions.create(
            model="o4-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            timeout=45,
        )
        return json.loads(resp.choices[0].message.content)
    except OpenAIError as e:
        raise RuntimeError(f"OpenAI API error: {e}") from e
    except json.JSONDecodeError:
        return {
            "recommendation": "Error",
            "confidenceRange": "N/A",
            "explanation": resp.choices[0].message.content.strip(),
        }