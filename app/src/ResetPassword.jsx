// Definição de nova senha após clicar no link de recuperação.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function savePassword() {
    if (password.length < 6) { setErr("A senha deve ter no mínimo 6 caracteres."); return; }
    if (password !== confirm) { setErr("As senhas não coincidem."); return; }
    setLoading(true); setErr("");
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setDone(true);
    setTimeout(() => navigate("/login"), 1800);
  }

  return (
    <><div className="mesh" />
    <div className="auth-wrap" style={{ position: "relative", zIndex: 1 }}>
      <div className="auth-card">
        <div className="syne" style={{ fontSize: 20, fontWeight: 800, color: "var(--g)", display: "flex", alignItems: "center", gap: 9, marginBottom: 20 }}>
          <div className="logomark">FQ</div>FinQuest
        </div>

        {done ? (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div className="syne" style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Senha alterada!</div>
            <div style={{ fontSize: 13.5, color: "var(--muted)" }}>Redirecionando para o login...</div>
          </div>
        ) : (
          <>
            <div className="syne" style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Criar nova senha</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>Escolha uma nova senha para sua conta.</div>

            <div className="fg">
              <label className="ilabel">Nova senha</label>
              <input
                className="inp"
                type="password"
                placeholder="Mín. 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ borderColor: err ? "var(--red)" : "" }}
              />
            </div>

            <div className="fg">
              <label className="ilabel">Confirmar senha</label>
              <input
                className="inp"
                type="password"
                placeholder="Repita a senha"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && savePassword()}
                style={{ borderColor: err ? "var(--red)" : "" }}
              />
            </div>

            {err && <div style={{ color: "var(--red)", fontSize: 12, marginBottom: 8, padding: "8px 12px", background: "rgba(255,82,82,.1)", borderRadius: 7 }}>{err}</div>}

            <button className="btn bprimary" style={{ width: "100%", marginTop: 6, opacity: loading ? 0.7 : 1 }} onClick={savePassword} disabled={loading}>
              {loading ? "Salvando..." : "Alterar senha"}
            </button>
          </>
        )}
      </div>
    </div></>
  );
}
