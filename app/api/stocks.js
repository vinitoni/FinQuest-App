const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Hosts do Yahoo: tenta query1 e, se falhar, query2
const HOSTS = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"];

// Busca a cotação de UM ativo via endpoint /chart, que não exige crumb nem cookie,
// ao contrário do antigo /quote (que passou a retornar "Invalid Cookie" / HTTP 500).
// Fora do horário de pregão (10h-17h) a Yahoo zera high/low/volume do dia corrente em
// "meta" (candle ainda não formado). Por isso pedimos 5 dias e pegamos o último candle
// diário com dado válido — que é o último pregão real fechado, não um zero de fachada.
function lastValidCandle(result) {
  const q = result?.indicators?.quote?.[0];
  const ts = result?.timestamp;
  if (!q || !ts) return null;
  for (let i = ts.length - 1; i >= 0; i--) {
    if (q.high?.[i] > 0 && q.low?.[i] > 0) {
      return { high: q.high[i], low: q.low[i], volume: q.volume?.[i] ?? null };
    }
  }
  return null;
}

async function fetchOne(symbol) {
  const path = `/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
  let lastErr;
  for (const host of HOSTS) {
    try {
      const r = await fetch(host + path, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      const result = data?.chart?.result?.[0];
      const meta = result?.meta;
      if (!meta || meta.regularMarketPrice == null) throw new Error("sem preço");

      const price = meta.regularMarketPrice;
      const prev = meta.chartPreviousClose ?? meta.previousClose ?? null;
      const changePct = prev ? ((price - prev) / prev) * 100 : null;
      const candle = lastValidCandle(result);

      return {
        symbol: symbol.replace(".SA", ""),
        regularMarketPrice: price,
        regularMarketChangePercent: changePct,
        regularMarketDayHigh: candle?.high ?? meta.regularMarketDayHigh ?? null,
        regularMarketDayLow: candle?.low ?? meta.regularMarketDayLow ?? null,
        regularMarketVolume: candle?.volume ?? meta.regularMarketVolume ?? null,
      };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("falha");
}

// Segunda camada de fallback: brapi.dev. Sem token só libera as 4 ações de teste
// (PETR4, VALE3, ITUB4, MGLU3); com BRAPI_TOKEN configurado na Vercel, libera qualquer
// ativo. Só é chamada para os tickers que a Yahoo não conseguiu responder.
const BRAPI_FREE = new Set(["PETR4", "VALE3", "ITUB4", "MGLU3"]);

async function fetchFromBrapi(symbols) {
  const token = process.env.BRAPI_TOKEN;
  const usable = token ? symbols : symbols.filter(s => BRAPI_FREE.has(s));
  if (!usable.length) return {};
  try {
    const url = `https://brapi.dev/api/quote/${usable.join(",")}${token ? `?token=${token}` : ""}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return {};
    const data = await r.json();
    const map = {};
    (data.results || []).forEach(q => {
      if (q.regularMarketPrice != null) {
        map[q.symbol] = {
          symbol: q.symbol,
          regularMarketPrice: q.regularMarketPrice,
          regularMarketChangePercent: q.regularMarketChangePercent ?? null,
          regularMarketDayHigh: q.regularMarketDayHigh ?? null,
          regularMarketDayLow: q.regularMarketDayLow ?? null,
          regularMarketVolume: q.regularMarketVolume ?? null,
        };
      }
    });
    return map;
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  // cache de borda: 1 min fresco + serve stale por 2 min enquanto revalida
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const symbols = req.query.symbols || "PETR4,VALE3,ITUB4,MGLU3";
  const list = symbols.split(",").map(s => `${s.trim()}.SA`);

  const settled = await Promise.allSettled(list.map(fetchOne));
  let results = settled.map(s => (s.status === "fulfilled" ? s.value : null));

  // camada 2: o que a Yahoo não trouxe, tenta na brapi.dev
  const missing = list.filter((_, i) => !results[i]).map(s => s.replace(".SA", ""));
  if (missing.length) {
    const brapiMap = await fetchFromBrapi(missing);
    results = results.map((r, i) => {
      if (r) return r;
      const sym = list[i].replace(".SA", "");
      return brapiMap[sym] || null;
    });
  }

  const finalResults = results.filter(Boolean);
  if (!finalResults.length) {
    const firstErr = settled.find(s => s.status === "rejected");
    return res.status(503).json({ error: firstErr?.reason?.message || "todas as cotações falharam" });
  }

  // Retorna o que conseguiu (parcial é melhor que nada, o front mantém fallback estático nos faltantes)
  return res.status(200).json({ results: finalResults });
}
