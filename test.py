from nba_api.stats.endpoints import PlayerGameLog

# Last 5 games
last_5_games = []
num_playoff_games = 0

# Check if Playoff Game First
if gameType = "Playoff":
    pgl = PlayerGameLog(
        player_id=nba_player_id,                 
        season='2024-25',
        season_type_all_star='Playoffs'
    )
    games_df = pgl.get_data_frames()[0]  # most recent game is first row
    num_playoff_games = len(games_df)
    
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
            raw_min = row.get('MIN', '')
            if isinstance(raw_min, str) and ':' in raw_min:
                minutes = int(raw_min.split(':')[0])
            else:
                minutes = int(raw_min) if raw_min else None
            
            last_5_games.append({
                "date":             curr['GAME_DATE'],
                "points":           int(curr['PTS']),
                "opponent":         opp_abbr,
                "opponentFullName": opp_full,
                "opponentLogo":     opp_logo,
                "location":         location,
                "minutes":          minutes,
                "gameType":         "PlayOff"
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
            raw_min = row.get('MIN', '')
            if isinstance(raw_min, str) and ':' in raw_min:
                minutes = int(raw_min.split(':')[0])
            else:
                minutes = int(raw_min) if raw_min else None
            
            last_5_games.append({
                "date":             curr['GAME_DATE'],
                "points":           int(curr['PTS']),
                "opponent":         opp_abbr,
                "opponentFullName": opp_full,
                "opponentLogo":     opp_logo,
                "location":         location,
                "minutes":          minutes,
                "gameType":         "PlayOff"
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
        raw_min = row.get('MIN', '')
        if isinstance(raw_min, str) and ':' in raw_min:
            minutes = int(raw_min.split(':')[0])
        else:
            minutes = int(raw_min) if raw_min else None
        
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

