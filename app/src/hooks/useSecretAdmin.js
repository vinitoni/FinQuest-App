// Atalho secreto: digitar a sequência mágica em qualquer lugar abre o painel admin.
import { useRef, useEffect } from "react";

export function useSecretAdmin(cb){
  const buf=useRef("");
  const SECRET="finquestadmin";
  useEffect(()=>{
    const h=e=>{
      if(["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName)) return;
      buf.current=(buf.current+e.key.toLowerCase()).slice(-SECRET.length);
      if(buf.current===SECRET){buf.current="";cb();}
    };
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[cb]);
}
