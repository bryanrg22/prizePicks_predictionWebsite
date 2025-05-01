import os, json
from openai import OpenAI

def get_bet_explanation_from_chatgpt(player_data: dict):
    """
    player_data already contains:
      name, threshold, poissonProbability (float),
      monteCarloProbability (float), injuryReport, advancedPerformance …
    """
    name         = player_data["name"]
    threshold    = player_data["threshold"]
    poisson_p    = player_data["poissonProbability"]
    mc_p         = player_data["monteCarloProbability"]
    injury       = player_data.get("injuryReport", {})
    adv_stats    = player_data.get("advancedPerformance", {})
    team_rankings = player_data.get("teamPlayoffRank", {})

    prompt = f"""
We have data for NBA player {name} regarding scoring over {threshold} points.

Data:
  • Poisson probability  : {poisson_p:.2%}
  • Monte-Carlo probability: {mc_p:.2%}
  • Injury               : {injury}
  • Advanced stats       : {adv_stats}
  • Team / opponent info : {team_rankings}

Advise:
1. Recommend "Yes, Over" or "No, Under".
2. Give a concise (≤ 3 sentence) rationale.
Return valid JSON {{ "recommendation": "...", "explanation": "..." }}.
"""

    key = os.getenv("OPENAI_API_KEY", "YOUR_API_KEY_HERE")
    client = OpenAI(api_key=key)
    resp   = client.chat.completions.create(
                model="o4-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"})
    try:
        return json.loads(resp.choices[0].message.content)
    except json.JSONDecodeError:
        return {"recommendation": "Error", "explanation": resp.choices[0].message.content}
