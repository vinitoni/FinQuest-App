// Carregamento e cache local dos dados do usuário (perfil, carteira, trades, progresso).
import { supabase } from "../supabase";

export const LS_PORT = id => "fq_port_" + id;

export async function loadUserData(authUser) {
  const [profileRes, portfolioRes, tradesRes, progressRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", authUser.id).single(),
    supabase.from("portfolio").select("*").eq("user_id", authUser.id),
    supabase.from("trades").select("*").eq("user_id", authUser.id).order("created_at", { ascending: false }),
    supabase.from("progress").select("*").eq("user_id", authUser.id),
  ]);
  const profile = profileRes.data || { id: authUser.id, name: "Investidor", xp: 0, cash: 100000 };

  const portfolioObj = {};
  const portRows = portfolioRes.data || [];
  if (portRows.length > 0) {
    portRows.forEach(r => { portfolioObj[r.ticker] = { qty: r.qty, avgPrice: r.avg_price }; });
    // Sync cloud data into localStorage so we have a local backup
    try { localStorage.setItem(LS_PORT(authUser.id), JSON.stringify(portfolioObj)); } catch {}
  } else {
    // Supabase retornou vazio, usa o cache do localStorage
    try {
      const local = JSON.parse(localStorage.getItem(LS_PORT(authUser.id)) || "{}");
      Object.assign(portfolioObj, local);
    } catch {}
  }

  const tradesArr = (tradesRes.data || []).map(r => ({
    type: r.type, ticker: r.ticker, qty: r.qty, price: r.price,
    profit: r.profit, date: new Date(r.created_at).toLocaleString("pt-BR"),
  }));
  const progressObj = {};
  (progressRes.data || []).forEach(r => {
    if (!progressObj[r.course_id]) progressObj[r.course_id] = new Set();
    progressObj[r.course_id].add(r.module_id);
  });
  return { profile, portfolio: portfolioObj, trades: tradesArr, progress: progressObj };
}
