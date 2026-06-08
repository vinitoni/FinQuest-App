const SOURCES = [
  { name: "InfoMoney", url: "https://www.infomoney.com.br/feed/" },
  { name: "Exame Invest", url: "https://exame.com/invest/feed/" },
];

const BULLISH = [
  "alta","sobe","cresce","crescimento","lucro","recorde","supera","valoriza",
  "valorização","ganho","ganhos","dispara","avança","expansão","aprova",
  "eleva","aumenta","positivo","superávit","recupera","resultado positivo",
  "bate recorde","máxima","aceleração","contrata","lança",
];
const BEARISH = [
  "queda","cai","recua","baixa","perde","perda","prejuízo","risco",
  "crise","colapso","derrete","desaba","tomba","piora","contrai",
  "demite","cancela","reduz","corta","negativo","déficit","fraco",
  "desaceleração","recessão","inflação","mínima","pressão","alerta",
];

function sentimentOf(text) {
  const t = text.toLowerCase();
  const b = BULLISH.filter(w => t.includes(w)).length;
  const r = BEARISH.filter(w => t.includes(w)).length;
  if (b > r) return "bullish";
  if (r > b) return "bearish";
  return "neutral";
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/<[^>]+>/g, "")
    .trim();
}

function extractField(xml, tag) {
  const re = new RegExp(
    `<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`,
    "i"
  );
  const m = re.exec(xml);
  return m ? decodeEntities(m[1]) : "";
}

function extractLink(item) {
  // <link>url</link>
  let m = /<link>([^<]+)<\/link>/i.exec(item);
  if (m) return m[1].trim();

  // <guid isPermaLink="true">url</guid>
  m = /<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/i.exec(item);
  if (m) return m[1].trim();

  // <link /> … url (some feeds)
  m = /<link\s*\/>\s*(https?:\/\/\S+)/i.exec(item);
  if (m) return m[1].trim();

  return "#";
}

function parseRSS(xml, source) {
  const articles = [];
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];

  for (const m of items.slice(0, 10)) {
    const item = m[1];
    const title = extractField(item, "title");
    if (!title || title.length < 8) continue;

    const description = extractField(item, "description").slice(0, 280);
    const link = extractLink(item);
    const pubDateRaw =
      extractField(item, "pubDate") || extractField(item, "dc:date");

    let pubDate;
    try {
      pubDate = pubDateRaw ? new Date(pubDateRaw).toISOString() : new Date().toISOString();
    } catch {
      pubDate = new Date().toISOString();
    }

    articles.push({
      id: Buffer.from(source.name + title.slice(0, 30)).toString("base64").slice(0, 16),
      title,
      description,
      link,
      pubDate,
      sentiment: sentimentOf(title + " " + description),
      source: source.name,
    });
  }

  return articles;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=60");

  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const results = await Promise.allSettled(
    SOURCES.map(async (src) => {
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
    .slice(0, 20);

  const errors = results
    .filter(r => r.status === "rejected")
    .map(r => r.reason?.message || "unknown");

  return res.status(200).json({
    articles,
    fetchedAt: new Date().toISOString(),
    ...(errors.length ? { _errors: errors } : {}),
  });
}
