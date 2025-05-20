import requests
import pdfplumber
import tempfile
import re
import warnings
import logging
from datetime import datetime, timedelta
import pytz

warnings.filterwarnings("ignore", message="CropBox missing")
logging.getLogger("pdfminer").setLevel(logging.ERROR)
logging.getLogger("pdfplumber").setLevel(logging.ERROR)

def get_current_est_time_string():
    eastern = pytz.timezone("America/New_York")
    now_est = datetime.now(eastern)
    return now_est.strftime("%Y-%m-%d %I:%M %p EST")

def get_injury_report_url():
    eastern = pytz.timezone("America/New_York")
    now = datetime.now(eastern)

    hour_24 = now.hour
    minute = now.minute

    # If minute < 30, use previous hour
    if minute < 30:
        hour_24 -= 1
        if hour_24 < 0:
            hour_24 += 24
            now = now - timedelta(days=1)

    if hour_24 == 0:
        hour_12 = 12
        am_pm = "AM"
    elif 1 <= hour_24 < 12:
        hour_12 = hour_24
        am_pm = "AM"
    elif hour_24 == 12:
        hour_12 = 12
        am_pm = "PM"
    else:
        hour_12 = hour_24 - 12
        am_pm = "PM"

    date_str = now.strftime("%Y-%m-%d")
    hour_str = f"{hour_12:02d}{am_pm}"
    return f"https://ak-static.cms.nba.com/referee/injury/Injury-Report_{date_str}_{hour_str}.pdf"

    #return f"https://ak-static.cms.nba.com/referee/injury/Injury-Report_2025-03-20_07PM.pdf"

def get_player_injury_status(player_name):
    """
    Get the injury status for a specific player
    Returns a dictionary with status and reason if found, or None if not found
    """
    if not player_name:
        return {"error": "No player name provided"}

    pdf_url = get_injury_report_url()

    try:
        resp = requests.get(pdf_url)
        resp.raise_for_status()
    except Exception as e:
        print(f"Error downloading the PDF: {e}")
        return {"error": f"Error downloading injury report: {str(e)}"}

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_pdf:
        tmp_pdf.write(resp.content)
        tmp_pdf.flush()

        try:
            with pdfplumber.open(tmp_pdf.name) as pdf:
                # These x-coordinates are just an example; replace with your measured values.
                x_positions = [23, 119, 199, 260, 420, 575, 660, 820]

                table_settings = {
                    "vertical_strategy": "explicit",
                    "horizontal_strategy": "lines",
                    "explicit_vertical_lines": x_positions,
                    "snap_tolerance": 3,
                    "join_tolerance": 3,
                    "text_x_tolerance": 3,
                    "text_y_tolerance": 3,
                }

                all_rows = []
                for page_index, page in enumerate(pdf.pages, start=1):
                    table = page.extract_table(table_settings) or []
                    for row in table:
                        all_rows.append(row)

        except Exception as parse_err:
            print(f"Error parsing PDF with pdfplumber: {parse_err}")
            return {"error": f"Error parsing injury report: {str(parse_err)}"}

    # Now we have all_rows from all pages
    # Search for the player's name
    found = False
    players = []
    for row in all_rows:
        if len(row) < 7:
            continue
        game_date, game_time, matchup, team, player, status, reason = row[:7]

        if "t:" in game_date or "player" in player:
            continue
            
        # Clean up the reason field - remove newlines and extra spaces
        clean_reason = reason.replace("\n", " ").strip() if reason else ""
        players.append( {
            #"gameDate": game_date,
            #"gameTime": game_time,
            "matchup": matchup,
            "player": player,
            "status": status,
            "reason": clean_reason
        })
        
    return players
    



players = get_player_injury_status("Naz Reid")
for index, player in enumerate(players):
    print(f"{index}: {players[index]}")