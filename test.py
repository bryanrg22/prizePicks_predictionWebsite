from nba_api.stats.endpoints import PlayerGameLog

# Last 5 games
last_5_games = []
num_playoff_games = 0

# Check if Playoff Game First
if gameType = "Playoff":
    pgl = PlayerGameLog(
        player_id=201939,                  # Stephen Curry NBA API player ID
        season='2024-25',
        season_type_all_star='Playoffs'
    )
    games_df = pgl.get_data_frames()[0]  # most recent game is first row
    num_playoff_games = len(games_df)
    
    if num_playoff_games > 5:
    for game in range(num_playoff_games):
        curr = game_df.iloc[i]
        # matchup = g["MATCHUP"]
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

            last_5_games.append({
                "date": g["GAME_DATE"],
                "points": int(g["PTS"]),
                "opponent": opp_full,
                "opponentFullName": opp_full,
                "opponentLogo": opp_logo,
                "location": home_away,
                "minutes": int(g["MIN"]) if "MIN" in g else None
                #"gameType": next_game_type
            })
        last_5_games_avg = float(recent_games["PTS"].mean())
    else:
        last_5_games_avg = None
    

# Check for (if remaining) Regular Season Game
pgl = PlayerGameLog(
        player_id=201939,                  # Stephen Curry NBA API player ID
        season='2024-25',
        season_type_all_star='Regular Season'
    )





last_game = games_df.iloc[0]
print(f"Stephen CUrry has played {num_playoff_games} playoff games in the 2024-25 season.")
print(f"On {last_game['GAME_DATE']}, he scored {last_game['PTS']} points.")
