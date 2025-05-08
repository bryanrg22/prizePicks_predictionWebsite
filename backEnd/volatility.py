from arch import arch_model
import pandas as pd
from datetime import datetime
from player_analyzer import fetch_more_games


def fetch_point_series(player_data, n_games=50):
    """
    Build a pandas Series of the last n_games points,
    combining the last5Games (already in player_data) with
    older games fetched via fetch_more_games().
    """
    last5 = player_data.get("last5RegularGames", [])[:5]
    older = fetch_more_games(player_data["playerId"])[: max(0, n_games - 5)]
    all_games = last5 + older

    # convert dates to datetime
    dates = [pd.to_datetime(g["date"]) for g in all_games]
    pts   = [g["points"] for g in all_games]
    series = pd.Series(data=pts, index=dates).sort_index()
    return series


def forecast_volatility(point_series):
    """
    Fit a GARCH(1,1) to the day-to-day returns of points
    and return the 1-step ahead forecasted σ (std. dev).
    """
    # day-to-day diff
    returns = point_series.diff().dropna()
    if len(returns) < 10:
        return 0.0

    # p=1, q=1
    model = arch_model(returns, vol="Garch", p=1, q=1)
    res   = model.fit(disp="off")
    # variance forecast horizon=1
    var_forecast = res.forecast(horizon=1).variance.iloc[-1, 0]
    return float(var_forecast ** 0.5)


def forecast_playoff_volatility(player_data):
    po = player_data.get("playoff_games", [])[:]
    dates = [pd.to_datetime(g["date"]) for g in po]
    pts   = [g["points"] for g in po]
    series = pd.Series(data=pts, index=dates).sort_index()
    return forecast_volatility(series)
