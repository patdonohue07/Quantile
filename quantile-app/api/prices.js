/**
 * Quantile — /api/prices.js
 * Vercel serverless function
 *
 * Fetches prev close + today's open for all 10 tickers from Alpaca.
 * Both values are locked to market open — prev_close is yesterday's close,
 * open is the 9:30 AM opening price. Neither changes throughout the day.
 */

const TICKERS = ["V", "MA", "LOW", "HD", "PG", "CL", "MS", "GS", "BAC", "JPM"];
const BASE_URL = "https://data.alpaca.markets/v2";

async function getDailyBars(ticker, apiKey, secretKey) {
  const url = `${BASE_URL}/stocks/${ticker}/bars?timeframe=1Day&limit=3&adjustment=raw&feed=iex`;
  const res = await fetch(url, {
    headers: {
      "APCA-API-KEY-ID": apiKey,
      "APCA-API-SECRET-KEY": secretKey,
    },
  });
  if (!res.ok) throw new Error(`Alpaca bars error for ${ticker}: ${res.status}`);
  const data = await res.json();
  const bars = data.bars;
  if (!bars || bars.length < 2) throw new Error(`Not enough bars for ${ticker}`);
  return bars;
}

function isMarketOpen() {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = et.getDay();
  const mins = et.getHours() * 60 + et.getMinutes();
  return day >= 1 && day <= 5 && mins >= 570 && mins < 960;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const apiKey = process.env.ALPACA_API_KEY;
  const secretKey = process.env.ALPACA_SECRET_KEY;

  if (!apiKey || !secretKey) {
    return res.status(500).json({ error: "Alpaca API keys not configured" });
  }

  const now = new Date();
  const etNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));

  try {
    const results = await Promise.all(
      TICKERS.map(async (ticker) => {
        const bars = await getDailyBars(ticker, apiKey, secretKey);
        // bars[bars.length - 1] = today's bar (open = 9:30 AM open, locked)
        // bars[bars.length - 2] = yesterday's bar (c = yesterday's close, locked)
        const todayBar = bars[bars.length - 1];
        const yesterdayBar = bars[bars.length - 2];
        return {
          ticker,
          prevClose: yesterdayBar.c,
          open: todayBar.o,
        };
      })
    );

    const tickers = {};
    for (const { ticker, prevClose, open } of results) {
      tickers[ticker] = { prev_close: prevClose, open };
    }

    return res.status(200).json({
      date: etNow.toISOString().slice(0, 10),
      time: `${String(etNow.getHours()).padStart(2, "0")}:${String(etNow.getMinutes()).padStart(2, "0")}`,
      market: isMarketOpen() ? "open" : "closed",
      tickers,
    });
  } catch (err) {
    console.error("Price fetch error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
