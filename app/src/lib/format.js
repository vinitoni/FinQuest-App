// Helpers de formatação compartilhados em toda a aplicação.

export const fmt = v =>
  v == null
    ? "R$0,00"
    : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

export const fmtP = v => `${v >= 0 ? "+" : ""}${Number(v).toFixed(2)}%`;

export const uid = () => Math.random().toString(36).slice(2, 8);

export const toEmbed = url => {
  if (!url) return "";
  if (url.includes("/embed/")) return url;
  const m = url.match(/(?:v=|youtu\.be\/)([^&\s?]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url;
};
