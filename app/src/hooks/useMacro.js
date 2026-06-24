// Indicadores macro (CDI, SELIC, IPCA, Ibovespa, câmbio) via HG Brasil.
import { useState, useEffect } from "react";

const MACRO_DEFAULTS={cdi:13.75,selic:13.75,ipca:5.0,ibov:null,ibovChange:null,usd:null,eur:null};

export function useMacro(){
  const[macro,setMacro]=useState(MACRO_DEFAULTS);
  useEffect(()=>{
    async function load(){
      try{
        const res=await fetch("/api/macro");
        if(!res.ok) return;
        const d=await res.json();
        if(d&&d.cdi) setMacro(d);
      }catch(e){ /* usa defaults */ }
    }
    load();
    const id=setInterval(load,30*60*1000);
    return()=>clearInterval(id);
  },[]);
  return{macro};
}
