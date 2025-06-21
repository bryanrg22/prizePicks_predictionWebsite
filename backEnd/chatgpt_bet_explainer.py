# chatgpt_bet_explainer.py

import os, json, textwrap
from openai import OpenAI, OpenAIError

# ---------- TEAM-LEVEL CONTEXT ----------
_TEAM_CTX = {
    "Pacers": {
        "seed": 4,
        "arena": "Away – Paycom Center, Oklahoma City",
        "narrative": (
            "Indiana clawed back from a 3-2 deficit with a 108-91 rout in Game 6, "
            "forcing the first Finals Game 7 since 2016. Tyrese Haliburton (right-calf "
            "tightness) says he’s ‘100 percent playing,’ while Pascal Siakam and a deep "
            "bench have powered the NBA’s surprise run. A victory would give the Pacers "
            "their first NBA championship and cap a postseason that already toppled the "
            "64-win Cavaliers and the Knicks."
        ),
    },
    "Thunder": {
        "seed": 1,
        "arena": "Home – Paycom Center",
        "narrative": (
            "Oklahoma City, owner of a league-best 68-14 record and led by MVP "
            "Shai Gilgeous-Alexander, still controls home court after letting Game 6 slip away. "
            "Chet Holmgren’s rim protection and Jalen Williams’ shot-making headline a young core "
            "trying to deliver the franchise’s first title since the 1979 Sonics—and the first ever "
            "won in Oklahoma City."
        ),
    },
}

_ESPN_CTX = {
    # ── Game meta ─────────────────────────────────────────────────────────────
    "game": {
        "series":        "NBA Finals",
        "game_number":   7,
        "series_status": "Tied 3-3",
        "datetime_et":   "Sunday 8:00 p.m. ET",          # June 22 2025
        "venue":         "Paycom Center, Oklahoma City",
        "odds": {
            "favorite": "Thunder",
            "spread":   -7.5,
            "over_under": 215,
        },
        "last_matchup": {
            "score":          "Pacers 108 – Thunder 91",
            "pacers_leader":  {"player": "Obi Toppin",  "pts": 20},
            "thunder_leader": {"player": "Shai Gilgeous-Alexander", "pts": 21},
            "date":           "Friday",
        },
    },

    # ── Team capsules ─────────────────────────────────────────────────────────
    "teams": {
        "Pacers": {
            "record":             "50-32",
            "conference_seed":    4,
            "away_record":        "21-20",
            "vs_over_500":        "22-15",
            "avg_made_3s":        13.2,
            "def_3p_allowed_pct": 37.4,   # Thunder shoot 0.8 pp better
            "top_performers": {
                "Pascal Siakam":     {"ppg": 20.2, "rpg": 6.9, "apg": 3.4},
                "Tyrese Haliburton": {"ppg": 17.0, "span": "last 10 games"},
            },
            "last_10": {
                "record":  "5-5",
                "ppg":     110.4,
                "rpg":     40.3,
                "apg":     24.2,
                "spg":     9.9,
                "bpg":     6.0,
                "fg_pct":  46.4,
                "opp_ppg": 110.8,
            },
            "injuries": {
                "Isaiah Jackson": {"status": "out for season", "reason": "calf"},
                "Jarace Walker":  {"status": "day-to-day",     "reason": "ankle"},
            },
        },

        "Thunder": {
            "record":            "68-14",
            "conference_seed":   1,
            "home_record":       "36-6",
            "avg_made_3s":       14.5,
            "team_3p_pct":       37.4,
            "three_pt_leader":   {"player": "Isaiah Joe", "makes": 2.6, "pct": 41.2},
            "top_performers": {
                "Jalen Williams":       {"ppg": 21.6, "fg_pct": 48.4},
                "Shai Gilgeous-Alexander": {"ppg": 30.9, "span": "last 10 games"},
            },
            "last_10": {
                "record":  "6-4",
                "ppg":     113.3,
                "rpg":     40.8,
                "apg":     20.0,
                "spg":     10.3,
                "bpg":     5.2,
                "fg_pct":  46.1,
                "opp_ppg": 112.1,
            },
            "injuries": {
                "Nikola Topic": {"status": "out for season", "reason": "ACL"},
            },
        },
    },

    # ── Narrative blurb (optional) ────────────────────────────────────────────
    "bottom_line": (
        "The Oklahoma City Thunder host the Indiana Pacers in a winner-take-all "
        "Game 7. Oklahoma City’s league-best defense meets Indiana’s up-tempo attack "
        "after the Pacers’ Game 6 rout forced the NBA’s first Finals Game 7 since 2016."
    ),
}


# ---------- ROSTER ANALYSIS ----------
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