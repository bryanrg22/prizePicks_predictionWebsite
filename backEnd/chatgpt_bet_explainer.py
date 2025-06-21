"""
chatgpt_bet_explainer.py
────────────────────────
Builds the natural-language write-up for an NBA prop.

• Uses OpenAI **o4-mini** for speed/cost; flip `MODEL` to "gpt-4o"
  or "gpt-4o-128k" when you need deeper context. :contentReference[oaicite:0]{index=0}
• Back-fills Poisson & Monte-Carlo probabilities if the Firestore
  document is missing them.
• Returns a dict:
      { "explanation": str,
        "confidenceRange": str,
        "recommendation": str }
"""

from __future__ import annotations
import json, math, os, random, typing as _t

import numpy as np
from scipy import stats as st
from openai import OpenAI


# ──────────────────────────────────────────────────
#  Static context (blurb appears in the prompt)
# ──────────────────────────────────────────────────
_TEAM_CTX = {
    "Pacers": {
        "seed": 4,
        "arena": "Away – Paycom Center, Oklahoma City",
        "narrative": (
            "Indiana clawed back from a 3-2 deficit with a 108-91 rout in Game 6, "
            "forcing the first Finals Game 7 since 2016. Tyrese Haliburton "
            "(right-calf tightness) says he’s ‘100 percent playing,’ while Pascal "
            "Siakam and a deep bench have powered the NBA’s surprise run."
        ),
    },
    "Thunder": {
        "seed": 1,
        "arena": "Home – Paycom Center",
        "narrative": (
            "Oklahoma City, owner of a league-best 68-14 record and led by MVP "
            "Shai Gilgeous-Alexander, still controls home court after letting "
            "Game 6 slip away."
        ),
    },
}

_ESPN_CTX = {
    "game": {
        "series":        "NBA Finals",
        "game_number":   7,
        "series_status": "Tied 3-3",
        "datetime_et":   "Sunday 8:00 p.m. ET",  # Jun 22 2025
        "venue":         "Paycom Center, Oklahoma City",
        "odds": {"favorite": "Thunder", "spread": -7.5, "over_under": 215},
    }
}


# ──────────────────────────────────────────────────
#  Probability helpers (local – no network)
# ──────────────────────────────────────────────────
def _poisson_over(lmbda: float, threshold: float) -> float:
    k = math.floor(threshold)
    cdf = sum(math.exp(-lmbda) * lmbda**i / math.factorial(i) for i in range(k + 1))
    return 1 - cdf


def _mc_over(history: list[float], threshold: float, sims: int = 20_000) -> float:
    if not history:
        return None
    draws = np.random.choice(history, size=sims, replace=True)
    return float(np.mean(draws > threshold))


def _blend(p_pois: float | None, p_mc: float | None, w_mc: float = 0.6) -> float:
    if p_pois is None:
        return p_mc
    if p_mc is None:
        return p_pois
    return w_mc * p_mc + (1 - w_mc) * p_pois


def _ci(p: float, n: int = 20_000) -> tuple[float, float]:
    se = math.sqrt(p * (1 - p) / n)
    return max(0, p - 1.96 * se), min(1, p + 1.96 * se)


# ──────────────────────────────────────────────────
#  Main public entry point
# ──────────────────────────────────────────────────
MODEL = "gpt-4o-mini"        # swap to "gpt-4o" or "gpt-4o-128k" when needed
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def get_bet_explanation_from_chatgpt(pdata: dict) -> dict[str, str]:
    """Return {"explanation", "confidenceRange", "recommendation"} for this prop."""

    # 1) Make sure probabilities exist (or compute them quickly)
    thr = pdata.get("threshold")
    poisson = pdata.get("poissonProbability")
    mc      = pdata.get("monteCarloProbability")

    if poisson is None and pdata.get("seasonAvgPoints") and thr is not None:
        poisson = _poisson_over(pdata["seasonAvgPoints"], thr)

    if mc is None and pdata.get("last5RegularGames"):
        pts_hist = [g["points"] for g in pdata["last5RegularGames"] if "points" in g]
        mc = _mc_over(pts_hist, thr)

    blended = _blend(poisson, mc)
    lo, hi  = _ci(blended)
    conf_str = f"{lo:.1%} – {hi:.1%}"

    # 2) Build a tight, structured prompt
    sys_prompt = (
        "You are **Prize Picks Parlay Picker**, an NBA prop explainer.\n"
        "Return a *single* JSON object with keys "
        "`explanation`, `confidenceRange`, `recommendation`.\n"
        "- Keep the write-up ≤ 120 words.\n"
        "- Use the field `blendedProbability` to drive the pick:\n"
        "    ≥ 55 % → \"Lean Over\"\n"
        "    45–55 % → \"Stay Away\"\n"
        "    ≤ 45 % → \"Lean Under\"\n"
        "- Never give financial advice; remind users to gamble responsibly."
    )

    user_payload = {
        "playerDoc": pdata,
        "teamContext": _TEAM_CTX.get(pdata.get("team")),
        "opponentContext": _TEAM_CTX.get(pdata.get("opponent")),
        "gameContext": _ESPN_CTX,
        "calculatedProbabilities": {
            "poissonProbability": poisson,
            "monteCarloProbability": mc,
            "blendedProbability": blended,
            "confidenceRange": conf_str,
        },
    }

    # 3) Call the model (JSON mode keeps parsing bullet-proof)
    chat = client.chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": sys_prompt},
            {"role": "user",   "content": json.dumps(user_payload)},
        ],
        max_tokens=300,
        temperature=0.3,
    )

    # 4) Safe-parse; fall back to a template if anything goes sideways
    try:
        out = json.loads(chat.choices[0].message.content)
        return {
            "explanation":     out.get("explanation", "").strip(),
            "confidenceRange": out.get("confidenceRange", conf_str),
            "recommendation":  out.get("recommendation", "").strip(),
        }
    except Exception as err:           # noqa: BLE001
        print("ChatGPT parse error → fallback:", err)
        return {
            "explanation": (
                "Couldn’t fetch AI write-up. Based on internal numbers this prop "
                f"has a {blended:.1%} chance to clear the line. Play at your own risk."
            ),
            "confidenceRange": conf_str,
            "recommendation":  "Lean Over" if blended > 0.55 else "Stay Away",
        }