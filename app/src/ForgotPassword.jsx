// Recuperação de senha: envia o link de redefinição por e-mail.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  async function sendLink() {
    const e = email.trim();
    if (!e || !e.includes("@")) { setErr("Digite um e-mail válido."); return; }
    setLoading(true); setErr("");
    // redirect dinâmico: localhost no dev, domínio real em produção
    const { error } = await supabase.auth.resetPasswordForEmail(e, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setSent(true);
  }

  return (
    <><div className="mesh" />
    <div className="auth-wrap" style={{ position: "relative", zIndex: 1 }}>
      <div className="auth-card">
        <button onClick={() => navigate("/login")} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 13, marginBottom: 20 }}>← Voltar ao login</button>
        <div className="syne" style={{ fontSize: 20, fontWeight: 800, color: "var(--g)", display: "flex", alignItems: "center", gap: 9, marginBottom: 20 }}>
          <div className="logomark">FQ</div>FinQuest
        </div>

        {sent ? (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
            <div className="syne" style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Verifique seu e-mail</div>
            <div style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>
              Enviamos um link de recuperação para <strong style={{ color: "var(--text)" }}>{email.trim()}</strong>. Abra o e-mail e siga as instruções para criar uma nova senha.
            </div>
            <button className="btn boutline" style={{ width: "100%", marginTop: 22 }} onClick={() => navigate("/login")}>Voltar ao login</button>
          </div>
        ) : (
          <>
            <div className="syne" style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Recuperar senha</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>Informe seu e-mail e enviaremos um link para redefinir sua senha.</div>

            <div className="fg">
              <label className="ilabel">E-mail</label>
              <input
                className="inp"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendLink()}
                placeholder="seu@email.com"
                style={{ borderColor: err ? "var(--red)" : "" }}
              />
            </div>

            {err && <div style={{ color: "var(--red)", fontSize: 12, marginBottom: 8, padding: "8px 12px", background: "rgba(255,82,82,.1)", borderRadius: 7 }}>{err}</div>}

            <button className="btn bprimary" style={{ width: "100%", marginTop: 6, opacity: loading ? 0.7 : 1 }} onClick={sendLink} disabled={loading}>
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </button>

            <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "var(--muted)" }}>
              Lembrou a senha? <span style={{ color: "var(--g)", cursor: "pointer", fontWeight: 600 }} onClick={() => navigate("/login")}>Fazer login</span>
            </div>
          </>
        )}
      </div>
    </div></>
  );
}
