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

def split_camel_case(s: str) -> str:
    # Insert a space between a lowercase letter and an uppercase letter
    return re.sub(r'([a-z])([A-Z])', r'\1 \2', s)

def swap_comma_name(s: str) -> str:
    last, first = s.split(',', 1)
    return f"{first.strip()} {last.strip()}"

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

def get_full_injury_report():
    """
    Get the injury status for a specific player
    Returns a dictionary with status and reason if found, or None if not found
    """

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
    current_team = ""
    current_game_date = ""
    current_game_time = ""
    players = []
    for row in all_rows:
        if len(row) < 7:
            continue
        game_date, game_time, matchup, team, player, status, reason = row[:7]

        if "t:" in player or "PlayerName" in player:
            continue

        clean_reason = reason.replace("\n", " ").strip() if reason else ""

        if game_date != None:
            current_game_date = game_date

        if game_time != None:
            current_game_time = game_time

        if team and reason == 'NOTYETSUBMITTED':
            players.append( {
                "gameDate": current_game_date,
                "gameTime": current_game_time,
                "team": split_camel_case(team),
                "reason": 'NOT YET SUBMITTED',
            })
        
        elif player:

            if team != None:
                current_team = team
            players.append( {
                "gameDate": current_game_date,
                "gameTime": current_game_time,
                "team": split_camel_case(current_team),
                "player": swap_comma_name(player),
                "status": status,
                "reason": clean_reason
            })
        
    return players
    

##### For manual testing #####
#players = get_full_injury_report()
#for index, player in enumerate(players):
#    if index > 9:
#        print(f"{index}: {players[index]}")
#    else:
#        print(f" {index}: {players[index]}")