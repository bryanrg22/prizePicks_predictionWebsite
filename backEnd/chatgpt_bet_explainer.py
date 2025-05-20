# chatgpt_bet_explainer.py  (REPLACE the old get_bet_explanation_from_chatgpt)

import os, json, textwrap
from openai import OpenAI, OpenAIError

# ---------- TEAM‑LEVEL one‑off context (hard‑coded for now) ----------
_TEAM_CTX = {
    "Timberwolves": {
        "seed"      : 3,
        "arena"     : "Away @ OKC – Paycom Center",
        "narrative" : (
            "Coming off a historic comeback to upset Denver in 7. "
            "Anthony Edwards emerging as a top‑5 playoff scorer; team leads all "
            "remaining clubs in defensive rating (101.4) this post‑season."
        ),
    },
    "Thunder": {
        "seed"      : 1,
        "arena"     : "Home – Paycom Center (LOUD crowd advantage)",
        "narrative" : (
            "Youngest 1‑seed ever; Shai Gilgeous‑Alexander averaging 32.2 PPG "
            "and shooting 63 TS% vs DAL. Chet Holmgren protecting rim (3.2 blk)."
        ),
    },
    "Knicks": {
        "seed"      : 3,
        "arena"     : "Home – Madison Square Garden (NYC spotlight)",
        "narrative" : (
            "First ECF trip since 2000. City starving for a title – crowd and "
            "media pressure cranked to 11. Jalen Brunson averaging 26.2 PPG "
            "despite constant traps."
        ),
    },
    "Pacers": {
        "seed"      : 4,
        "arena"     : "Away @ MSG",
        "narrative" : (
            "Blew out #1 Cleveland in 5 with NBA‑best 121.1 offensive rating. "
            "Tyrese Haliburton fresh after short series."
        ),
    },
}

def _fmt(label, val, decimals=2):
    """Return 'label : 12.34' or '' if val falsy/zero/None."""
    try:
        v = float(val)
    except (TypeError, ValueError):
        return ""
    return "" if v == 0 else f"  • {label:<26}: {v:.{decimals}f}"

def get_bet_explanation_from_chatgpt(player_data: dict):
    # ------------------------------------------------------------------
    # 1) Pull out headline fields (safe defaults)
    # ------------------------------------------------------------------
    name      = player_data.get("name", "")
    team      = player_data.get("team", "")
    opponent  = player_data.get("opponent", "")
    threshold = float(player_data.get("threshold", 0) or 0)

    # ------------------------------------------------------------------
    # 2) Team / arena context (hard‑coded for this round)
    # ------------------------------------------------------------------
    team_ctx     = _TEAM_CTX.get(team, {})
    opponent_ctx = _TEAM_CTX.get(opponent, {})

    # ------------------------------------------------------------------
    # 3) Compose human‑readable summary lines
    # ------------------------------------------------------------------
    summary_lines = [
        _fmt("Season avg points",          player_data.get("seasonAvgPoints")),
        _fmt("Playoff avg (last 5)",       player_data.get("playoffAvg")),
        _fmt(f"Season avg vs {opponent}",  player_data.get("seasonAvgVsOpponent")),
        _fmt("Home/Away avg",              player_data.get("homeAwayAvg")),
        _fmt("Poisson probability",        player_data.get("poissonProbability")),
        _fmt("Monte‑Carlo probability",    player_data.get("monteCarloProbability")),
        _fmt("Volatility forecast",        player_data.get("volatilityPlayOffsForecast")),
    ]
    summary_block = "\n".join(l for l in summary_lines if l)

    # ------------------------------------------------------------------
    # 4) Dump EVERY field for maximum context
    # ------------------------------------------------------------------
    raw_json = json.dumps(player_data, indent=2, default=str)

    # ------------------------------------------------------------------
    # 5) Build the prompt
    # ------------------------------------------------------------------
    prompt = textwrap.dedent(f"""
        CONFERENCE‑FINALS GAME‑1 BETTING ANALYSIS — {team} @ {opponent}

        Player: {name}
        Over/Under threshold: {threshold:.1f} points

        ───────── CONTEXT ─────────
        • Team seed & venue : {team_ctx.get('seed')}‑seed, {team_ctx.get('arena')}
        • Opponent seed     : {opponent_ctx.get('seed')}
        • Team narrative    : {team_ctx.get('narrative')}
        • Opp narrative     : {opponent_ctx.get('narrative')}

        ───────── METRICS ─────────
    {summary_block or '  • (no point‑probability metrics available)'}

        ───────── TASK ─────────
        1. Use ALL information below (including full playoff game logs) to judge the
           likelihood that {name} will score **over** {threshold:.1f} points tonight.
        2. Weigh home‑court, fatigue, momentum, injury status, blow‑out risk, NYC media
           pressure (for Knicks), and the fact this is Game‑1 (teams still adjusting).
        3. Output STRICT JSON with three keys:
             {{
               "recommendation": one of ["Yes","A High Possible","Maybe","No!"],
               "confidenceRange": short human phrase,
               "explanation": 2‑3 dense paragraphs (no bullet points) justifying the pick
             }}
        4. If the player appears in the injury report, include that info in the
           "explanation" field. Specifically, if the player is "Out," then make the
           recommendation be "No!" and explain it is that way because there is 0% chance he 
           plays in the game, meaning zero percant chance of scoring over the threshold.

        ───────── FULL DATA ─────────
        ```json
        {raw_json}
        ```
    """).strip()

    # ------------------------------------------------------------------
    # 6) Call OpenAI (same model as before) and return its JSON
    # ------------------------------------------------------------------
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY env var not set.")

    client = OpenAI(api_key=api_key)

    try:
        resp = client.chat.completions.create(
            model="o4-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            timeout=45,   # seconds – keeps Cloud Run from hanging too long
        )
        return json.loads(resp.choices[0].message.content)
    except OpenAIError as e:
        raise RuntimeError(f"OpenAI API error: {e}") from e
    except json.JSONDecodeError:
        # If the model spits malformed JSON, surface raw text for debugging
        return {
            "recommendation": "Error",
            "confidenceRange": "N/A",
            "explanation": resp.choices[0].message.content.strip(),
        }