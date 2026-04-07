/**
 * Quantile — /api/prices.js
 * Vercel serverless function
 *
 * Fetches prev close + today's open for all 10 tickers from Alpaca.
 * Called by the React app at load time.
 *
 * Environment variables (set in Vercel dashboard):
 *   ALPACA_API_KEY
 *   ALPACA_SECRET_KEY
 *
 * Returns:
 * {
 *   date: "2026-03-24",
 *   time: "09:31",
 *   market: "open" | "closed",
 *   tickers: {
 *     V:   { prev_close: 340.12, open: 341.50 },
 *     MA:  { prev_close: 520.44, open: 519.80 },
 *     LOW: { prev_close: 230.11, open: 231.00 },
 *     HD:  { prev_close: 380.55, open: 379.90 },
 *     PG:  { prev_close: 163.20, open: 163.80 },
 *     CL:  { prev_close: 94.30,  open: 94.10  },
 *     MS:  { prev_close: 110.40, open: 111.00 },
 *     GS:  { prev_close: 520.10, open: 521.30 },
 *     BAC: { prev_close: 46.92,  open: 47.06  },
 *     JPM: { prev_close: 287.99, open: 287.89 },
 *   }
 * }
 */

const TICKERS = ["V", "MA", "LOW", "HD", "PG", "CL", "MS", "GS", "BAC", "JPM"];

const BASE_URL = "https://data.alpaca.markets/v2";

async function getPrevClose(ticker, apiKey, secretKey) {
  const url = `${BASE_URL}/stocks/${ticker}/bars?timeframe=1Day&limit=3&adjustment=raw&feed=iex`;

  const res = await fetch(url, {
    headers: {
      "APCA-API-KEY-ID": apiKey,
      "APCA-API-SECRET-KEY": secretKey,
    },
  });

  if (!res.ok) {
    throw new Error(`Alpaca bars error for ${ticker}: ${res.status}`);
  }

  const data = await res.json();
  const bars = data.bars;

  if (!bars || bars.length < 1) {
    throw new Error(`No bars returned for ${ticker}`);
  }

  return bars[bars.length - 2].c;
}

async function getTodayOpen(ticker, apiKey, secretKey) {
  const url = `${BASE_URL}/stocks/${ticker}/bars?timeframe=1Day&limit=1&feed=iex`;

  const res = await fetch(url, {
    headers: {
      "APCA-API-KEY-ID": apiKey,
      "APCA-API-SECRET-KEY": secretKey,
    },
  });

  if (!res.ok) {
    throw new Error(`Alpaca latest bar error for ${ticker}: ${res.status}`);
  }

  const data = await res.json();
  const bars = data.bars; return bars && bars.length > 0 ? bars[bars.length - 1].o : null;
}

function isMarketOpen() {
  const now = new Date();
  const et = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
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
  const etNow = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );

  try {
    const results = await Promise.all(
      TICKERS.map(async (ticker) => {
        const [prevClose, open] = await Promise.all([
          getPrevClose(ticker, apiKey, secretKey),
          getTodayOpen(ticker, apiKey, secretKey),
        ]);
        return { ticker, prevClose, open };
      })
    );

    const tickers = {};
    for (const { ticker, prevClose, open } of results) {
      tickers[ticker] = {
        prev_close: prevClose,
        open: open,
      };
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
