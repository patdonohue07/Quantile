/**
 * Quantile — /api/prices.js
 * Vercel serverless function
 *
 * Fetches prev close + today's open for all 6 tickers from Alpaca.
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
 *     BAC: { prev_close: 46.92, open: 47.06 },
 *     JPM: { prev_close: 287.99, open: 287.89 },
 *     ...
 *   }
 * }
 */

const TICKERS = ["BAC", "JPM", "V", "MA", "PEP", "KO"];

const BASE_URL = "https://data.alpaca.markets/v2";

async function getPrevClose(ticker, apiKey, secretKey) {
  // Get the most recent completed trading day's close
  const url = `${BASE_URL}/stocks/${ticker}/bars?timeframe=1Day&limit=2&adjustment=raw&feed=iex`;

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

  // Most recent completed bar's close
  return bars[bars.length - 1].c;
}

async function getTodayOpen(ticker, apiKey, secretKey) {
  // Get today's latest bar (which will have today's open)
  const url = `${BASE_URL}/stocks/${ticker}/bars/latest?feed=iex`;

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
  return data.bar?.o ?? null;
}

function isMarketOpen() {
  const now = new Date();
  const et = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const day = et.getDay(); // 0=Sun, 6=Sat
  const mins = et.getHours() * 60 + et.getMinutes();
  return day >= 1 && day <= 5 && mins >= 570 && mins < 960;
}

export default async function handler(req, res) {
  // CORS headers so the React app can call this
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
    // Fetch prev close and today's open for all tickers in parallel
    const results = await Promise.all(
      TICKERS.map(async (ticker) => {
        const [prevClose, open] = await Promise.all([
          getPrevClose(ticker, apiKey, secretKey),
          getTodayOpen(ticker, apiKey, secretKey),
        ]);
        return { ticker, prevClose, open };
      })
    );

    // Build response object
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
