// Tela de login e cadastro com validação de formulário.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export function AuthScreen({mode,onSuccess,onSwitch,onBack}){
  const[form,setForm]=useState({name:"",email:"",password:""});
  const[errors,setErrors]=useState({});
  const[loading,setLoading]=useState(false);
  const[serverErr,setServerErr]=useState("");
  const isSignup=mode==="signup";
  const navigate = useNavigate();

  function validate(){
    const e={};
    if(isSignup&&!form.name.trim()) e.name="Nome obrigatório";
    if(!form.email.trim()||!form.email.includes("@")) e.email="E-mail inválido";
    if(form.password.length<6) e.password="Senha mínima 6 caracteres";
    setErrors(e);
    return Object.keys(e).length===0;
  }

  async function submit(){
    if(!validate()) return;
    setLoading(true);setServerErr("");
    if(isSignup){
      const{data,error}=await supabase.auth.signUp({
        email:form.email.trim(),password:form.password,
        options:{data:{name:form.name.trim()}}
      });
      if(error){setServerErr(error.message);setLoading(false);return;}
      await new Promise(r=>setTimeout(r,800)); // aguarda trigger criar o perfil
      await onSuccess(data.user);
    } else {
      const{data,error}=await supabase.auth.signInWithPassword({email:form.email.trim(),password:form.password});
      if(error){setServerErr("E-mail ou senha inválidos.");setLoading(false);return;}
      await onSuccess(data.user);
    }
    setLoading(false);
  }

  return(
    <><div className="mesh"/>
    <div className="auth-wrap" style={{position:"relative",zIndex:1}}>
      <div className="auth-card">
        <button onClick={onBack} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:13,marginBottom:20}}>← Voltar</button>
        <div className="syne" style={{fontSize:20,fontWeight:800,color:"var(--g)",display:"flex",alignItems:"center",gap:9,marginBottom:20}}>
          <div className="logomark">FQ</div>FinQuest
        </div>
        <div className="syne" style={{fontSize:22,fontWeight:800,marginBottom:4}}>{isSignup?"Criar conta grátis":"Entrar"}</div>
        <div style={{fontSize:13,color:"var(--muted)",marginBottom:24}}>{isSignup?"Comece sua jornada financeira.":"Bem-vindo de volta!"}</div>
        {isSignup&&(
          <div className="fg">
            <label className="ilabel">Nome completo</label>
            <input className="inp" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Seu nome" style={{borderColor:errors.name?"var(--red)":""}}/>
            {errors.name&&<div style={{color:"var(--red)",fontSize:12,marginTop:4}}>{errors.name}</div>}
          </div>
        )}
        <div className="fg">
          <label className="ilabel">E-mail</label>
          <input className="inp" type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="seu@email.com" style={{borderColor:errors.email?"var(--red)":""}}/>
          {errors.email&&<div style={{color:"var(--red)",fontSize:12,marginTop:4}}>{errors.email}</div>}
        </div>
        <div className="fg">
          <label className="ilabel">Senha</label>
          <input className="inp" type="password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} placeholder="Mín. 6 caracteres" onKeyDown={e=>e.key==="Enter"&&submit()} style={{borderColor:errors.password?"var(--red)":""}}/>
          {errors.password&&<div style={{color:"var(--red)",fontSize:12,marginTop:4}}>{errors.password}</div>}
          {!isSignup && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: -2,
                marginBottom: 16
              }}
            >
              <span
                onClick={() => navigate("/forgot-password")}
                style={{
                  color: "var(--g)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                Esqueceu sua senha?
              </span>
            </div>
          )}
        </div>
        {serverErr&&<div style={{color:"var(--red)",fontSize:12,marginBottom:8,padding:"8px 12px",background:"rgba(255,82,82,.1)",borderRadius:7}}>{serverErr}</div>}
        <button className="btn bprimary" style={{width:"100%",marginTop:6,opacity:loading?0.7:1}} onClick={submit} disabled={loading}>{loading?"Aguarde...":(isSignup?"Criar conta":"Entrar")}</button>
        <div style={{textAlign:"center",marginTop:16,fontSize:13,color:"var(--muted)"}}>
          {isSignup?"Já tem conta? ":"Não tem conta? "}
          <span style={{color:"var(--g)",cursor:"pointer",fontWeight:600}} onClick={onSwitch}>{isSignup?"Fazer login":"Criar conta"}</span>
        </div>
      </div>
    </div></>
  );
}
