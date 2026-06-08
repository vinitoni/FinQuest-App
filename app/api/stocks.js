export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const symbols = req.query.symbols || "PETR4,VALE3,ITUB4,MGLU3";
  // Yahoo Finance requer sufixo .SA para ativos da B3
  const yahooSymbols = symbols.split(",").map((s) => `${s.trim()}.SA`).join(",");

  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yahooSymbols}&fields=regularMarketPrice,regularMarketChangePercent,regularMarketDayHigh,regularMarketDayLow,regularMarketVolume&lang=pt-BR&region=BR`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FinQuest/1.0)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`Yahoo Finance HTTP ${response.status}`);
    const data = await response.json();

    const results = data?.quoteResponse?.result || [];
    if (!results.length) throw new Error("Nenhum resultado retornado");

    // Remove sufixo .SA para manter compatibilidade com o App.jsx
    const normalized = results.map((r) => ({
      symbol: r.symbol.replace(".SA", ""),
      regularMarketPrice: r.regularMarketPrice ?? null,
      regularMarketChangePercent: r.regularMarketChangePercent ?? null,
      regularMarketDayHigh: r.regularMarketDayHigh ?? null,
      regularMarketDayLow: r.regularMarketDayLow ?? null,
      regularMarketVolume: r.regularMarketVolume ?? null,
    }));

    return res.status(200).json({ results: normalized });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
