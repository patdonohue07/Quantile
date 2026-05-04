/**
 * Quantile — /api/trade.js
 * Vercel serverless handler invoked by cron.
 *
 * Fixes 7 things vs previously deployed version:
 *   1. POSITION_SIZE = 10000 canonical
 *   2. ET time-of-day guard (DST-safe, cron fires twice per action)
 *   3. Rolling 3-year sk from Alpaca bars at runtime (no lookahead)
 *   4. feed=iex (was iex)
 *   5. Poll today's open bar with fallback
 *   6. Idempotency guard (skip if positions already open)
 *   7. action=reset endpoint for manual flattening
 */

const PAIRS = [
  { lead: "V",   target: "MA",  beta: 0.647983, th: 75, lo: 25 },
  { lead: "LOW", target: "HD",  beta: 0.9648,   th: 70, lo: 30 },
  { lead: "PG",  target: "CL",  beta: 0.7145,   th: 90, lo: 10 },
  { lead: "MS",  target: "GS",  beta: 0.9726,   th: 80, lo: 20 },
  { lead: "BAC", target: "JPM", beta: 0.79948,  th: 85, lo: 15 },
];

const POSITION_SIZE = 10000;
const SK_LOOKBACK_DAYS = 365 * 3;
const SK_MIN_SAMPLES = 250;

const ALPACA_DATA = "https://data.alpaca.markets/v2";
const ALPACA_PAPER = "https://paper-api.alpaca.markets/v2";

function etNow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const obj = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return new Date(
    `${obj.year}-${obj.month}-${obj.day}T${obj.hour}:${obj.minute}:${obj.second}`
  );
}

function etDateStr(d) {
  d = d || etNow();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function etMinutesSinceMidnight(d) {
  d = d || etNow();
  return d.getHours() * 60 + d.getMinutes();
}

function isTradingDay(d) {
  d = d || etNow();
  const day = d.getDay();
  return day >= 1 && day <= 5;
}

async function alpacaGet(url, headers) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Alpaca ${res.status}: ${txt.slice(0, 200)}`);
  }
  return res.json();
}

async function getDailyBars(ticker, days, headers) {
  const now = etNow();
  const end = new Date(now);
  end.setDate(end.getDate() + 1);
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  const s = etDateStr(start), e = etDateStr(end);
  const url = `${ALPACA_DATA}/stocks/${ticker}/bars?timeframe=1Day&start=${s}&end=${e}&adjustment=raw&feed=iex&limit=10000`;
  const data = await alpacaGet(url, headers);
  return data.bars || [];
}

async function pollTodaysOpen(ticker, todayET, headers, maxAttempts) {
  maxAttempts = maxAttempts || 6;
  for (let i = 0; i < maxAttempts; i++) {
    const bars = await getDailyBars(ticker, 3, headers);
    const today = bars.find(b => b.t.slice(0, 10) === todayET);
    if (today && today.o) return { open: today.o, source: "daily-bar" };
    if (i < maxAttempts - 1) await new Promise(r => setTimeout(r, 10000));
  }
  const url = `${ALPACA_DATA}/stocks/${ticker}/trades/latest?feed=iex`;
  const data = await alpacaGet(url, headers);
  if (data.trade && data.trade.p) {
    return { open: data.trade.p, source: "latest-trade" };
  }
  throw new Error(`Could not obtain today's open for ${ticker}`);
}

function buildShockSeries(leadBars, targetBars, beta) {
  const leadByDate   = new Map(leadBars.map(b => [b.t.slice(0, 10), b]));
  const targetByDate = new Map(targetBars.map(b => [b.t.slice(0, 10), b]));
  const commonDates = [...leadByDate.keys()]
    .filter(d => targetByDate.has(d))
    .sort();
  const shocks = [];
  for (let i = 1; i < commonDates.length; i++) {
    const prev = commonDates[i - 1];
    const today = commonDates[i];
    const lp = leadByDate.get(prev).c;
    const lo = leadByDate.get(today).o;
    const tp = targetByDate.get(prev).c;
    const to = targetByDate.get(today).o;
    if (!lp || !lo || !tp || !to) continue;
    const ol = lo / lp - 1;
    const ot = to / tp - 1;
    shocks.push({ date: today, shock: ol - beta * ot });
  }
  return shocks;
}

function percentileRank(distribution, value) {
  let c = 0;
  for (const x of distribution) if (x <= value) c++;
  return (c / distribution.length) * 100;
}

function calcSignal(pair, lpc, lo, tpc, to, skDistribution) {
  const ol = lo / lpc - 1;
  const ot = to / tpc - 1;
  const shock = ol - pair.beta * ot;
  const p = percentileRank(skDistribution, shock);
  let dir = null;
  if (p >= pair.th) dir = "UP";
  else if (p <= pair.lo) dir = "DN";
  return { p, dir, ol, ot, shock };
}

async function placeOrder(symbol, qty, side, headers) {
  const res = await fetch(`${ALPACA_PAPER}/orders`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      symbol, qty: String(qty), side,
      type: "market", time_in_force: "day",
    }),
  });
  return res.json();
}

async function closeAllPositions(headers) {
  const res = await fetch(`${ALPACA_PAPER}/positions?cancel_orders=true`, {
    method: "DELETE", headers,
  });
  return res.json();
}

async function listOpenPositions(headers) {
  const res = await fetch(`${ALPACA_PAPER}/positions`, { headers });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

module.exports = async function handler(req, res) {
  const key = process.env.ALPACA_API_KEY;
  const secret = process.env.ALPACA_SECRET_KEY;
  if (!key || !secret) {
    return res.status(500).json({ error: "Missing Alpaca credentials" });
  }
  const headers = {
    "APCA-API-KEY-ID": key,
    "APCA-API-SECRET-KEY": secret,
  };

  const now = etNow();
  const todayET = etDateStr(now);
  const etMins = etMinutesSinceMidnight(now);
  const action = req.query && req.query.action;

  if (action === "reset") {
    const before = await listOpenPositions(headers);
    const result = await closeAllPositions(headers);
    return res.status(200).json({
      reset: true,
      positions_before: before.map(p => ({ symbol: p.symbol, qty: p.qty, side: p.side })),
      close_result: result,
      et_time: now.toISOString(),
    });
  }

  if (action === "close") {
    if (!isTradingDay(now)) {
      return res.status(200).json({ skipped: "not a trading day", et_time: now.toISOString() });
    }
    if (etMins < 15 * 60 + 55 || etMins > 16 * 60 + 10) {
      return res.status(200).json({ skipped: "outside close window", et_time: now.toISOString() });
    }
    const result = await closeAllPositions(headers);
    return res.status(200).json({ closed: result, et_time: now.toISOString() });
  }

  if (!isTradingDay(now)) {
    return res.status(200).json({ skipped: "not a trading day", et_time: now.toISOString() });
  }
  if (etMins < 9 * 60 + 30 || etMins > 9 * 60 + 40) {
    return res.status(200).json({
      skipped: "outside open window (9:30-9:40 ET)",
      et_time: now.toISOString(),
      et_minutes: etMins,
    });
  }

  const existing = await listOpenPositions(headers);
  if (existing.length > 0) {
    return res.status(200).json({
      skipped: "positions already open (today's open has already run)",
      existing_positions: existing.map(p => ({ symbol: p.symbol, qty: p.qty, side: p.side })),
      et_time: now.toISOString(),
    });
  }

  const results = [];
  for (const pair of PAIRS) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const [leadBars, targetBars] = await Promise.all([
        getDailyBars(pair.lead,   SK_LOOKBACK_DAYS + 10, headers),
        getDailyBars(pair.target, SK_LOOKBACK_DAYS + 10, headers),
      ]);
      if (leadBars.length < 2 || targetBars.length < 2) {
        results.push({ pair: `${pair.lead}/${pair.target}`, error: "insufficient bars" });
        continue;
      }
      const leadPrev   = [...leadBars  ].reverse().find(b => b.t.slice(0,10) < todayET);
      const targetPrev = [...targetBars].reverse().find(b => b.t.slice(0,10) < todayET);
      if (!leadPrev || !targetPrev) {
        results.push({ pair: `${pair.lead}/${pair.target}`, error: "no prev close" });
        continue;
      }
      const lpc = leadPrev.c;
      const tpc = targetPrev.c;
      const [leadOpenResult, targetOpenResult] = await Promise.all([
        pollTodaysOpen(pair.lead,   todayET, headers),
        pollTodaysOpen(pair.target, todayET, headers),
      ]);
      const lo = leadOpenResult.open;
      const to = targetOpenResult.open;
      if (!lo || !to) {
        results.push({ pair: `${pair.lead}/${pair.target}`, error: "no today open" });
        continue;
      }
      const windowStart = (() => {
        const d = new Date(todayET);
        d.setFullYear(d.getFullYear() - 3);
        return d.toISOString().slice(0, 10);
      })();
      const allShocks = buildShockSeries(leadBars, targetBars, pair.beta);
      const sk = allShocks
        .filter(s => s.date >= windowStart && s.date < todayET)
        .map(s => s.shock);
      if (sk.length < SK_MIN_SAMPLES) {
        results.push({ pair: `${pair.lead}/${pair.target}`, error: `sk has only ${sk.length} samples (need ${SK_MIN_SAMPLES})` });
        continue;
      }
      const sig = calcSignal(pair, lpc, lo, tpc, to, sk);
      const base = {
        pair: `${pair.lead}/${pair.target}`,
        lpc, lo, tpc, to,
        sk_samples: sk.length,
        percentile: Number(sig.p.toFixed(2)),
        shock: Number(sig.shock.toFixed(6)),
      };
      if (!sig.dir) {
        results.push({ ...base, signal: "none" });
        continue;
      }
      const leadQty   = Math.floor(POSITION_SIZE / lo);
      const targetQty = Math.floor(POSITION_SIZE / to);
      if (leadQty === 0 || targetQty === 0) {
        results.push({ ...base, signal: "none", error: "qty computed as 0 (price too high)" });
        continue;
      }
      const leadSide   = sig.dir === "UP" ? "sell" : "buy";
      const targetSide = sig.dir === "UP" ? "buy"  : "sell";
      const [leadOrder, targetOrder] = await Promise.all([
        placeOrder(pair.lead,   leadQty,   leadSide,   headers),
        placeOrder(pair.target, targetQty, targetSide, headers),
      ]);
      results.push({
        ...base,
        signal: sig.dir,
        leadQty, targetQty,
        leadOrderId:   (leadOrder && leadOrder.id)   || (leadOrder && leadOrder.message)   || "unknown",
        targetOrderId: (targetOrder && targetOrder.id) || (targetOrder && targetOrder.message) || "unknown",
      });
    } catch (err) {
      results.push({ pair: `${pair.lead}/${pair.target}`, error: err.message });
    }
  }

  return res.status(200).json({
    et_time: now.toISOString(),
    today_et: todayET,
    trades: results,
  });
};
