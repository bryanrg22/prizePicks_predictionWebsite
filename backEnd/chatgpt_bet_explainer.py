# chatgpt_bet_explainer.py

import os, json, textwrap
from openai import OpenAI, OpenAIError

# ---------- TEAM-LEVEL CONTEXT ----------
_TEAM_CTX = { 
    "Pacers": {
        "seed"      : 1,
        "arena"     : "Home – Gainbridge Fieldhouse",
        "narrative" : (
            "Blew out #1 Cleveland in 5 with NBA-best 121.1 offensive rating. "
            "Tyrese Haliburton fresh after short series. Up 3-2 looking to close "
            "at home. A win would mean their first Finals trip since 2000."
        ),
    },
    "Thunder": {
        "seed"      : 4,
        "arena"     : "Away @ DEN",
        "narrative" : (
            "Fourth-seed Thunder opened against defending champion Nuggets. "
            "Shai Gilgeous-Alexander has shouldered the load all season, averaging "
            "30.1 PPG and 5.1 APG, while Chet Holmgren’s shot-blocking has anchored "
            "the paint. They stole Game 1 on the road but now trail 1-2 after a tight "
            "Game 3 loss. A win in Game 4 back in Oklahoma City would swing home-court "
            "toward OKC and energize their young core."
        ),
    },
}


# ---------- ROSTER ANALYSIS ----------
pacers_roster = {
  "PacersRosterWithImportance": [
    {
      "player_name": "Tyrese Haliburton",
      "team": "indiana_pacers",
      "position": "PG",
      "importanceRole": "Starter",
      "importanceScore": 0.70
    },
    {
      "player_name": "Pascal Siakam",
      "team": "indiana_pacers",
      "position": "PF",
      "importanceRole": "Starter",
      "importanceScore": 0.68
    },
    {
      "player_name": "Myles Turner",
      "team": "indiana_pacers",
      "position": "C",
      "importanceRole": "Starter",
      "importanceScore": 0.63
    },
    {
      "player_name": "Bennedict Mathurin",
      "team": "indiana_pacers",
      "position": "SG/SF",
      "importanceRole": "Starter",
      "importanceScore": 0.62
    },
    {
      "player_name": "Aaron Nesmith",
      "team": "indiana_pacers",
      "position": "SF",
      "importanceRole": "Rotation",
      "importanceScore": 0.52
    },
    {
      "player_name": "Andrew Nembhard",
      "team": "indiana_pacers",
      "position": "PG",
      "importanceRole": "Rotation",
      "importanceScore": 0.60
    },
    {
      "player_name": "T. J. McConnell",
      "team": "indiana_pacers",
      "position": "PG",
      "importanceRole": "Rotation",
      "importanceScore": 0.37
    },
    {
      "player_name": "Obi Toppin",
      "team": "indiana_pacers",
      "position": "PF",
      "importanceRole": "Rotation",
      "importanceScore": 0.41
    },
    {
      "player_name": "Ben Sheppard",
      "team": "indiana_pacers",
      "position": "SG/SF",
      "importanceRole": "Rotation",
      "importanceScore": 0.41
    },
    {
      "player_name": "Jarace Walker",
      "team": "indiana_pacers",
      "position": "F",
      "importanceRole": "Rotation",
      "importanceScore": 0.33
    },
    {
      "player_name": "Isaiah Jackson",
      "team": "indiana_pacers",
      "position": "C",
      "importanceRole": "Rotation",
      "importanceScore": 0.35
    },
    {
      "player_name": "Thomas Bryant",
      "team": "indiana_pacers",
      "position": "C",
      "importanceRole": "Bench",
      "importanceScore": 0.30
    },
    {
      "player_name": "Quenton Jackson",
      "team": "indiana_pacers",
      "position": "G/F",
      "importanceRole": "Bench",
      "importanceScore": 0.29
    },
    {
      "player_name": "Tony Bradley",
      "team": "indiana_pacers",
      "position": "C",
      "importanceRole": "Bench",
      "importanceScore": 0.17
    },
    {
      "player_name": "Moses Brown",
      "team": "indiana_pacers",
      "position": "C",
      "importanceRole": "Bench",
      "importanceScore": 0.19
    },
    {
      "player_name": "Johnny Furphy",
      "team": "indiana_pacers",
      "position": "F",
      "importanceRole": "Bench",
      "importanceScore": 0.18
    },
    {
      "player_name": "Enrique Freeman",
      "team": "indiana_pacers",
      "position": "C",
      "importanceRole": "Bench",
      "importanceScore": 0.16
    },
    {
      "player_name": "RayJ Dennis",
      "team": "indiana_pacers",
      "position": "PG",
      "importanceRole": "Bench",
      "importanceScore": 0.04
    },
    {
      "player_name": "James Johnson",
      "team": "indiana_pacers",
      "position": "PF",
      "importanceRole": "Bench",
      "importanceScore": 0.06
    },
    {
      "player_name": "James Wiseman",
      "team": "indiana_pacers",
      "position": "C",
      "importanceRole": "Bench",
      "importanceScore": 0.10
    },
    {
      "player_name": "Tristen Newton",
      "team": "indiana_pacers",
      "position": "PG",
      "importanceRole": "Bench",
      "importanceScore": 0.03
    }
  ]
}


okc_roster = {
  "OKCRosterWithImportance": [
    {
      "player_name": "Shai Gilgeous-Alexander",
      "team": "oklahoma_city_thunder",
      "position": "PG",
      "importanceRole": "Starter",
      "importanceScore": 0.72
    },
    {
      "player_name": "Jalen Williams",
      "team": "oklahoma_city_thunder",
      "position": "SF",
      "importanceRole": "Starter",
      "importanceScore": 0.68
    },
    {
      "player_name": "Luguentz Dort",
      "team": "oklahoma_city_thunder",
      "position": "SG/SF",
      "importanceRole": "Starter",
      "importanceScore": 0.63
    },
    {
      "player_name": "Chet Holmgren",
      "team": "oklahoma_city_thunder",
      "position": "C",
      "importanceRole": "Starter",
      "importanceScore": 0.59
    },
    {
      "player_name": "Isaiah Hartenstein",
      "team": "oklahoma_city_thunder",
      "position": "PF/C",
      "importanceRole": "Starter",
      "importanceScore": 0.60
    },
    {
      "player_name": "Cason Wallace",
      "team": "oklahoma_city_thunder",
      "position": "PG",
      "importanceRole": "Rotation",
      "importanceScore": 0.61
    },
    {
      "player_name": "Aaron Wiggins",
      "team": "oklahoma_city_thunder",
      "position": "SG/SF",
      "importanceRole": "Rotation",
      "importanceScore": 0.49
    },
    {
      "player_name": "Isaiah Joe",
      "team": "oklahoma_city_thunder",
      "position": "SG",
      "importanceRole": "Rotation",
      "importanceScore": 0.49
    },
    {
      "player_name": "Ousmane Dieng",
      "team": "oklahoma_city_thunder",
      "position": "SF",
      "importanceRole": "Rotation",
      "importanceScore": 0.30
    },
    {
      "player_name": "Kenrich Williams",
      "team": "oklahoma_city_thunder",
      "position": "PF/SF",
      "importanceRole": "Rotation",
      "importanceScore": 0.37
    },
    {
      "player_name": "Dillon Jones",
      "team": "oklahoma_city_thunder",
      "position": "PF",
      "importanceRole": "Bench",
      "importanceScore": 0.20
    },
    {
      "player_name": "Jaylin Williams",
      "team": "oklahoma_city_thunder",
      "position": "PF",
      "importanceRole": "Bench",
      "importanceScore": 0.15
    },
    {
      "player_name": "Ajay Mitchell",
      "team": "oklahoma_city_thunder",
      "position": "PG",
      "importanceRole": "Bench",
      "importanceScore": 0.10
    },
    {
      "player_name": "Alex Ducas",
      "team": "oklahoma_city_thunder",
      "position": "G",
      "importanceRole": "Bench",
      "importanceScore": 0.10
    },
    {
      "player_name": "Adam Flagler",
      "team": "oklahoma_city_thunder",
      "position": "PG",
      "importanceRole": "Bench",
      "importanceScore": 0.10
    },
    {
      "player_name": "Nikola Topic",
      "team": "oklahoma_city_thunder",
      "position": "PG",
      "importanceRole": "Bench",
      "importanceScore": 0.08
    }
  ]
}

def _fmt(label, val, decimals=2):
    """Formats a single stat line for display."""
    try:
        v = float(val)
    except (TypeError, ValueError):
        return ""
    return "" if v == 0 else f"  • {label:<26}: {v:.{decimals}f}"


def _generate_playoff_context(team, opponent):
    """
    Generates playoff context specifically for Pacers vs Thunder.
    (returns empty string if team/opponent aren’t exactly "Pacers" or "Thunder")
    """
    if {team, opponent} != {"Pacers", "Thunder"}:
        return ""

    # pull each team’s narrative
    pacers_text = _TEAM_CTX["Pacers"]["narrative"]
    thunder_text = _TEAM_CTX["Thunder"]["narrative"]

    series_ctx = textwrap.dedent(f"""
    • Team Context:
      - Pacers: {pacers_text}
      - Thunder: {thunder_text}
    """).strip()

    # List the top 3 “stars” by importanceScore for each side
    def top_n(roster_dict, key, n=3):
        players = roster_dict.get(key, [])
        # sort descending by importanceScore, take top n
        players_sorted = sorted(players, key=lambda p: p["importanceScore"], reverse=True)
        return players_sorted[:n]

    pacers_top3 = top_n(pacers_roster, "PacersRosterWithImportance", 3)
    okc_top3    = top_n(okc_roster,   "OKCRosterWithImportance",       3)

    pacers_lines = "\n".join(
        f"  - {p['player_name']} ({p['importanceRole']}, {p['importanceScore']:.2f})"
        for p in pacers_top3
    )
    okc_lines = "\n".join(
        f"  - {p['player_name']} ({p['importanceRole']}, {p['importanceScore']:.2f})"
        for p in okc_top3
    )

    series_ctx += textwrap.dedent(f"""

    ───────── KEY PLAYERS ─────────
    • Pacers Top 3 by Importance:
{pacers_lines}

    • Thunder Top 3 by Importance:
{okc_lines}
    """).strip()

    return series_ctx


def get_bet_explanation_from_chatgpt(player_data: dict):
    """
    Builds the ChatGPT prompt for “Pacers vs Thunder” scenarios. 
    Uses _generate_playoff_context to insert the appropriate narrative + top players.
    """
    name = player_data.get("name", "")
    team = player_data.get("team", "")
    opponent = player_data.get("opponent", "")
    threshold = float(player_data.get("threshold", 0) or 0)

    # Build the “player metrics” block
    summary_lines = [
        _fmt("Season avg points",        player_data.get("seasonAvgPoints")),
        _fmt("Playoff avg (last 5)",     player_data.get("playoffAvg")),
        _fmt(f"Season avg vs {opponent}", player_data.get("seasonAvgVsOpponent")),
        _fmt("Home/Away avg",            player_data.get("homeAwayAvg")),
        _fmt("Poisson probability",      player_data.get("poissonProbability")),
        _fmt("Monte-Carlo probability",   player_data.get("monteCarloProbability")),
        _fmt("Volatility forecast",      player_data.get("volatilityPlayOffsForecast")),
    ]
    summary_block = "\n".join(l for l in summary_lines if l)

    # Insert playoff context (Pacers vs Thunder)
    playoff_context = _generate_playoff_context(team, opponent)

    raw_json = json.dumps(player_data, indent=2, default=str)

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