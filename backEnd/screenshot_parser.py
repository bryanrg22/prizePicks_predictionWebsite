import os, base64, json            # ← add json
from openai import OpenAI
from player_analyzer import player_image_loading

key = os.getenv("OPENAI_API_KEY", "YOUR_API_KEY_HERE")
llm  = OpenAI(api_key=key)

def parse_image_data_url(data_url: str) -> dict:
    """
    Send one PrizePicks screenshot (as a data-URL) to the vision model and
    return something like:
        { "players": [...], "count": <int> }
    while also printing a quick summary to the Flask console.
    """
    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": (
                        "I just uploaded a PrizePicks screenshot. "
                        "Extract *all* NBA player names and their point-projection thresholds. "
                        "Names must be ASCII only (e.g. č → c). "
                        'Return **only** valid JSON like:\n'
                        '{ "players":[{ "player":"LeBron James", "threshold":28.5 }, …] }'
                    )
                },
                { "type": "image_url", "image_url": { "url": data_url } }
            ]
        }
    ]
    try:
        resp      = llm.chat.completions.create(
            model="o4-mini",
            messages=messages,
            response_format={"type": "json_object"}
        )
    except Exception as e:
        # this will catch the “did not match the expected pattern” error
        print(f"[⚠️  LLM parse-error] {e}")
        return {"players": [], "count": 0}

    raw_json  = resp.choices[0].message.content   # already a JSON-string

    try:
        data = json.loads(raw_json)
    except json.JSONDecodeError:
        print("[⚠️  Parse-error] Couldn’t decode JSON – returning empty list.")
        return {"players": [], "count": 0}

    # insert “count”, then print nice summary
    data["count"] = len(data.get("players", []))

    for player in data["players"]:
        player["image"] = player_image_loading(player["player"])
       


    print(f"[✓ Parsed] Found {data['count']} player(s).\n")

    return data
