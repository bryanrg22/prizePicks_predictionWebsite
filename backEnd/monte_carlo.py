import numpy as np
from nba_api.stats.static import players
# Import helper functions from player_analyzer
from player_analyzer import fetch_player_game_logs, get_current_season

def get_player_game_data(player_name, max_games=60):
    """
    Retrieves up to `max_games` most recent points for the given player
    by calling your real 'fetch_player_game_logs' function.
    Returns a list of points or None if no data is found.
    """
    player_list = players.find_players_by_full_name(player_name)
    if not player_list:
        return None
    player_id = player_list[0]["id"]

    season_str = get_current_season()  # dynamic season like "2024-25"
    logs = fetch_player_game_logs(player_id, season_str=season_str)
    if not logs:
        return None

    points_only = [g["points"] for g in logs if "points" in g]
    if not points_only:
        return None

    if len(points_only) > max_games:
        points_only = points_only[-max_games:]

    print(f"[monte_carlo] Found {len(points_only)} games for {player_name}")
    return points_only

def run_monte_carlo_simulation(mu, sigma,
                               point_threshold,
                               num_simulations=100_000,
                               distribution="normal"):
    """
    Runs a Monte Carlo simulation to estimate the probability
    that scoring exceeds `point_threshold`, using either
    a normal or a Poisson model.
    """
    if distribution.lower() == "poisson":
        lam = max(mu, 0.5)
        simulated = np.random.poisson(lam=lam, size=num_simulations)
    else:
        simulated = np.random.normal(loc=mu, scale=sigma, size=num_simulations)

    count_over = np.sum(simulated > point_threshold)
    return count_over / num_simulations

def monte_carlo_for_player(player_name,
                           point_threshold,
                           distribution="normal",
                           num_simulations=100_000):
    """
    Orchestrates fetching data and running the simulation.

    Parameters:
      - player_name (str)
      - point_threshold (float): **required**; no more default of 25
      - distribution (str): "normal" or "poisson"
      - num_simulations (int): how many samples to draw

    Returns:
      - probability (float) or None if no data
    """
    # Ensure threshold is numeric
    try:
        point_threshold = float(point_threshold)
    except Exception:
        print(f"[monte_carlo] ERROR: invalid threshold {point_threshold}")
        return None

    player_points = get_player_game_data(player_name)
    if not player_points:
        print(f"[monte_carlo] No data for player: {player_name}.")
        return None

    mu    = float(np.mean(player_points))
    sigma = float(np.std(player_points, ddof=1))
    if sigma < 0.0001:
        sigma = 0.5

    print(f"[monte_carlo] Running MC: μ={mu:.2f}, σ={sigma:.2f}, threshold={point_threshold}, dist={distribution}")
    prob = run_monte_carlo_simulation(
        mu, sigma,
        point_threshold=point_threshold,
        num_simulations=num_simulations,
        distribution=distribution
    )
    return prob

if __name__ == "__main__":
    name      = input("Player name: ")
    threshold = input("Point threshold: ")
    dist      = input("Distribution [normal/poisson]: ") or "normal"
    prob = monte_carlo_for_player(name, threshold, distribution=dist)
    if prob is None:
        print("Failed to compute probability.")
    else:
        print(f"P({name} > {threshold} pts) = {prob:.2%}")
