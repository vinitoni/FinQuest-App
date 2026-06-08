const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// In-memory crumb cache — persists while the serverless instance is warm
let _cache = { crumb: null, cookie: null, exp: 0 };

async function getCrumb() {
  if (_cache.crumb && Date.now() < _cache.exp) return _cache;

  // Step 1: visit Yahoo Finance to receive session cookies
  const r1 = await fetch("https://finance.yahoo.com", {
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,*/*" },
    signal: AbortSignal.timeout(8000),
  });

  // Extract cookies — Node 18+ supports getSetCookie()
  let cookie = "";
  try {
    const cookies = r1.headers.getSetCookie();
    cookie = cookies.map(c => c.split(";")[0]).join("; ");
  } catch {
    cookie = (r1.headers.get("set-cookie") || "").split(";")[0];
  }

  // Step 2: exchange cookies for a crumb token
  const r2 = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", {
    headers: {
      "User-Agent": UA,
      Cookie: cookie,
      Referer: "https://finance.yahoo.com",
    },
    signal: AbortSignal.timeout(6000),
  });
  if (!r2.ok) throw new Error(`crumb HTTP ${r2.status}`);

  const crumb = (await r2.text()).trim();
  if (!crumb || crumb.startsWith("<")) throw new Error("crumb inválido");

  _cache = { crumb, cookie, exp: Date.now() + 20 * 60 * 1000 };
  return _cache;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const symbols = req.query.symbols || "PETR4,VALE3,ITUB4,MGLU3";
  const yahooSymbols = symbols.split(",").map(s => `${s.trim()}.SA`).join(",");

  try {
    const { crumb, cookie } = await getCrumb();

    const url =
      `https://query2.finance.yahoo.com/v8/finance/quote` +
      `?symbols=${yahooSymbols}` +
      `&crumb=${encodeURIComponent(crumb)}` +
      `&fields=regularMarketPrice,regularMarketChangePercent,regularMarketDayHigh,regularMarketDayLow,regularMarketVolume` +
      `&region=BR&lang=pt-BR`;

    const r = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Cookie: cookie,
        Referer: "https://finance.yahoo.com",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!r.ok) throw new Error(`quote HTTP ${r.status}`);
    const data = await r.json();
    const results = data?.quoteResponse?.result || [];
    if (!results.length) throw new Error("resposta vazia");

    const normalized = results.map(q => ({
      symbol: q.symbol.replace(".SA", ""),
      regularMarketPrice: q.regularMarketPrice ?? null,
      regularMarketChangePercent: q.regularMarketChangePercent ?? null,
      regularMarketDayHigh: q.regularMarketDayHigh ?? null,
      regularMarketDayLow: q.regularMarketDayLow ?? null,
      regularMarketVolume: q.regularMarketVolume ?? null,
    }));

    return res.status(200).json({ results: normalized });
  } catch (err) {
    return res.status(503).json({ error: err.message });
  }
}
