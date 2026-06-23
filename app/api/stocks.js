const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Hosts do Yahoo: tenta query1 e, se falhar, query2
const HOSTS = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"];

// Busca a cotação de UM ativo via endpoint /chart, que não exige crumb nem cookie,
// ao contrário do antigo /quote (que passou a retornar "Invalid Cookie" / HTTP 500).
async function fetchOne(symbol) {
  const path = `/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  let lastErr;
  for (const host of HOSTS) {
    try {
      const r = await fetch(host + path, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (!meta || meta.regularMarketPrice == null) throw new Error("sem preço");

      const price = meta.regularMarketPrice;
      const prev = meta.chartPreviousClose ?? meta.previousClose ?? null;
      const changePct = prev ? ((price - prev) / prev) * 100 : null;

      return {
        symbol: symbol.replace(".SA", ""),
        regularMarketPrice: price,
        regularMarketChangePercent: changePct,
        regularMarketDayHigh: meta.regularMarketDayHigh ?? null,
        regularMarketDayLow: meta.regularMarketDayLow ?? null,
        regularMarketVolume: meta.regularMarketVolume ?? null,
      };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("falha");
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  // cache de borda: 1 min fresco + serve stale por 2 min enquanto revalida
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const symbols = req.query.symbols || "PETR4,VALE3,ITUB4,MGLU3";
  const list = symbols.split(",").map(s => `${s.trim()}.SA`);

  const settled = await Promise.allSettled(list.map(fetchOne));
  const results = settled.filter(s => s.status === "fulfilled").map(s => s.value);

  if (!results.length) {
    const firstErr = settled.find(s => s.status === "rejected");
    return res.status(503).json({ error: firstErr?.reason?.message || "todas as cotações falharam" });
  }

  // Retorna o que conseguiu (parcial é melhor que nada, o front mantém fallback nos faltantes)
  return res.status(200).json({ results });
}
