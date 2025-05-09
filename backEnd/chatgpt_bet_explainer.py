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
      playoff_games, etc.
    """
    name          = player_data["name"]
    threshold     = float(player_data.get("threshold", 0))
    team          = player_data.get("team", "")
    opponent      = player_data.get("opponent", "")
    season_avg    = float(player_data.get("seasonAvgPoints", 0))
    playoff_avg   = float(player_data.get("playoffAvg", 0))
    vs_opp_avg    = float(player_data.get("seasonAvgVsOpponent", 0))
    home_away_avg = float(player_data.get("homeAwayAvg", 0))
    poisson_p     = player_data.get("poissonProbability", 0)
    mc_p          = player_data.get("monteCarloProbability", 0)
    adv_stats     = player_data.get("advancedPerformance", {})
    injury        = player_data.get("injuryReport", {})
    vol_playoffs  = float(player_data.get("volatilityPlayOffsForecast", 0))
    playoff_games = player_data.get("playoff_games", "")

    # Prepare the optional forecast line
    forecast_line = (
        f"  • Forecasted playoff vol    : {vol_playoffs:.2f}"
        if vol_playoffs > 0
        else ""
    )

    # Format the prompt template, escaping JSON braces by doubling {{ }}
    prompt_template = textwrap.dedent("""
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
    {forecast_line}

    Task:
    Given these data, decide how likely {name} is to score over {threshold:.1f} points in this playoff game,
    picking exactly one:
      • “100% YES”
      • “90–100% YES”
      • “80–90% possible”
      • “0% possible”

    Also consider series momentum and the chance of a blowout

    Return strict JSON:
    {{  "recommendation":"...",  "confidenceRange":"...",  "explanation":"..."  }}
    """)

    prompt = prompt_template.format(
        name=name,
        team=team,
        opponent=opponent,
        playoff_games=playoff_games,
        season_avg=season_avg,
        playoff_avg=playoff_avg,
        vs_opp_avg=vs_opp_avg,
        home_away_avg=home_away_avg,
        pp=poisson_p,
        mc=mc_p,
        adv_stats=json.dumps(adv_stats),
        injury=json.dumps(injury),
        forecast_line=forecast_line,
        threshold=threshold
    )

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "YOUR_API_KEY_HERE"))
    resp = client.chat.completions.create(
        model="o4-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )

    raw = resp.choices[0].message.content
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # fallback: return the full text for debugging
        return {
            "recommendation": "Error",
            "explanation": raw.strip()
        }
