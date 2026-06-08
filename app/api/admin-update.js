import { createClient } from "@supabase/supabase-js";

const ADMIN_TOKEN = process.env.ADMIN_SECRET || "fq-admin-secret-2025";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Verifica token de admin passado no header
  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  const { userId, updates } = req.body || {};
  if (!userId || !updates || typeof updates !== "object") {
    return res.status(400).json({ error: "userId e updates são obrigatórios" });
  }

  // Campos permitidos para atualização via admin
  const allowed = ["name", "xp", "cash"];
  const safe = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k))
  );
  if (!Object.keys(safe).length) {
    return res.status(400).json({ error: "Nenhum campo válido para atualizar" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(503).json({ error: "Variáveis SUPABASE_URL e SUPABASE_SERVICE_KEY não configuradas" });
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Atualiza tabela profiles
  const { error } = await adminClient.from("profiles").update(safe).eq("id", userId);
  if (error) return res.status(500).json({ error: error.message });

  // Se o nome foi alterado, sincroniza também em auth.users (raw_user_meta_data)
  // É o que aparece como "Display name" no painel do Supabase Auth
  if (safe.name) {
    await adminClient.auth.admin.updateUserById(userId, {
      user_metadata: { name: safe.name },
    });
  }

  return res.status(200).json({ ok: true });
}
