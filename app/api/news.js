const SOURCES = [
  { name: "InfoMoney", url: "https://www.infomoney.com.br/mercados/feed/", abbr: "IM" },
  { name: "Exame Invest", url: "https://exame.com/invest/feed/", abbr: "EX" },
  { name: "G1 Economia", url: "https://g1.globo.com/rss/g1/economia/", abbr: "G1" },
];

const BULLISH = [
  "alta","sobe","cresce","crescimento","lucro","recorde","supera","valoriza",
  "valorização","ganho","ganhos","dispara","avança","expansão","aprova",
  "eleva","aumenta","superávit","recupera","máxima","aceleração",
];
const BEARISH = [
  "queda","cai","recua","baixa","perde","perda","prejuízo","risco",
  "crise","colapso","derrete","desaba","tomba","piora","contrai",
  "demite","cancela","reduz","corta","déficit","desaceleração",
  "recessão","inflação","mínima","pressão",
];

// Notícias que impactam economia/investidores mesmo não sendo 100% financeiras
const RELEVANT_KW = [
  "econom","empresa","mercado","bolsa","ação","ações","invest","banco","financ",
  "capital","lucro","resultado","receita","balanço","pib","inflação","selic","juros",
  "petróleo","commodity","câmbio","dólar","euro","exporta","importa","comércio",
  "industria","varejo","setor","startup","ipo","fii","etf","bdr","dividendo",
  "tarifa","sanção","regulação","imposto","fiscal","orçamento","reforma",
  "apple","google","amazon","microsoft","tesla","meta","nvidia","openai","ia ",
  "inteligência artificial","chip","semicondutor","tecnologia","iphone","android",
  "petrobras","vale","itaú","bradesco","ambev","weg","magalu","b3 ",
  "trump","china","fed","copom","banco central","ue ","europa","g7","g20",
  "crise","recessão","crescimento","empreg","desempreg",
];

function isRelevant(text) {
  const t = text.toLowerCase();
  return RELEVANT_KW.some(kw => t.includes(kw));
}

function sentimentOf(text) {
  const t = text.toLowerCase();
  const b = BULLISH.filter(w => t.includes(w)).length;
  const r = BEARISH.filter(w => t.includes(w)).length;
  if (b > r) return "bullish";
  if (r > b) return "bearish";
  return "neutral";
}

function categorize(text) {
  const t = text.toLowerCase();
  if (/dividendo|provento|jcp|rendimento/.test(t)) return "Dividendos";
  if (/selic|ipca|inflação|juros|banco central|copom|pib|fiscal|câmbio/.test(t)) return "Macro";
  if (/dólar|euro|libra|iene|real desvaloriza/.test(t)) return "Câmbio";
  if (/\bfii\b|fundo imobiliário|aluguel|tijolo|shopping/.test(t)) return "FIIs";
  if (/etf|bdr|exterior|nasdaq|s&p|dow jones/.test(t)) return "Global";
  if (/resultado|lucro|balanço|receita|ebitda|prejuízo/.test(t)) return "Resultados";
  if (/ação|ações|bolsa|ibovespa|b3|mercado|ativo/.test(t)) return "Bolsa";
  return "Mercados";
}

// Strip HTML tags properly — handles > inside quoted attribute values
function stripHtml(s) {
  return s
    .replace(/<(?:[^>'"]|'[^']*'|"[^"]*")*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function extractRaw(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = re.exec(xml);
  if (!m) return "";
  return m[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}

function cleanField(xml, tag) {
  return decodeEntities(stripHtml(extractRaw(xml, tag)));
}

function extractLink(item) {
  let m = /<link>([^<]+)<\/link>/i.exec(item);
  if (m) return m[1].trim();
  m = /<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/i.exec(item);
  if (m) return m[1].trim();
  m = /<link\s*\/>\s*(https?:\/\/\S+)/i.exec(item);
  if (m) return m[1].trim();
  return "#";
}

function extractThumbnail(item) {
  // media:content with url (G1, common in many feeds)
  let m = /<media:content[^>]+url="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i.exec(item);
  if (m) return m[1];

  // media:thumbnail
  m = /<media:thumbnail[^>]+url="(https?:\/\/[^"]+)"/i.exec(item);
  if (m) return m[1];

  // enclosure image
  m = /<enclosure[^>]+url="(https?:\/\/[^"]+)"[^>]+type="image/i.exec(item);
  if (m) return m[1];

  // first img src in description
  const rawDesc = extractRaw(item, "description");
  m = /src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i.exec(rawDesc);
  if (m) return m[1];

  return null;
}

function parseRSS(xml, source) {
  const articles = [];
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];

  for (const m of items.slice(0, 10)) {
    const item = m[1];
    const title = cleanField(item, "title");
    if (!title || title.length < 8) continue;

    const rawDesc = extractRaw(item, "description");
    const description = decodeEntities(stripHtml(rawDesc)).slice(0, 220);
    const link = extractLink(item);
    const thumbnail = extractThumbnail(item);

    const pubDateRaw = cleanField(item, "pubDate") || cleanField(item, "dc:date");
    let pubDate;
    try {
      pubDate = pubDateRaw ? new Date(pubDateRaw).toISOString() : new Date().toISOString();
    } catch {
      pubDate = new Date().toISOString();
    }

    const text = title + " " + description;
    if (!isRelevant(text)) continue; // descarta notícias sem impacto econômico

    articles.push({
      id: Buffer.from(source.abbr + title.slice(0, 28)).toString("base64").slice(0, 16),
      title,
      description,
      link,
      thumbnail,
      pubDate,
      sentiment: sentimentOf(text),
      category: categorize(text),
      source: source.name,
      abbr: source.abbr,
    });
  }

  return articles;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=60");

  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const results = await Promise.allSettled(
    SOURCES.map(async src => {
      const r = await fetch(src.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; FinQuest/1.0)",
          Accept: "application/rss+xml, application/xml, text/xml, */*",
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status} from ${src.name}`);
      const xml = await r.text();
      return parseRSS(xml, src);
    })
  );

  const articles = results
    .filter(r => r.status === "fulfilled")
    .flatMap(r => r.value)
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .slice(0, 24);

  const errors = results
    .filter(r => r.status === "rejected")
    .map(r => r.reason?.message || "unknown");

  return res.status(200).json({
    articles,
    fetchedAt: new Date().toISOString(),
    ...(errors.length ? { _errors: errors } : {}),
  });
}
