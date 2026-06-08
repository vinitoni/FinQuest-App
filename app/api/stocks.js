const YAHOO_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json,text/javascript,*/*;q=0.01",
  "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8",
  Referer: "https://finance.yahoo.com",
  Origin: "https://finance.yahoo.com",
};

async function fetchYahoo(yahooSymbols) {
  // Try query2/v8 first (less rate-limited), then query1/v7 as fallback
  const endpoints = [
    `https://query2.finance.yahoo.com/v8/finance/quote?symbols=${yahooSymbols}&fields=regularMarketPrice,regularMarketChangePercent,regularMarketDayHigh,regularMarketDayLow,regularMarketVolume&region=BR&lang=pt-BR`,
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yahooSymbols}&fields=regularMarketPrice,regularMarketChangePercent,regularMarketDayHigh,regularMarketDayLow,regularMarketVolume&region=BR&lang=pt-BR`,
  ];

  for (const url of endpoints) {
    try {
      const r = await fetch(url, {
        headers: YAHOO_HEADERS,
        signal: AbortSignal.timeout(9000),
      });
      if (!r.ok) continue;
      const data = await r.json();
      const results = data?.quoteResponse?.result || [];
      if (results.length > 0) return results;
    } catch {
      // try next endpoint
    }
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const symbols = req.query.symbols || "PETR4,VALE3,ITUB4,MGLU3";
  const yahooSymbols = symbols.split(",").map(s => `${s.trim()}.SA`).join(",");

  const results = await fetchYahoo(yahooSymbols);

  if (!results) {
    return res.status(503).json({ error: "Yahoo Finance indisponível — tente novamente em instantes" });
  }

  const normalized = results.map(r => ({
    symbol: r.symbol.replace(".SA", ""),
    regularMarketPrice: r.regularMarketPrice ?? null,
    regularMarketChangePercent: r.regularMarketChangePercent ?? null,
    regularMarketDayHigh: r.regularMarketDayHigh ?? null,
    regularMarketDayLow: r.regularMarketDayLow ?? null,
    regularMarketVolume: r.regularMarketVolume ?? null,
  }));

  return res.status(200).json({ results: normalized });
}
