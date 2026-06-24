// Perfil do usuário: dados, XP, estatísticas e edição de nome.
import { useState } from "react";
import { fmt, fmtP } from "../lib/format";

export function ProfilePage({user,xp,xpPct,level,LVL_NAMES,totalWealth,pnl,courses,progress,trades,onLogout,updateProfile}){
  const doneMod=Object.values(progress).reduce((s,set)=>s+set.size,0);
  const[editing,setEditing]=useState(false);
  const[nameVal,setNameVal]=useState(user?.name||"");

  function saveProfile(){
    const n=nameVal.trim();
    if(!n) return;
    updateProfile({name:n});
    setEditing(false);
  }

  return(
    <div className="page">
      <div className="topbar"><div className="ptitle syne">Meu Perfil</div></div>
      <div className="g2" style={{marginBottom:18}}>
        <div className="card" style={{display:"flex",gap:16,alignItems:"center"}}>
          <div className="avatar" style={{width:64,height:64,fontSize:20}}>{user?.name?.slice(0,2).toUpperCase()}</div>
          <div style={{flex:1,minWidth:0}}>
            {editing?(
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
                <input
                  className="inp"
                  value={nameVal}
                  onChange={e=>setNameVal(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter")saveProfile();if(e.key==="Escape")setEditing(false);}}
                  style={{flex:1,fontSize:16,fontWeight:700}}
                  autoFocus
                />
                <button className="btn bprimary" style={{padding:"6px 14px",fontSize:13}} onClick={saveProfile}>Salvar</button>
                <button className="btn boutline" style={{padding:"6px 10px",fontSize:13}} onClick={()=>{setEditing(false);setNameVal(user?.name||"");}}>✕</button>
              </div>
            ):(
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                <div className="syne" style={{fontSize:22,fontWeight:800}}>{user?.name}</div>
                <button className="btn boutline" style={{padding:"3px 10px",fontSize:11,opacity:0.7}} onClick={()=>{setNameVal(user?.name||"");setEditing(true);}}>Editar</button>
              </div>
            )}
            <div style={{fontSize:13,color:"var(--muted)",marginBottom:8}}>{user?.email}</div>
            <div className="lvlbadge">⭐ Nível {level}: {LVL_NAMES[level]}</div>
          </div>
        </div>
        <div className="card">
          <div className="clabel" style={{marginBottom:11}}>Experiência</div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span className="syne" style={{fontSize:24,fontWeight:800,color:"var(--gold)"}}>{xp} XP</span>
            <span style={{fontSize:12,color:"var(--muted)"}}>Nível {level}→{level+1}</span>
          </div>
          <div className="xpw" style={{height:9}}><div className="xpf" style={{width:`${xpPct}%`}}/></div>
          <div style={{fontSize:11,color:"var(--muted)",marginTop:5}}>{Math.round(xpPct)}% para o próximo nível</div>
        </div>
      </div>
      <div className="g4" style={{marginBottom:20}}>
        {[["💰",fmt(totalWealth),"Patrimônio",null],
          [pnl>=0?"📈":"📉",fmtP((pnl/100000)*100),"Resultado",pnl>=0?"var(--g)":"var(--red)"],
          ["🎓",String(doneMod),"Módulos",null],
          ["⚡",trades.length.toString(),"Operações",null],
        ].map(([icon,val,label,col])=>(
          <div key={label} className="card" style={{textAlign:"center"}}>
            <div style={{fontSize:24,marginBottom:7}}>{icon}</div>
            <div className="syne" style={{fontSize:19,fontWeight:800,color:col||"var(--text)"}}>{val}</div>
            <div style={{fontSize:11,color:"var(--muted)",marginTop:3}}>{label}</div>
          </div>
        ))}
      </div>
      <button className="btn boutline" onClick={onLogout}>← Sair da conta</button>
    </div>
  );
}
