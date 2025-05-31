# chatgpt_bet_explainer.py  (REPLACE the old get_bet_explanation_from_chatgpt)

import os, json, textwrap
from openai import OpenAI, OpenAIError

# ---------- TEAM‑LEVEL one‑off context (hard‑coded for now) ----------
_TEAM_CTX = { 
    "Knicks": {
        "seed"      : 3,
        "arena"     : "Away @ PAC",
        "narrative" : (
            "First ECF trip since 2000. City starving for a title – crowd and "
            "media pressure cranked to 11. Jalen Brunson averaging 26.2 PPG "
            "despite constant traps."
            "They are down 2-3 and are looking to force a Game 7 at home."
            "Winning the conference finals would mean a trip to the NBA Finals for the first time since 1999"
            "And a chance at a chip for the first time since 1973."
            "The team has been humilated for being trash for so long"
            "This is a chance to make history."
        ),
    },
    "Pacers": {
        "seed"      : 4,
        "arena"     : "Home – Gainbridge Fieldhouse",
        "narrative" : (
            "Blew out #1 Cleveland in 5 with NBA‑best 121.1 offensive rating. "
            "Tyrese Haliburton fresh after short series."
            "Time to make history. They are up 3-2 and are looking to close out the series at home."
            "Winning would mean a trip to the NBA Finals for the first time since 2000"
            "And a chance at a chip in the ABA for the first time since 1973."
            "They have never won the NBA Finals"
            "A loss would mean a trip back to New York City for Game 7."
            "A game that would mean it would be anyones game at a terrifying Madison Square Garden."
        ),
    },
}

series_information = {
  "series_info": {
    "league": "NBA",
    "stage": "Eastern Conference Finals",
    "game_number": 6,
    "teams": {
      "Knicks": {
        "seed": 3,
        "series_record": "2-3"
      },
      "Pacers": {
        "seed": 4,
        "series_record": "3-2"
      }
    },
    "tip_off_time": "5:00 PM",
    "broadcast": [
      "Max",
      "TNT",
      "truTV"
    ]
  },
  "betting_odds": {
    "provider": "DraftKings",
    "lines": [
      {
        "team": "NYK",
        "moneyline": "+145",
        "total": {
          "type": "Over",
          "value": 221.5,
          "vig": -110
        },
        "spread": {
          "value": 4.0,
          "direction": "+",
          "vig": -110
        }
      },
      {
        "team": "IND",
        "moneyline": "-175",
        "total": {
          "type": "Under",
          "value": 221.5,
          "vig": -110
        },
        "spread": {
          "value": 4.0,
          "direction": "-",
          "vig": -110
        }
      }
    ]
  },
  "game_results": [
    {
      "game": 1,
      "winner": {
        "team": "Pacers",
        "seed": 4
      },
      "loser": {
        "team": "Knicks",
        "seed": 3
      },
      "score": "138-135",
      "status": "Final"
    },
    {
      "game": 2,
      "winner": {
        "team": "Pacers",
        "seed": 4
      },
      "loser": {
        "team": "Knicks",
        "seed": 3
      },
      "score": "114-109",
      "status": "Final"
    },
    {
      "game": 3,
      "winner": {
        "team": "Knicks",
        "seed": 3
      },
      "loser": {
        "team": "Pacers",
        "seed": 4
      },
      "score": "106-100",
      "status": "Final"
    },
    {
      "game": 4,
      "winner": {
        "team": "Pacers",
        "seed": 4
      },
      "loser": {
        "team": "Knicks",
        "seed": 3
      },
      "score": "130-121",
      "status": "Final"
    },
    {
      "game": 5,
      "winner": {
        "team": "Knicks",
        "seed": 3
      },
      "loser": {
        "team": "Pacers",
        "seed": 4
      },
      "score": "111-94",
      "status": "Final"
    }
  ],
  "upcoming_games": [
    {
      "game": 6,
      "date": "5/31",
      "matchup": "Knicks vs Pacers",
      "tip_off_time": "5:00 PM"
    },
    {
      "game": 7,
      "if_necessary": True,
      "date": "6/2",
      "matchup": "Pacers vs Knicks",
      "tip_off_time": "5:00 PM"
    }
  ],
  "easter_conference_standings": [
    {
      "team": "Knicks",
      "seed": 3,
      "W": 51,
      "L": 31,
      "PCT": ".622",
      "GB": 13
    },
    {
      "team": "Pacers",
      "seed": 4,
      "W": 50,
      "L": 32,
      "PCT": ".610",
      "GB": 14
    }
  ]
}

pacers_roster = {
  "Best Players": [
    {
      "name": "Tyrese Haliburton",
      "PPG": 18.6,
      "APG": 9.2,
      "MPG": 33.6,
      "PPM": 0.5536,
      "APM": 0.2738
    },
    {
      "name": "Pascal Siakam",
      "PPG": 20.2,
      "APG": 3.4,
      "MPG": 32.7,
      "PPM": 0.6180,
      "APM": 0.1040
    },
    {
      "name": "Myles Turner",
      "PPG": 15.6,
      "APG": 1.5,
      "MPG": 30.2,
      "PPM": 0.5166,
      "APM": 0.0497
    },
    {
      "name": "Bennedict Mathurin",
      "PPG": 16.1,
      "APG": 1.9,
      "MPG": 29.8,
      "PPM": 0.5403,
      "APM": 0.0638
    },
    {
      "name": "Andrew Nembhard",
      "PPG": 10.0,
      "APG": 5.0,
      "MPG": 28.9,
      "PPM": 0.3460,
      "APM": 0.1730
    }
  ],
  "Roster": [
    {
      "name": "Tyrese Haliburton",
      "PPG": 18.6,
      "APG": 9.2,
      "MPG": 33.6,
      "PPM": 0.5536,
      "APM": 0.2738
    },
    {
      "name": "Pascal Siakam",
      "PPG": 20.2,
      "APG": 3.4,
      "MPG": 32.7,
      "PPM": 0.6180,
      "APM": 0.1040
    },
    {
      "name": "Myles Turner",
      "PPG": 15.6,
      "APG": 1.5,
      "MPG": 30.2,
      "PPM": 0.5166,
      "APM": 0.0497
    },
    {
      "name": "Aaron Nesmith",
      "PPG": 12.0,
      "APG": 1.2,
      "MPG": 25.0,
      "PPM": 0.4800,
      "APM": 0.0480
    },
    {
      "name": "Bennedict Mathurin",
      "PPG": 16.1,
      "APG": 1.9,
      "MPG": 29.8,
      "PPM": 0.5403,
      "APM": 0.0638
    },
    {
      "name": "Tyrese Haliburton",
      "PPG": 18.6,
      "APG": 9.2,
      "MPG": 33.6,
      "PPM": 0.5536,
      "APM": 0.2738
    },
    {
      "name": "T.J. McConnell",
      "PPG": 9.1,
      "APG": 4.4,
      "MPG": 17.9,
      "PPM": 0.5080,
      "APM": 0.2460
    },
    {
      "name": "Obi Toppin",
      "PPG": 10.5,
      "APG": 1.6,
      "MPG": 19.6,
      "PPM": 0.5360,
      "APM": 0.0816
    },
    {
      "name": "Ben Sheppard",
      "PPG": 5.3,
      "APG": 1.3,
      "MPG": 19.5,
      "PPM": 0.2718,
      "APM": 0.0667
    },
    {
      "name": "Andrew Nembhard",
      "PPG": 10.0,
      "APG": 5.0,
      "MPG": 28.9,
      "PPM": 0.3460,
      "APM": 0.1730
    },
    {
      "name": "Jarace Walker",
      "PPG": 6.1,
      "APG": 1.5,
      "MPG": 15.8,
      "PPM": 0.3861,
      "APM": 0.0949
    },
    {
      "name": "James Johnson",
      "PPG": 0.7,
      "APG": 0.3,
      "MPG": 3.1,
      "PPM": 0.2258,
      "APM": 0.0968
    },
    {
      "name": "Thomas Bryant",
      "PPG": 6.5,
      "APG": 0.8,
      "MPG": 14.6,
      "PPM": 0.4452,
      "APM": 0.0548
    },
    {
      "name": "Tony Bradley",
      "PPG": 4.4,
      "APG": 0.4,
      "MPG": 8.1,
      "PPM": 0.5432,
      "APM": 0.0494
    },
    {
      "name": "Moses Brown",
      "PPG": 5.8,
      "APG": 0.2,
      "MPG": 9.2,
      "PPM": 0.6304,
      "APM": 0.0217
    },
    {
      "name": "Isaiah Jackson",
      "PPG": 7.0,
      "APG": 1.0,
      "MPG": 16.8,
      "PPM": 0.4167,
      "APM": 0.0595
    },
    {
      "name": "Quenton Jackson",
      "PPG": 5.7,
      "APG": 1.7,
      "MPG": 14.1,
      "PPM": 0.4043,
      "APM": 0.1206
    },
    {
      "name": "Johnny Furphy",
      "PPG": 2.4,
      "APG": 0.4,
      "MPG": 8.5,
      "PPM": 0.2824,
      "APM": 0.0471
    },
    {
      "name": "Enrique Freeman",
      "PPG": 1.8,
      "APG": 0.4,
      "MPG": 7.5,
      "PPM": 0.2400,
      "APM": 0.0533
    },
    {
      "name": "RayJ Dennis",
      "PPG": 0.0,
      "APG": 0.0,
      "MPG": 2.0,
      "PPM": 0.0000,
      "APM": 0.0000
    },
    {
      "name": "James Wiseman",
      "PPG": 6.0,
      "APG": 0.0,
      "MPG": 5.0,
      "PPM": 1.2000,
      "APM": 0.0000
    },
    {
      "name": "Tristen Newton",
      "PPG": 0.6,
      "APG": 0.2,
      "MPG": 1.6,
      "PPM": 0.3750,
      "APM": 0.1250
    }
  ]
}

knicks_roster = {
  "Best Players": [
    {
      "name": "Jalen Brunson",
      "PPG": 26.0,
      "APG": 7.3,
      "MPG": 35.4,
      "PPM": 0.7345,
      "APM": 0.2062
    },
    {
      "name": "Karl-Anthony Towns",
      "PPG": 24.4,
      "APG": 3.1,
      "MPG": 35.0,
      "PPM": 0.6971,
      "APM": 0.0886
    },
    {
      "name": "Mikal Bridges",
      "PPG": 17.6,
      "APG": 3.7,
      "MPG": 37.0,
      "PPM": 0.4757,
      "APM": 0.1000
    },
    {
      "name": "OG Anunoby",
      "PPG": 18.0,
      "APG": 2.2,
      "MPG": 36.6,
      "PPM": 0.4918,
      "APM": 0.0601
    },
    {
      "name": "Josh Hart",
      "PPG": 13.6,
      "APG": 5.9,
      "MPG": 37.6,
      "PPM": 0.3617,
      "APM": 0.1570
    }
  ],
  "Roster": [
    {
      "name": "Jalen Brunson",
      "PPG": 26.0,
      "APG": 7.3,
      "MPG": 35.4,
      "PPM": 0.7345,
      "APM": 0.2062
    },
    {
      "name": "Karl-Anthony Towns",
      "PPG": 24.4,
      "APG": 3.1,
      "MPG": 35.0,
      "PPM": 0.6971,
      "APM": 0.0886
    },
    {
      "name": "Mikal Bridges",
      "PPG": 17.6,
      "APG": 3.7,
      "MPG": 37.0,
      "PPM": 0.4757,
      "APM": 0.1000
    },
    {
      "name": "OG Anunoby",
      "PPG": 18.0,
      "APG": 2.2,
      "MPG": 36.6,
      "PPM": 0.4918,
      "APM": 0.0601
    },
    {
      "name": "Josh Hart",
      "PPG": 13.6,
      "APG": 5.9,
      "MPG": 37.6,
      "PPM": 0.3617,
      "APM": 0.1570
    },
    {
      "name": "Precious Achiuwa",
      "PPG": 6.6,
      "APG": 1.0,
      "MPG": 20.5,
      "PPM": 0.32195,
      "APM": 0.0488
    },
    {
      "name": "Delon Wright",
      "PPG": 3.1,
      "APG": 1.9,
      "MPG": 15.9,
      "PPM": 0.1950,
      "APM": 0.1195
    },
    {
      "name": "Miles McBride",
      "PPG": 9.5,
      "APG": 2.9,
      "MPG": 24.9,
      "PPM": 0.3815,
      "APM": 0.1165
    },
    {
      "name": "Cameron Payne",
      "PPG": 6.9,
      "APG": 2.8,
      "MPG": 15.1,
      "PPM": 0.4560,
      "APM": 0.1854
    },
    {
      "name": "Landry Shamet",
      "PPG": 5.7,
      "APG": 0.5,
      "MPG": 15.2,
      "PPM": 0.3750,
      "APM": 0.0329
    },
    {
      "name": "Mitchell Robinson",
      "PPG": 5.1,
      "APG": 0.8,
      "MPG": 17.1,
      "PPM": 0.2982,
      "APM": 0.0468
    },
    {
      "name": "Jericho Sims",
      "PPG": 1.8,
      "APG": 0.6,
      "MPG": 13.3,
      "PPM": 0.1353,
      "APM": 0.0451
    },
    {
      "name": "Ariel Hukporti",
      "PPG": 1.3,
      "APG": 0.4,
      "MPG": 9.7,
      "PPM": 0.1340,
      "APM": 0.0412
    },
    {
      "name": "Pacôme Dadiet",
      "PPG": 1.9,
      "APG": 0.4,
      "MPG": 7.4,
      "PPM": 0.2568,
      "APM": 0.0541
    },
    {
      "name": "Tyler Kolek",
      "PPG": 3.4,
      "APG": 0.8,
      "MPG": 7.9,
      "PPM": 0.4304,
      "APM": 0.1013
    },
    {
      "name": "Matt Ryan",
      "PPG": 0.6,
      "APG": 0.0,
      "MPG": 5.0,
      "PPM": 0.1200,
      "APM": 0.0000
    },
    {
      "name": "Jacob Toppin",
      "PPG": 0.4,
      "APG": 0.0,
      "MPG": 2.8,
      "PPM": 0.1429,
      "APM": 0.0000
    },
    {
      "name": "Kevin McCullar Jr",
      "PPG": 0.0,
      "APG": 0.0,
      "MPG": 0.0,
      "PPM": 0.0000,
      "APM": 0.0000
    },
    {
      "name": "MarJon Beauchamp",
      "PPG": 0.0,
      "APG": 0.0,
      "MPG": 0.0,
      "PPM": 0.0000,
      "APM": 0.0000
    }
  ]
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
    
# line 94: 
'''  ───────── CONTEXT ─────────
        • Team seed & venue : {team_ctx.get('seed')}‑seed, {team_ctx.get('arena')}
        • Opponent seed     : {opponent_ctx.get('seed')}
        • Team narrative    : {team_ctx.get('narrative')}
        • Opp narrative     : {opponent_ctx.get('narrative')} '''