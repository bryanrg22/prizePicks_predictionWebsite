from nba_api.stats.endpoints import PlayerGameLog

pgl = PlayerGameLog(
    player_id=201939,                  # Stephen Curry NBA API player ID
    season='2024-25',
    season_type_all_star='Playoffs'
)
games_df = pgl.get_data_frames()[0]  # most recent game is first row
num_playoff_games = len(games_df)

last_game = games_df.iloc[0]
print(f"Stephen CUrry has played {num_playoff_games} playoff games in the 2024-25 season.")
print(f"On {last_game['GAME_DATE']}, he scored {last_game['PTS']} points.")
