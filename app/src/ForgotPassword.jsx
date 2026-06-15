import { useState } from "react";
import { supabase } from "./supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  async function sendLink() {
    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo:
            "https://finquest-app-omega.vercel.app/reset-password"
        }
      );

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Link enviado para seu e-mail.");
  }

  return (
    <div>
      <h2>Recuperar senha</h2>

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Seu e-mail"
      />

      <button onClick={sendLink}>
        Enviar link
      </button>

      {msg && <p>{msg}</p>}
    </div>
  );
}