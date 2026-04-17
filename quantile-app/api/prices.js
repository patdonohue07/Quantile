const PAIRS = [
  { lead: "V",   target: "MA",  beta: 0.647983 },
  { lead: "LOW", target: "HD",  beta: 0.9648 },
  { lead: "PG",  target: "CL",  beta: 0.7145 },
  { lead: "MS",  target: "GS",  beta: 0.9726 },
  { lead: "BAC", target: "JPM", beta: 0.79948 },
];
const TICKERS = ["V","MA","LOW","HD","PG","CL","MS","GS","BAC","JPM"];
const BASE_URL = "https://data.alpaca.markets/v2";
const SK_LOOKBACK_DAYS = 365 * 3;

function etNow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const o = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return new Date(`${o.year}-${o.month}-${o.day}T${o.hour}:${o.minute}:${o.second}`);
}
function dstr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function isMarketOpen(now) {
  const day = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  return day >= 1 && day <= 5 && mins >= 570 && mins < 960;
}
async function fetchBars(ticker, startStr, endStr, headers) {
  const url = `${BASE_URL}/stocks/${ticker}/bars?timeframe=1Day&start=${startStr}&end=${endStr}&adjustment=raw&feed=iex&limit=10000`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${ticker} ${res.status}`);
  const data = await res.json();
  return data.bars || [];
}
function buildShockSeries(leadBars, tgtBars, beta) {
  const lM = new Map(leadBars.map(b => [b.t.slice(0,10), b]));
  const tM = new Map(tgtBars.map(b => [b.t.slice(0,10), b]));
  const dates = [...lM.keys()].filter(d => tM.has(d)).sort();
  const out = [];
  for (let i = 1; i < dates.length; i++) {
    const p = dates[i-1], t = dates[i];
    const lp = lM.get(p).c, lo = lM.get(t).o;
    const tp = tM.get(p).c, to = tM.get(t).o;
    if (!lp || !lo || !tp || !to) continue;
    out.push({ date: t, shock: lo/lp - 1 - beta * (to/tp - 1) });
  }
  return out;
}
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  const apiKey = process.env.ALPACA_API_KEY;
  const secretKey = process.env.ALPACA_SECRET_KEY;
  if (!apiKey || !secretKey) return res.status(500).json({ error: "Alpaca API keys not configured" });
  const headers = { "APCA-API-KEY-ID": apiKey, "APCA-API-SECRET-KEY": secretKey };
  const now = etNow();
  const todayET = dstr(now);
  try {
    const endDate = (() => { const d = new Date(now); d.setDate(d.getDate()+1); return dstr(d); })();
    const startDate = (() => { const d = new Date(now); d.setDate(d.getDate() - (SK_LOOKBACK_DAYS + 10)); return dstr(d); })();
    const barsByTicker = {};
    await Promise.all(TICKERS.map(async t => {
      barsByTicker[t] = await fetchBars(t, startDate, endDate, headers);
    }));
    const tickers = {};
    for (const t of TICKERS) {
      const bars = barsByTicker[t];
      const today = bars.find(b => b.t.slice(0,10) === todayET);
      const prev = [...bars].reverse().find(b => b.t.slice(0,10) < todayET);
      tickers[t] = { prev_close: prev ? prev.c : null, open: today ? today.o : null };
    }
    const windowStart = (() => { const d = new Date(todayET); d.setFullYear(d.getFullYear()-3); return d.toISOString().slice(0,10); })();
    const sk = {};
    for (const pair of PAIRS) {
      const lB = barsByTicker[pair.lead], tB = barsByTicker[pair.target];
      const series = buildShockSeries(lB, tB, pair.beta);
      const filtered = series.filter(s => s.date >= windowStart && s.date < todayET).map(s => s.shock);
      sk[`${pair.lead}/${pair.target}`] = filtered;
    }
    return res.status(200).json({
      date: todayET,
      time: `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`,
      market: isMarketOpen(now) ? "open" : "closed",
      tickers,
      sk,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
