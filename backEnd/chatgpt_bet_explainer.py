import os
import json
import textwrap
from openai import OpenAI

def safe_fmt(x, fmt="{:.2f}"):
    return fmt.format(x) if x is not None else "N/A"


def get_bet_explanation_from_chatgpt(player_data: dict):
    """
    player_data contains:
      name, threshold, team, opponent,
      seasonAvgPoints, playoffAvg, seasonAvgVsOpponent,
      homeAwayAvg, poissonProbability, monteCarloProbability,
      advancedPerformance, injuryReport, volatilityPlayOffsForecast,
      num_playoff_games, etc.
    """

    # pull out exactly what we need
    name          = player_data["name"]
    threshold     = player_data["threshold"]
    team          = player_data["team"]
    opponent      = player_data["opponent"]
    season_avg    = player_data.get("seasonAvgPoints", 0)
    playoff_avg   = player_data.get("playoffAvg", 0)
    vs_opp_avg    = player_data.get("seasonAvgVsOpponent", 0)
    home_away_avg = player_data.get("homeAwayAvg", 0)
    poisson_p     = player_data.get("poissonProbability", 0)
    mc_p          = player_data.get("monteCarloProbability", 0)
    adv_stats     = player_data.get("advancedPerformance", {})
    injury        = player_data.get("injuryReport", {})
    vol_playoffs  = player_data.get("volatilityPlayOffsForecast", 0)
    pp = safe_fmt(player_data.get("poissonProbability")) or 0.0
    mc = safe_fmt(player_data.get("monteCarloProbability")) or 0.0
    injury        = player_data.get("injuryReport", {})
    playoff_games = player_data.get("playoff_games", 0)

    season_avg = float(player_data.get("seasonAvgPoints", 0))
    threshold  = float(player_data.get("threshold", 0))


    # build and dedent the prompt
    prompt = textwrap.dedent(f"""
    PLAYOFF BETTING ANALYSIS for {name} in {team} vs {opponent}

    Series & last game:
    {playoff_games}

    Player playoff metrics:
      • Season avg points         : {season_avg:.1f}
      • Last 5 playoff games avg   : {playoff_avg:.1f}
      • Season avg vs {opponent}  : {vs_opp_avg:.1f}
      • Home/Away avg              : {home_away_avg:.1f}
      • Poisson probability        : {pp:.2f}
      • Monte Carlo probability    : {mc:.2f}
      • Advanced stats             : {adv_stats}
      • Injury report              : {injury}
    {f"  • Forecasted playoff vol    : {vol_playoffs:.2f}" if vol_playoffs > 0 else ""}

    Task:
    Given these data, decide how likely {name} is to score over {threshold} points in this playoff game,
    picking exactly one:
      • “100% YES”
      • “90–100% YES”
      • “80–90% possible”
      • “0% possible”

    Also consider series momentum and the chance of a blowout

    Return strict JSON:
    {{
      "recommendation":  "...",
      "confidenceRange":"...", 
      "explanation":    "..."  
    }}
    """)

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "YOUR_API_KEY_HERE"))
    resp = client.chat.completions.create(
        model="o4-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )

    try:
        return json.loads(resp.choices[0].message.content)
    except json.JSONDecodeError:
        return {
            "recommendation": "Error",
            "explanation": resp.choices[0].message.content
        }
