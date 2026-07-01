// Ranking global por patrimônio total (saldo + carteira), com posição ao vivo.
import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { fmt } from "../lib/format";

export function RankPage({totalWealth,user}){
  const[list,setList]=useState([]);
  const[loading,setLoading]=useState(true);
  const LVL_NAMES=["","Iniciante","Investidor","Estrategista","Trader","Mestre"];
  function lvlName(xp){return xp<500?LVL_NAMES[1]:xp<1500?LVL_NAMES[2]:xp<3000?LVL_NAMES[3]:xp<5000?LVL_NAMES[4]:LVL_NAMES[5];}

  function fetchRank(){
    setLoading(true);
    supabase.from("profiles").select("id,name,xp,cash,total_wealth").order("total_wealth",{ascending:false}).limit(50)
      .then(({data})=>{ if(data) setList(data); setLoading(false); });
  }
  useEffect(()=>{fetchRank();},[]);

  // reordena no frontend usando o valor em tempo real do usuário logado
  const sortedList=list.map(r=>({
    ...r,
    _wealth: r.id===user?.id ? totalWealth : (r.total_wealth??r.cash??100000)
  })).sort((a,b)=>b._wealth-a._wealth);

  const myRankIdx=sortedList.findIndex(r=>r.id===user?.id);
  const myPos=myRankIdx===-1?null:myRankIdx+1;

  return(
    <div className="page">
      <div className="topbar">
        <div><div className="ptitle syne">Ranking Global</div><div className="psub">Patrimônio total (saldo + carteira)</div></div>
        <button className="btn bghost bsm" onClick={fetchRank}>↻</button>
      </div>

      {/* Card do usuário logado */}
      <div className="card" style={{marginBottom:18,borderColor:"rgba(0,214,143,.2)",background:"rgba(0,214,143,.04)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap",padding:"16px 20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:11,minWidth:0}}>
          <div className="syne" style={{fontSize:24,fontWeight:800,color:"var(--g)",width:40,flexShrink:0,textAlign:"center"}}>{myPos?`#${myPos}`:"-"}</div>
          <div className="avatar" style={{width:36,height:36,fontSize:12,flexShrink:0}}>{user?.name?.slice(0,2).toUpperCase()}</div>
          <div style={{minWidth:0}}>
            <div style={{fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>Você: {user?.name}</div>
            <div style={{fontSize:11,color:"var(--muted)"}}>Patrimônio total</div>
          </div>
        </div>
        <div className="syne" style={{fontSize:20,fontWeight:800,color:"var(--g)",flexShrink:0}}>{fmt(totalWealth)}</div>
      </div>

      <div className="card" style={{padding:0,overflow:"hidden"}}>
        {loading&&<div style={{padding:24,textAlign:"center",color:"var(--muted)",fontSize:13}}>Carregando ranking...</div>}
        {!loading&&list.length===0&&<div style={{padding:24,textAlign:"center",color:"var(--muted)",fontSize:13}}>Nenhum usuário no ranking ainda.</div>}
        {sortedList.map((r,i)=>{
          const isMe=r.id===user?.id;
          const wealth=isMe?totalWealth:(r.total_wealth??r.cash??100000);
          const pnl=wealth-100000;
          const notInvested=!isMe&&wealth===100000&&r.cash===100000;
          return(
            <div key={r.id} style={{padding:"13px 18px",borderBottom:i<list.length-1?"1px solid var(--b)":"none",background:isMe?"rgba(0,214,143,.05)":""}}>
              <div style={{display:"flex",alignItems:"center",gap:11}}>
                <div className="syne" style={{width:30,flexShrink:0,fontSize:16,fontWeight:800,color:i===0?"var(--gold)":i===1?"#C0C0C0":i===2?"#CD7F32":"var(--muted)",textAlign:"center"}}>
                  {i<3?["🥇","🥈","🥉"][i]:`#${i+1}`}
                </div>
                <div className="avatar" style={{width:36,height:36,fontSize:11,flexShrink:0,background:isMe?"linear-gradient(135deg,#00d68f,#4d9eff)":""}}>
                  {(r.name||"?").slice(0,2).toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {r.name}
                  {isMe&&<span style={{fontSize:10,color:"var(--g)",marginLeft:6}}>← você</span>}
                  {notInvested&&<span style={{fontSize:10,color:"var(--muted)",background:"var(--sf)",padding:"1px 6px",borderRadius:4,marginLeft:6}}>não investiu</span>}
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginTop:6,paddingLeft:57}}>
                <div style={{flex:1,minWidth:0,fontSize:11,color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lvlName(r.xp)} · {r.xp} XP</div>
                <div style={{textAlign:"right",flexShrink:0,whiteSpace:"nowrap"}}>
                  <span className="syne" style={{fontWeight:800,fontSize:15}}>{fmt(wealth)}</span>
                  {!notInvested&&<span style={{fontSize:11,color:pnl>=0?"var(--g)":"var(--red)",marginLeft:8}}>{pnl>=0?"+":""}{fmt(pnl)}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
