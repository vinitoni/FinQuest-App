// Defaults baseados nos valores atuais (Jun/2026), usados quando HG_BRASIL_KEY não está configurada
const DEFAULTS = { cdi: 13.75, selic: 13.75, ipca: 5.0, ibov: null, ibovChange: null, usd: null, eur: null };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.HG_BRASIL_KEY;
  if (!key) return res.status(200).json(DEFAULTS);

  try {
    const response = await fetch(`https://api.hgbrasil.com/finance?key=${key}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`HG Brasil HTTP ${response.status}`);
    const data = await response.json();

    const r = data.results || {};
    const taxes = r.taxes?.[0] || {};
    const ibov = r.stocks?.IBOVESPA || {};
    const usd = r.currencies?.USD || {};
    const eur = r.currencies?.EUR || {};

    return res.status(200).json({
      cdi: taxes.cdi ?? DEFAULTS.cdi,
      selic: taxes.selic ?? DEFAULTS.selic,
      ipca: taxes.ipca ?? DEFAULTS.ipca,
      ibov: ibov.points ?? null,
      ibovChange: ibov.variation ?? null,
      usd: usd.buy ?? null,
      eur: eur.buy ?? null,
    });
  } catch (err) {
    // Em caso de erro, retorna defaults ao invés de falhar
    return res.status(200).json({ ...DEFAULTS, _error: err.message });
  }
}
