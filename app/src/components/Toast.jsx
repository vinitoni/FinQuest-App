// Notificação flutuante que some sozinha após alguns segundos.
import { useEffect } from "react";

export function Toast({msg,onDone}){
  useEffect(()=>{const t=setTimeout(onDone,2800);return()=>clearTimeout(t);},[]);
  return <div className="toast">✓ {msg}</div>;
}
