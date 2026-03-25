[README_quantile.md](https://github.com/user-attachments/files/26171757/README_quantile.md)
# Quantile

**Pairs trading signal dashboard for equity markets.**

Built by a high school senior with two years of trading experience. Quantile generates intraday long/short signals using beta-adjusted overnight gap shocks, ranked against a historical distribution of 3 years of market data.

Live paper trading on Alpaca. Three pairs, dollar neutral, open-to-close.

---

## How It Works

At market open (9:30 AM ET), each stock in a pair has gapped up or down from the previous close. Quantile computes a *shock* — the lead stock's gap adjusted for how much the target stock moved, weighted by their beta relationship.

```
shock = lead_gap − β × target_gap
```

That shock is ranked against every opening shock over the past 3 years. If it hits the 75th percentile or above, the lead stock has opened unusually high relative to its pair — signal is to short the lead and long the target, betting on mean reversion by close.

---

## Pairs

| Pair | Beta | Threshold |
|------|------|-----------|
| BAC / JPM | 0.799 | ≥75th / ≤25th |
| V / MA | 0.648 | ≥75th / ≤25th |
| PEP / KO | 0.536 | ≥85th / ≤15th |

---

## Backtest Results

**Jan 2023 – Mar 2026 · $1,000/leg · open-to-close · dollar neutral**

| Pair | Trades | Win Rate | Sharpe | Sortino | Max DD |
|------|--------|----------|--------|---------|--------|
| BAC/JPM | 479 | 55.3% | 1.37 | 1.63 | $153 |
| V/MA | 418 | 63.4% | 4.08 | 5.85 | $35 |
| PEP/KO | 214 | 59.3% | 1.04 | 0.77 | $64 |
| **Combined** | **1,111** | **59.3%** | **3.28** | **4.76** | **$108** |

Backtest logic verified against HTML scorecard dashboard. Results do not include transaction costs or slippage.

---

## App — Quantile UI

React dashboard with three tabs:

- **Signals** — enter opening prices, get a real-time signal with live percentile bar
- **Log** — persistent trade log with outcome tracking, P&L, and notes
- **Research** — full backtest stats and methodology

**Files:**
- `app/Quantile V1` — first React build
- `app/Quantile V2` — current version (v7): pure black, electric blue, signal mark logo, trade log

---

## Backend

**Files:**
- `backend/Scorecard Deploy Code` — Alpaca paper trading deployment script. Run at 9:30 AM ET daily. Fetches prices, computes signals, places paper trades, writes `signals.json` for the frontend
- `backend/Backtest Code` — full backtesting engine using Yahoo Finance OHLCV data

**Setup:**

```bash
pip install alpaca-py yfinance pandas numpy
```

```bash
export ALPACA_API_KEY="your_key"
export ALPACA_SECRET_KEY="your_secret"
export SIGNALS_OUTPUT_PATH="/path/to/quantile/public/signals.json"
```

```bash
python "Scorecard Deploy Code"
```

Automate with a cron job at 9:30 AM ET on weekdays:

```
30 9 * * 1-5 python /path/to/scorecard_deploy.py
```

---

## Dashboard

`dashboard/Scorecard V6` — original HTML scorecard. Open in any browser, no dependencies. Enter prices manually and get signals with percentile rankings. The logic in this file is the source of truth that the Python backtest and React app were both verified against.

---

## Repo Structure

```
app/
  Quantile V1          ← initial React build
  Quantile V2          ← current build (v7)
backend/
  Scorecard Deploy Code   ← Alpaca deployment script
  Backtest Code           ← backtesting engine
dashboard/
  Scorecard V6       ← original HTML dashboard
README.md
```

---

## Status

- [x] Strategy research and pair selection
- [x] 3-year backtest with Sharpe/Sortino/max drawdown
- [x] HTML scorecard dashboard
- [x] React app with signal generation
- [x] Alpaca paper trading deployment script
- [x] Persistent trade log with P&L tracking
- [x] Vercel serverless API layer (api/prices.js)
- [x] One-command setup script (setup.sh)
- [x] Gumroad automation script listing — $99
- [x] Gumroad links added to landing page and app
- [ ] Vercel deployment
- [ ] Cron job automation
- [ ] Real-time P&L from paper account
- [ ] Live price auto-population via Alpaca API

---

*For research and educational purposes only. Not financial advice.*
