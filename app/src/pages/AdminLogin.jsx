// Login da área administrativa (acessada pelo atalho secreto).
import { useState } from "react";

export function AdminLogin({onSuccess,onBack}){
  const[form,setForm]=useState({email:"",password:""});
  const[err,setErr]=useState("");
  const CREDS=[
    {email:"admin@finquest.com",   password:"admin123"},
    {email:"devock69@gmail.com",   password:"admin123#123@"},
  ];
  function attempt(){
    const ok=CREDS.some(c=>c.email===form.email&&c.password===form.password);
    if(ok) onSuccess();
    else setErr("Credenciais inválidas. Verifique e tente novamente.");
  }
  return(
    <><div className="mesh"/>
    <div className="auth-wrap" style={{position:"relative",zIndex:1}}>
      <div className="auth-card" style={{borderColor:"rgba(245,200,66,.3)"}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:13,marginBottom:20}}>← Voltar</button>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:34,marginBottom:8}}>🔐</div>
          <div className="syne" style={{fontSize:22,fontWeight:800,marginBottom:3}}>Acesso Restrito</div>
          <div style={{fontSize:13,color:"var(--muted)"}}>Área administrativa</div>
        </div>
        <div className="fg"><label className="ilabel">E-mail admin</label><input className="inp" type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&attempt()}/></div>
        <div className="fg"><label className="ilabel">Senha</label><input className="inp" type="password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&attempt()}/></div>
        {err&&<div style={{color:"var(--red)",fontSize:13,marginBottom:12,background:"rgba(255,82,82,.1)",padding:"9px 13px",borderRadius:8}}>⚠️ {err}</div>}
        <button className="btn bgold-btn" style={{width:"100%"}} onClick={attempt}>Entrar no painel</button>
      </div>
    </div></>
  );
}
