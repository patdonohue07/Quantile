# Scorecard

Pairs trading signal dashboard tracking three equity pairs — BAC/JPM, V/MA, and PEP/KO.

Each morning, the script calculates the beta-adjusted overnight gap shock for each pair, ranks it against a historical distribution, and fires a trade signal when the percentile hits the threshold. Entry at open, exit at close, dollar neutral.

> ⚠️ This project is for research and educational purposes only. It is not financial advice and should not be used to make real trading decisions.

## Strategy

For each pair, the shock is calculated as:

shock = lead_gap - beta × target_gap

where gap = (open / prev_close) - 1

The shock is ranked against a pre-built historical distribution. A signal fires when the percentile exceeds the upper threshold (short lead, long target) or falls below the lower threshold (long lead, short target).

## Pairs

| Pair | Beta | Threshold |
|------|------|-----------|
| BAC / JPM | 0.799 | 75 / 25 |
| V / MA | 0.648 | 75 / 25 |
| PEP / KO | 0.536 | 85 / 15 |

## Backtest Results

3-year window: Jan 2023 – Mar 2026 | $1,000 per leg | Open-to-close | Dollar neutral

| Pair | Trades | Win% | Sharpe | Sortino | Max DD |
|------|--------|------|--------|---------|--------|
| BAC / JPM | 479 | 55.3% | 1.37 | 1.63 | $153 |
| V / MA | 418 | 63.4% | 4.08 | 5.85 | $35 |
| PEP / KO | 214 | 59.3% | 1.04 | 0.77 | $64 |
| **Combined** | **1,111** | **59.3%** | **3.28** | **4.76** | **$108** |

Beta-adjusted shock percentile ranking. Logic verified against HTML dashboard using Yahoo Finance OHLCV data.

## How to Run

**Signal Dashboard (manual)**
Open `Scorecard V6` in any browser. Enter prev close and today's open for each pair at market open to generate signals.

**Automated Deployment (paper trading)**

Install dependencies:
pip install alpaca-py

Set your Alpaca paper trading keys:
export ALPACA_API_KEY="your_key"
export ALPACA_SECRET_KEY="your_secret"

Run at 9:30 AM ET each trading day:
python Scorecard Deploy Code

Positions close automatically at the end of the day.

## Files

- `Scorecard V6` — signal dashboard, run in browser each morning
- `Scorecard Deploy Code` — automated deployment via Alpaca paper trading
- `Backtest Code` — full backtesting engine with threshold optimization and Sharpe/Sortino calculations

## Stack

- Python / alpaca-py
- Yahoo Finance for backtesting
- Alpaca for paper trade execution
- Signal logic verified against HTML dashboard

## Status

Paper trading — live deployment pending.
