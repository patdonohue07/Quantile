module.exports = async function handler(req, res) {
  const key = process.env.ALPACA_API_KEY;
  const secret = process.env.ALPACA_SECRET_KEY;
  if (!key || !secret) return res.status(500).json({ error: "Missing Alpaca credentials" });

  const headers = {
    "APCA-API-KEY-ID": key,
    "APCA-API-SECRET-KEY": secret,
  };

  try {
    const result = await fetch("https://paper-api.alpaca.markets/v2/positions?cancel_orders=true", {
      method: "DELETE",
      headers,
    });
    const data = await result.json();
    return res.status(200).json({ closed: true, timestamp: new Date().toISOString(), data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
