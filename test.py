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
        for i in range(5):
            curr = game_df.iloc[i]
            points = curr['PTS']
            game_date = curr['GAME_DATE']
    
    else:
        for i in range(num_playoff_games):
            curr = game_df.iloc[i]
            points = curr['PTS']
            game_date = curr['GAME_DATE']

# Check for (if remaining) Regular Season Game
if num_playoff_games = 0:
    pgl = PlayerGameLog(
            player_id=201939,                  # Stephen Curry NBA API player ID
            season='2024-25',
            season_type_all_star='Regular Season'
        )
    games_df = pgl.get_data_frames()[0]
    for i in range(5 - num_playoff_games):
        curr = game_df.iloc[i]
        points = curr['PTS']
        game_date = curr['GAME_DATE']



last_game = games_df.iloc[0]
print(f"Stephen CUrry has played {num_playoff_games} playoff games in the 2024-25 season.")
print(f"On {last_game['GAME_DATE']}, he scored {last_game['PTS']} points.")
