import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] =
    useState("");

  const [confirm, setConfirm] =
    useState("");

  const [msg, setMsg] = useState("");

  async function savePassword() {
    if (password !== confirm) {
      setMsg("As senhas não coincidem.");
      return;
    }

    const { error } =
      await supabase.auth.updateUser({
        password
      });

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Senha alterada!");

    setTimeout(() => {
      navigate("/login");
    }, 1500);
  }

  return (
    <div>
      <h2>Nova senha</h2>

      <input
        type="password"
        placeholder="Nova senha"
        value={password}
        onChange={(e) =>
          setPassword(e.target.value)
        }
      />

      <input
        type="password"
        placeholder="Confirmar senha"
        value={confirm}
        onChange={(e) =>
          setConfirm(e.target.value)
        }
      />

      <button onClick={savePassword}>
        Alterar senha
      </button>

      {msg && <p>{msg}</p>}
    </div>
  );
}