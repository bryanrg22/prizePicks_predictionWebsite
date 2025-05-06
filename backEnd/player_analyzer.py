import requests
import datetime
import pytz
import time
import pandas as pd
from nba_api.stats.endpoints import leaguestandings
from nba_api.stats.static import teams, players
from nba_api.stats.endpoints import ScoreboardV2 as Scoreboard
from nba_api.stats.endpoints import playercareerstats, playergamelog
from nba_api.stats.endpoints import PlayerGameLog


############################################################################
### HELPER FUNCTIONS (Moved to top so they are in scope)
############################################################################

# Get the player's NBA.com headshot URL
def get_player_image_url(player_id):
    return f"https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/{player_id}.png"

# Get team logo URL
def get_team_logo_url(team_id):
    return f"https://cdn.nba.com/logos/nba/{team_id}/global/L/logo.svg"

# Get Game Type from Game ID
def deduce_game_type(game_id):
    prefix = game_id[:3]
    return {
      '001': 'Preseason',
      '002': 'Regular Season',
      '003': 'All-Star',
      '004': 'Playoffs',
      '005': 'Play-In',
      '006': 'NBA Cup'
    }.get(prefix, 'Unknown')

# Add this function to fetch more games for a player
def fetch_more_games(player_id, season_str, max_games=30):
    """
    Fetch more games for a player, up to max_games
    """
    try:
        # Try to get more games from the current season
        season_log = playergamelog.PlayerGameLog(
            player_id=player_id, 
            season=season_str
        ).get_data_frames()[0]
        
        if season_log.empty:
            print(f"No games found for player {player_id} in season {season_str}")
            return []
            
        # Take up to max_games
        games_to_process = min(len(season_log), max_games)
        recent_games = season_log.head(games_to_process)
        
        games_list = []
        for idx, g in recent_games.iterrows():
            matchup = g["MATCHUP"]
            if "vs." in matchup:
                home_away = "Home"
                opponent_abbr_recent = matchup.split(" vs. ")[1].strip()
            elif "@" in matchup:
                home_away = "Away"
                opponent_abbr_recent = matchup.split(" @ ")[1].strip()
            else:
                home_away = "Unknown"
                opponent_abbr_recent = "Unknown"
                
            opp_full = get_team_full_name_from_abbr(opponent_abbr_recent)
            opp_id = get_team_id_from_abbr(opponent_abbr_recent)
            opp_logo = get_team_logo_url(opp_id) if opp_id else "/placeholder.svg?height=20&width=20"

            print("Game Type", end=" ")
            print(deduce_game_type(g["GAME_ID"]))
            
            games_list.append({
                "date": g["GAME_DATE"],
                "points": int(g["PTS"]),
                "opponent": opp_full,
                "opponentFullName": opp_full,
                "opponentLogo": opp_logo,
                "location": home_away,
                "minutes": int(g["MIN"]) if "MIN" in g else None,
                "gameType": deduce_game_type(g["GAME_ID"])
            })
            
        return games_list
    except Exception as e:
        print(f"Error fetching more games: {str(e)}")
        return []

############################################################################
### ADDED: fetch_career_summaries
############################################################################
def fetch_career_summaries(player_id, last_n=3):
    """
    Fetches career season-by-season data for a player using nba_api's playercareerstats.
    Returns a list of dictionaries for the last N seasons with stats like FGA, FG%, etc.
    """
    try:
        career = playercareerstats.PlayerCareerStats(player_id=player_id)
        df = career.get_data_frames()[0]
        if df.empty:
            print(f"[fetch_career_summaries] No career data for player_id={player_id}")
            return []
    except Exception as e:
        print(f"[fetch_career_summaries] Error fetching career data for player_id={player_id}: {e}")
        return []

    data_slices = df.tail(last_n)
    season_stats = []
    for _, row in data_slices.iterrows():
        season_data = {
            "SEASON_ID": row.get("SEASON_ID"),
            "TEAM_ID": row.get("TEAM_ID"),
            "TEAM_ABBREVIATION": row.get("TEAM_ABBREVIATION"),
            "PLAYER_AGE": row.get("PLAYER_AGE"),
            "GP": row.get("GP"),
            "GS": row.get("GS"),
            "MIN": row.get("MIN"),
            "FGM": row.get("FGM"),
            "FGA": row.get("FGA"),
            "FG_PCT": row.get("FG_PCT"),
            "FG3M": row.get("FG3M"),
            "FG3A": row.get("FG3A"),
            "FG3_PCT": row.get("FG3_PCT"),
            "FTM": row.get("FTM"),
            "FTA": row.get("FTA"),
            "FT_PCT": row.get("FT_PCT"),
            "OREB": row.get("OREB"),
            "DREB": row.get("DREB"),
            "REB": row.get("REB"),
            "AST": row.get("AST"),
            "STL": row.get("STL"),
            "BLK": row.get("BLK"),
            "TOV": row.get("TOV"),
            "PF": row.get("PF"),
            "PTS": row.get("PTS"),
        }
        season_stats.append(season_data)
    return season_stats

############################################################################
### CHANGED: fetch_player_game_logs ensures we store FGM, FGA, etc.
############################################################################
def fetch_player_game_logs(nba_player_id, season_str):
    """
    Fetches advanced game logs for the specified NBA player (by official nba_api ID).
    Returns per-game stats including FGM, FGA, 3PA, 3PM, etc.
    """
    try:
        gamelog_df = playergamelog.PlayerGameLog(player_id=nba_player_id, season=season_str).get_data_frames()[0]
    except Exception as e:
        print(f"[fetch_player_game_logs] Error fetching logs for {nba_player_id}, season {season_str}: {e}")
        return []
    if gamelog_df.empty:
        return []
    game_dicts = []
    for idx, row in gamelog_df.iterrows():
        fgm = row.get("FGM", 0)
        fga = row.get("FGA", 0)
        fg3m = row.get("FG3M", 0)
        fg3a = row.get("FG3A", 0)
        ftm = row.get("FTM", 0)
        fta = row.get("FTA", 0)
        tov = row.get("TOV", 0)
        pts = row.get("PTS", 0)
        minutes = row.get("MIN", 0)
        matchup_str = row.get("MATCHUP", "")
        if "vs." in matchup_str:
            home_away_flag = 1
        elif "@" in matchup_str:
            home_away_flag = 0
        else:
            home_away_flag = None
        team_possessions = None  # Not provided in standard boxscores
        game_dicts.append({
            "points": pts,
            "fgm": fgm,
            "fga": fga,
            "3pm": fg3m,
            "3pa": fg3a,
            "ftm": ftm,
            "fta": fta,
            "turnovers": tov,
            "minutes": minutes,
            "home_away_flag": home_away_flag,
            "team_possessions": team_possessions
        })
    return game_dicts

############################################################################
### ADDED: analyze_player_performance using advanced logs
############################################################################
def analyze_player_performance(nba_player_id, season_str):
    """
    Computes additional advanced stats from the official NBA ID logs.
    Returns stats such as eFG%, usage_rate, shot distribution, FT rate, etc.
    Prints debug info for each game.
    """
    logs = fetch_player_game_logs(nba_player_id, season_str)
    if not logs:
        print(f"[analyze_player_performance] No logs for ID={nba_player_id}, season={season_str}")
        return {
            "avg_points": 0,
            "avg_minutes": 0,
            "usage_rate": None,
            "efg": 0,
            "shot_dist_3pt": 0,
            "ft_rate": 0,
            "avg_points_home": 0,
            "avg_points_away": 0
        }
    total_points = 0
    total_fga = 0
    total_fgm = 0
    total_3pa = 0
    total_3pm = 0
    total_fta = 0
    total_ftm = 0
    total_tov = 0
    total_minutes = 0
    total_possessions = 0
    home_games = []
    away_games = []
    for idx, g in enumerate(logs):
        print(f"[Game #{idx}] => {g}")
        points = g.get("points", 0)
        fga = g.get("fga", 0)
        fgm = g.get("fgm", 0)
        tpa = g.get("3pa", 0)
        tpm = g.get("3pm", 0)
        fta = g.get("fta", 0)
        ftm = g.get("ftm", 0)
        tov = g.get("turnovers", 0)
        minutes = g.get("minutes", 0)
        home_away_flag = g.get("home_away_flag", None)
        poss = g.get("team_possessions", None)
        total_points += points
        total_fga += fga
        total_fgm += fgm
        total_3pa += tpa
        total_3pm += tpm
        total_fta += fta
        total_ftm += ftm
        total_tov += tov
        total_minutes += minutes
        if home_away_flag == 1:
            home_games.append(points)
        elif home_away_flag == 0:
            away_games.append(points)
        if poss is not None:
            total_possessions += poss
    total_games = len(logs)
    if total_fga > 0:
        efg = (total_fgm + 0.5 * total_3pm) / total_fga
    else:
        efg = 0
        print("[analyze_player_performance] No FGA => eFG=0")
    shot_dist_3pt = (total_3pa / total_fga) if total_fga else 0
    ft_rate = (total_fta / total_fga) if total_fga else 0
    usage_rate = None
    if total_possessions > 0:
        usage_rate = (total_fga + 0.44 * total_fta + total_tov) / total_possessions
    else:
        print("[analyze_player_performance] No possessions => usage_rate=None")
    avg_points = total_points / total_games if total_games else 0
    avg_minutes = total_minutes / total_games if total_games else 0
    avg_points_home = sum(home_games) / len(home_games) if home_games else 0
    avg_points_away = sum(away_games) / len(away_games) if away_games else 0
    print(f"[analyze_player_performance] FINAL => avg_points={avg_points}, efg={efg}, "
          f"shot_dist_3pt={shot_dist_3pt}, ft_rate={ft_rate}, usage_rate={usage_rate}, "
          f"avg_points_home={avg_points_home}, avg_points_away={avg_points_away}")
    return {
        "avg_points": avg_points,
        "avg_minutes": avg_minutes,
        "usage_rate": usage_rate,
        "efg": efg,
        "shot_dist_3pt": shot_dist_3pt,
        "ft_rate": ft_rate,
        "avg_points_home": avg_points_home,
        "avg_points_away": avg_points_away
    }

############################################################################
### CHANGED: in analyze_player, use name-based lookup for NBA ID and merge old data
############################################################################
def analyze_player(first_name, last_name, threshold=None):
    """
    1) Use balldontlie just for the player's name confirmation.
    2) Then obtain the official NBA ID via players.find_players_by_full_name.
    3) Retrieve logs and team info from nba_api.
    4) Return a data object with original fields (name, photoUrl, teamLogo, opponentLogo, etc.)
       plus advanced metrics and career season stats.
    """
    # (A) Use balldontlie to check for player's existence (but ignore its ID)
    url = "https://api.balldontlie.io/v1/players"
    headers = {"Authorization": "03f64803-21d9-40e4-ab9f-5d69ca82c8dc"}
    params = {"first_name": first_name, "last_name": last_name}
    response = requests.get(url, headers=headers, params=params)
    if response.status_code != 200:
        return {"error": f"API Error from balldontlie: {response.status_code}"}
    bd_players = response.json().get("data", [])
    if not bd_players:
        return {"error": f"No players found in balldontlie for {first_name} {last_name}"}
    bdl_player = bd_players[0]
    
    # (B) Get the official NBA ID using nba_api
    full_name = f"{bdl_player['first_name']} {bdl_player['last_name']}"
    nba_found = players.find_players_by_full_name(full_name)
    if not nba_found:
        return {"error": f"No matching NBA Stats player found for {full_name}"}
    nba_player_id = nba_found[0]["id"]
    
    ##################################################################
    # (C) Retrieve team info and game schedule as before.
    ##################################################################
    player_name = full_name
    player_position = bdl_player.get("position", "N/A")
    player_team = bdl_player["team"]["full_name"] if bdl_player.get("team") else "Unknown Team"
    player_team_conference = bdl_player["team"].get("conference", "Unknown")
    standings = leaguestandings.LeagueStandings().get_data_frames()[0]
    standings["TeamID"] = standings["TeamID"].astype(int)
    player_team_standings = teams.find_teams_by_full_name(player_team)[0]
    player_team_id = player_team_standings["id"]
    player_team_standings = standings[standings["TeamID"] == player_team_id]
    player_team_logo = get_team_logo_url(player_team_id)
    player_team_playoffRank = int(player_team_standings["PlayoffRank"].values[0])
    
    # Find upcoming game (using Scoreboard)
    max_search_days = 14
    eastern = pytz.timezone('America/New_York')
    today_eastern = datetime.datetime.now(eastern).date()
    search_date = today_eastern
    game_date_str = None
    game_date_est = None
    opponent_team_name = None
    opponent_team_conference = None
    opponent_team_playoffRank = None
    opponent_team_logo = None
    home = None
    next_game_id = None
    for _ in range(max_search_days):
        game_date_str = search_date.strftime("%m/%d/%Y")
        try:
            scoreboard = Scoreboard(game_date=game_date_str, league_id='00')
            game_df = scoreboard.game_header.get_data_frame()
        except Exception:
            search_date += datetime.timedelta(days=1)
            continue
        if not game_df.empty:
            print("NOT EMPTY")
            if player_team_id in game_df['HOME_TEAM_ID'].values:
                home_index = int(game_df.index[game_df['HOME_TEAM_ID'] == player_team_id][0])
                opponent_team_id = game_df.at[home_index, 'VISITOR_TEAM_ID']
                game_date_est = game_df.at[home_index, 'GAME_STATUS_TEXT']
                home = True
                next_game_id = game_df.at[home_index, 'GAME_ID']
                next_game_type = deduce_game_type(next_game_id) if next_game_id else None
                break
            elif player_team_id in game_df['VISITOR_TEAM_ID'].values:
                away_index = int(game_df.index[game_df['VISITOR_TEAM_ID'] == player_team_id][0])
                opponent_team_id = game_df.at[away_index, 'HOME_TEAM_ID']
                game_date_est = game_df.at[away_index, 'GAME_STATUS_TEXT']
                home = False
                next_game_id = game_df.at[away_index, 'GAME_ID']
                next_game_type = deduce_game_type(next_game_id) if next_game_id else None
                break
        search_date += datetime.timedelta(days=1)
    all_teams = teams.get_teams()
    opponent_team = next((t for t in all_teams if t["id"] == opponent_team_id), None)
    opponent_team_name = opponent_team["full_name"] if opponent_team else "Unknown Opponent"
    opponent_team_logo = get_team_logo_url(opponent_team_id) if opponent_team else "/placeholder.svg?height=40&width=40"
    matchup = f"{opponent_team_name} at {player_team}" if home else f"{player_team} at {opponent_team_name}"
    opponent_team_standings = standings[standings["TeamID"] == opponent_team_id] if opponent_team_id else None
    if opponent_team_standings is not None and not opponent_team_standings.empty:
        opponent_team_conference = opponent_team_standings["Conference"].values[0]
        opponent_team_playoffRank = int(opponent_team_standings["PlayoffRank"].values[0])
    
    # Get player image URL from official NBA ID
    player_image_url = get_player_image_url(nba_player_id)

    def get_team_full_name_from_abbr(abbr):
        for t in all_teams:
            if t["abbreviation"] == abbr:
                return t["full_name"]
        return abbr

    def get_team_id_from_abbr(abbr):
        for t in all_teams:
            if t["abbreviation"] == abbr:
                return t["id"]
        return None

    def get_current_season():
        now = datetime.datetime.now()
        if now.month >= 10:
            season_start = now.year
            season_end = now.year + 1
        else:
            season_start = now.year - 1
            season_end = now.year
        return f"{season_start}-{str(season_end)[-2:]}"
    current_season_str = get_current_season()


    # Career stats from playercareerstats
    try:
        career_df = playercareerstats.PlayerCareerStats(player_id=nba_player_id).get_data_frames()[0]
    except Exception:
        career_df = None

    # Current season stats
    try:
        season_log = playergamelog.PlayerGameLog(player_id=nba_player_id, season=current_season_str).get_data_frames()[0]
    except Exception:
        season_log = pd.DataFrame()
    if not season_log.empty:
        season_avg_points = float(season_log['PTS'].mean())
    else:
        season_avg_points = None

    # Stats vs opponent
    opponent_abbr = opponent_team.get("abbreviation") if opponent_team else None
    if opponent_abbr is None:
        career_avg_points_vs_opponent = None
        season_avg_points_vs_opponent = None
    else:
        if not season_log.empty:
            season_games_vs_opponent = season_log[season_log["MATCHUP"].str.contains(opponent_abbr)]
            if not season_games_vs_opponent.empty:
                season_avg_points_vs_opponent = float(season_games_vs_opponent["PTS"].mean())
            else:
                season_avg_points_vs_opponent = None
        else:
            season_avg_points_vs_opponent = None
        career_points_list = []
        career_games_list = []
        if career_df is not None and not career_df.empty:
            seasons = career_df["SEASON_ID"].unique()
            for season in seasons:
                try:
                    season_game_log = playergamelog.PlayerGameLog(player_id=nba_player_id, season=season).get_data_frames()[0]
                except Exception:
                    continue
                if season_game_log.empty:
                    continue
                games_vs_opponent = season_game_log[season_game_log["MATCHUP"].str.contains(opponent_abbr)]
                if not games_vs_opponent.empty:
                    total_points = games_vs_opponent["PTS"].sum()
                    games_played = games_vs_opponent.shape[0]
                    career_points_list.append(total_points)
                    career_games_list.append(games_played)
                time.sleep(0.5)
            if career_games_list:
                career_avg_points_vs_opponent = float(sum(career_points_list) / sum(career_games_list))
            else:
                career_avg_points_vs_opponent = None
        else:
            career_avg_points_vs_opponent = None

    # Last 5 games
    last_5_games = []
    num_playoff_games = 0
    last_5_games_avg = 0
    playoff_data = []
    playoff_games = []
    num_playoff_games = len(games_df)
    playoff_avg = 0

    # Check if Playoff Game First
    if next_game_type == "Playoffs":
        pgl = PlayerGameLog(
            player_id=nba_player_id,                 
            season=get_current_season(),
            season_type_all_star='Playoffs'
        )
        games_df = pgl.get_data_frames()[0]  # most recent game is first row

        # Get all playoff games data
        for game in games_df:
            curr = games_df.iloc[i]

            matchup = curr['MATCHUP']            
            if ' vs. ' in matchup:
                location = 'Home'
                opp_abbr = matchup.split(' vs. ')[1]
            elif ' @ ' in matchup:
                location = 'Away'
                opp_abbr = matchup.split(' @ ')[1]
            else:
                location = 'Unknown'
                opp_abbr = None

            # lookup full name & logo
            opp_full = get_team_full_name_from_abbr(opp_abbr) if opp_abbr else None
            opp_id   = get_team_id_from_abbr(opp_abbr)        if opp_abbr else None
            opp_logo = get_team_logo_url(opp_id)              if opp_id   else None

            # minutes (takes only the minute portion if it's "MM:SS")
            raw_min = curr.get('MIN', '')
            if isinstance(raw_min, str) and ':' in raw_min:
                minutes = int(raw_min.split(':')[0])
            else:
                minutes = int(raw_min) if raw_min else None
            
            playoff_avg += int(curr['PTS'])
            
            playoff_games.append({
                "date":             curr['GAME_DATE'],
                "points":           int(curr['PTS']),
                "opponent":         opp_abbr,
                "opponentFullName": opp_full,
                "opponentLogo":     opp_logo,
                "location":         location,
                "minutes":          minutes,
                "gameType":         "Playoffs"
            })
        
        
        playoff_avg /= num_playoff_games
        playoff_data["playoffAvg"] = playoff_avg
        playoff_data["playoffGames"] = playoff_data
        playoff_data["playoffGamesCount"] = num_playoff_games
        playoff_data["games"] = playoff_games

        # Get the last 5 games
        if num_playoff_games > 5:
            for i in range(5):
                curr = games_df.iloc[i]

                matchup = curr['MATCHUP']            
                if ' vs. ' in matchup:
                    location = 'Home'
                    opp_abbr = matchup.split(' vs. ')[1]
                elif ' @ ' in matchup:
                    location = 'Away'
                    opp_abbr = matchup.split(' @ ')[1]
                else:
                    location = 'Unknown'
                    opp_abbr = None

                # lookup full name & logo
                opp_full = get_team_full_name_from_abbr(opp_abbr) if opp_abbr else None
                opp_id   = get_team_id_from_abbr(opp_abbr)        if opp_abbr else None
                opp_logo = get_team_logo_url(opp_id)              if opp_id   else None

                # minutes (takes only the minute portion if it's "MM:SS")
                raw_min = curr.get('MIN', '')
                if isinstance(raw_min, str) and ':' in raw_min:
                    minutes = int(raw_min.split(':')[0])
                else:
                    minutes = int(raw_min) if raw_min else None
                
                last_5_games_avg += int(curr['PTS'])
                
                last_5_games.append({
                    "date":             curr['GAME_DATE'],
                    "points":           int(curr['PTS']),
                    "opponent":         opp_abbr,
                    "opponentFullName": opp_full,
                    "opponentLogo":     opp_logo,
                    "location":         location,
                    "minutes":          minutes,
                    "gameType":         "Playoffs"
                })
        
        else:
            for i in range(num_playoff_games):
                curr = games_df.iloc[i]

                matchup = curr['MATCHUP']            
                if ' vs. ' in matchup:
                    location = 'Home'
                    opp_abbr = matchup.split(' vs. ')[1]
                elif ' @ ' in matchup:
                    location = 'Away'
                    opp_abbr = matchup.split(' @ ')[1]
                else:
                    location = 'Unknown'
                    opp_abbr = None

                # lookup full name & logo
                opp_full = get_team_full_name_from_abbr(opp_abbr) if opp_abbr else None
                opp_id   = get_team_id_from_abbr(opp_abbr)        if opp_abbr else None
                opp_logo = get_team_logo_url(opp_id)              if opp_id   else None

                # minutes (takes only the minute portion if it's "MM:SS")
                raw_min = curr.get('MIN', '')
                if isinstance(raw_min, str) and ':' in raw_min:
                    minutes = int(raw_min.split(':')[0])
                else:
                    minutes = int(raw_min) if raw_min else None

                last_5_games_avg += int(curr['PTS'])
                
                last_5_games.append({
                    "date":             curr['GAME_DATE'],
                    "points":           int(curr['PTS']),
                    "opponent":         opp_abbr,
                    "opponentFullName": opp_full,
                    "opponentLogo":     opp_logo,
                    "location":         location,
                    "minutes":          minutes,
                    "gameType":         "Playoffs"
                })

    # Check for (if remaining) Regular Season Game
    if num_playoff_games == 0:
        pgl = PlayerGameLog(
                player_id=201939,                  # Stephen Curry NBA API player ID
                season='2024-25',
                season_type_all_star='Regular Season'
            )
        games_df = pgl.get_data_frames()[0]
        for i in range(5 - num_playoff_games):
            curr = games_df.iloc[i]

            matchup = curr['MATCHUP']            
            if ' vs. ' in matchup:
                location = 'Home'
                opp_abbr = matchup.split(' vs. ')[1]
            elif ' @ ' in matchup:
                location = 'Away'
                opp_abbr = matchup.split(' @ ')[1]
            else:
                location = 'Unknown'
                opp_abbr = None
            # lookup full name & logo
            opp_full = get_team_full_name_from_abbr(opp_abbr) if opp_abbr else None
            opp_id   = get_team_id_from_abbr(opp_abbr)        if opp_abbr else None
            opp_logo = get_team_logo_url(opp_id)              if opp_id   else None
            # minutes (takes only the minute portion if it's "MM:SS")
            raw_min = curr.get('MIN', '')
            if isinstance(raw_min, str) and ':' in raw_min:
                minutes = int(raw_min.split(':')[0])
            else:
                minutes = int(raw_min) if raw_min else None

            last_5_games_avg += int(curr['PTS'])
            
            last_5_games.append({
                "date":             curr['GAME_DATE'],
                "points":           int(curr['PTS']),
                "opponent":         opp_abbr,
                "opponentFullName": opp_full,
                "opponentLogo":     opp_logo,
                "location":         location,
                "minutes":          minutes,
                "gameType":         "Regular Season"
            })
    
    last_5_games_avg /= 5

    for game in last_5_games:
        print(game)

    # Build the original player data object with preserved keys
    player_data = {
        "name": player_name,
        "position": player_position,
        "team": player_team,
        "teamConference": player_team_conference,
        "teamPlayoffRank": player_team_playoffRank,
        "teamLogo": player_team_logo,
        "photoUrl": player_image_url,
        "gameDate": game_date_str,
        "gameTime": game_date_est,
        "matchup": matchup,
        "opponent": opponent_team_name,
        "opponentConference": opponent_team_conference,
        "opponentPlayoffRank": opponent_team_playoffRank,
        "opponentLogo": opponent_team_logo,
        "seasonAvgPoints": season_avg_points,
        "careerAvgVsOpponent": career_avg_points_vs_opponent,
        "seasonAvgVsOpponent": season_avg_points_vs_opponent,
        "last5Games": last_5_games,
        "last5GamesAvg": last_5_games_avg,
        "homeAwgAvg": season_avg_points * 1.05 if home else season_avg_points * 0.95 if season_avg_points else None,
        "gameId": next_game_id,
        "gameType": next_game_type,
        "gameStatus" : "Scheduled",
        "playoff_data":     playoff_data
    }

    
    performance_metrics = analyze_player_performance(nba_player_id, current_season_str)
    player_data["advancedPerformance"] = performance_metrics
    
    career_summaries = fetch_career_summaries(nba_player_id, last_n=3)
    player_data["careerSeasonStats"] = career_summaries
    

    return player_data

############################################################################
### ADDED: Minimal fetch_player_game_logs fallback (if needed)
############################################################################
def fetch_player_game_logs_fallback(player_id, season_str="2024-25"):
    try:
        gamelog_df = playergamelog.PlayerGameLog(player_id=player_id, season=season_str).get_data_frames()[0]
    except Exception as e:
        print(f"[fetch_player_game_logs] Error fetching logs for player {player_id}: {e}")
        return []
    logs = []
    for _, row in gamelog_df.iterrows():
        pts = row.get("PTS", 0)
        logs.append({"points": pts})
    return logs

############################################################################
### ADDED: Helper function to get current season string
############################################################################
def get_current_season():
    now = datetime.datetime.now()
    if now.month >= 10:
        season_start = now.year
        season_end = now.year + 1
    else:
        season_start = now.year - 1
        season_end = now.year
    return f"{season_start}-{str(season_end)[-2:]}"
