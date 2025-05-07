import pandas as pd

class Backtester:
    def __init__(self, firestore_client, threshold_field="threshold"):
        self.db = firestore_client
        self.th = threshold_field

    def run(self, start_date, end_date):
        """
        Pull every player-threshold doc between start_date and end_date,
        compute a simple +1/−1 P&L for over-hits, and return a pandas Series.
        """
        docs = (
            self.db
            .collection_group("active")
            .where("gameDate", ">=", start_date)
            .where("gameDate", "<=", end_date)
            .stream()
        )

        pnl = []
        for doc in docs:
            d = doc.to_dict()
            actual_pts = None
            # assume you’ve fetched final boxscore elsewhere &
            # stored in d["actualPoints"]
            if "actualPoints" in d:
                actual_pts = d["actualPoints"]
            else:
                continue

            hit = actual_pts > d[self.th]
            # simple: +1 for hit, −1 for miss
            pnl.append(1 if hit else -1)

        return pd.Series(pnl)

    def metrics(self, pnl_series):
        """
        Compute cumulative P&L, Sharpe, max drawdown
        """
        cum = pnl_series.cumsum()
        mean = cum.diff().mean()
        std  = cum.diff().std()
        sharpe = (mean / std) * (252 ** 0.5) if std else 0.0

        drawdown = (cum - cum.cummax()).min()
        return {
            "sharpe": float(sharpe),
            "max_drawdown": float(drawdown),
            "total_picks": int(len(pnl_series))
        }
