// Dashboard: visão geral do patrimônio, benchmarks, XP e carteira.
import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { fmt, fmtP } from "../lib/format";
import { ChartTip } from "../components/ChartTip";

export function DashPage({cash,totalWealth,pnl,portfolio,stocks,xp,xpPct,level,LVL_NAMES,courses,progress,trades,lastUpdated,mktLoading,apiStatus,fetchPrices,macro}){
  const totalPort=totalWealth-cash;
  // Benchmark data usando CDI real do HG Brasil
  const benchData=useMemo(()=>{
    const months=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    let cart=100000,cdi=100000,ibov=100000;
    const monthlyRate=(macro?.cdi||13.75)/100/12;
    return months.slice(0,8).map(m=>{
      cart+=(Math.random()-.38)*6500;
      cdi*=1+monthlyRate;
      ibov+=(Math.random()-.46)*9000;
      return{m,Carteira:Math.round(cart),CDI:Math.round(cdi),Ibovespa:Math.round(Math.max(ibov,60000))};
    });
  },[macro?.cdi]);

  const doneMod=Object.values(progress).reduce((s,set)=>s+set.size,0);
  const totalMod=courses.reduce((s,c)=>s+c.modules.length,0);
  const cdiReturn=((benchData[benchData.length-1].CDI-100000)/100000*100);
  const ibovReturn=((benchData[benchData.length-1].Ibovespa-100000)/100000*100);
  const myReturn=(pnl/100000*100);

  return(
    <div className="page">
      <div className="topbar">
        <div>
          <div className="ptitle syne">Dashboard</div>
          <div className="psub" style={{display:"flex",alignItems:"center",gap:8}}>
            Visão geral da sua jornada
            {apiStatus==="ok"&&lastUpdated&&<span style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"var(--g)"}}><span className="live"/>Tempo real · B3 {lastUpdated.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</span>}
            {apiStatus==="fallback"&&<span style={{fontSize:11,color:"var(--gold)"}}>📅 Último fechamento B3</span>}
            {apiStatus==="error"&&<span style={{fontSize:11,color:"var(--red)"}}>⚠ Erro ao carregar preços</span>}
          </div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <button className="btn bghost bsm" onClick={fetchPrices} disabled={mktLoading}>{mktLoading?<span className="spinner"/>:"🔄"} Atualizar</button>
          <div className="lvlbadge">⭐ Nível {level}: {LVL_NAMES[level]}</div>
        </div>
      </div>

      <div className="g4" style={{marginBottom:18}}>
        {[
          {l:"Patrimônio Total",    v:fmt(totalWealth), sub:fmtP(myReturn),    pos:pnl>=0},
          {l:"Saldo Disponível",    v:fmt(cash),        sub:"livre para investir",neutral:true},
          {l:"Em Carteira",         v:fmt(totalPort),   sub:Object.keys(portfolio).length+" ativos",neutral:true},
          {l:"vs Capital Inicial",  v:fmtP(myReturn),   sub:"desde R$100.000",  pos:pnl>=0},
        ].map(s=>(
          <div key={s.l} className="card">
            <div className="clabel">{s.l}</div>
            <div className="syne" style={{fontSize:18,fontWeight:800}}>{s.v}</div>
            <div style={{fontSize:12,fontWeight:600,marginTop:3,color:s.neutral?"var(--muted)":s.pos?"var(--g)":"var(--red)"}}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="g2" style={{marginBottom:18}}>
        <div className="card">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
            <div>
              <div className="clabel">Patrimônio vs Benchmarks</div>
              <div className="syne" style={{fontSize:18,fontWeight:800}}>{fmt(totalWealth)}</div>
            </div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              {[["#00d68f","Carteira"],["#f5c842","CDI"],["#4d9eff","Ibovespa"]].map(([c,l])=>(
                <span key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,fontWeight:600}}>
                  <span style={{width:10,height:3,background:c,display:"inline-block",borderRadius:2}}/>  {l}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={benchData}>
              <XAxis dataKey="m" tick={{fill:"var(--muted)",fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"var(--muted)",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={<ChartTip/>}/>
              <Line type="monotone" dataKey="Carteira" stroke="#00d68f" strokeWidth={2.5} dot={false} name="Carteira"/>
              <Line type="monotone" dataKey="CDI" stroke="#f5c842" strokeWidth={1.8} dot={false} strokeDasharray="5 3" name="CDI"/>
              <Line type="monotone" dataKey="Ibovespa" stroke="#4d9eff" strokeWidth={1.8} dot={false} strokeDasharray="5 3" name="Ibovespa"/>
            </LineChart>
          </ResponsiveContainer>
          {macro?.ibovChange!=null&&<div style={{fontSize:11,color:"var(--muted)",marginTop:8}}>Ibovespa hoje: <span style={{color:macro.ibovChange>=0?"var(--g)":"var(--red)",fontWeight:700}}>{fmtP(macro.ibovChange)}</span>{macro?.ibov&&<span> · {Math.round(macro.ibov).toLocaleString("pt-BR")} pts</span>}</div>}
          <div style={{display:"flex",gap:10,marginTop:8}}>
            {[["Carteira",myReturn,"var(--g)"],["CDI "+(macro?.cdi||"--")+"% a.a.",cdiReturn,"var(--gold)"],["Ibovespa",ibovReturn,"var(--blue)"]].map(([l,v,c])=>(
              <div key={l} style={{flex:1,padding:"7px 10px",background:"var(--bg2)",borderRadius:8,textAlign:"center"}}>
                <div style={{fontSize:10,color:"var(--muted)",marginBottom:2}}>{l}</div>
                <div style={{fontSize:13,fontWeight:700,color:c}}>{fmtP(v)}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div className="card">
            <div className="clabel">XP & Nível</div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontWeight:700,fontSize:14}}>Nível {level}: {LVL_NAMES[level]}</span>
              <span style={{fontSize:12,color:"var(--muted)"}}>{xp} XP</span>
            </div>
            <div className="xpw"><div className="xpf" style={{width:`${xpPct}%`}}/></div>
            <div style={{fontSize:11,color:"var(--muted)",marginTop:5}}>{Math.round(xpPct)}% para o próximo nível</div>
          </div>
          <div className="card" style={{flex:1}}>
            <div className="clabel" style={{marginBottom:10}}>Progresso Academy</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontWeight:600,fontSize:14}}>{doneMod}/{totalMod} módulos</span>
              <span className="badge bg">{Math.round(doneMod/totalMod*100)||0}%</span>
            </div>
            <div className="prog" style={{marginBottom:12}}><div className="pfill" style={{width:`${doneMod/totalMod*100||0}%`,background:"var(--g)"}}/></div>
            {courses.slice(0,4).map(c=>{
              const d=progress[c.id]?.size||0;
              return(
                <div key={c.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:9}}>
                  <span style={{fontSize:15,flexShrink:0}}>{c.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",gap:8,fontSize:11,marginBottom:3}}>
                      <span style={{color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.title}</span>
                      <span style={{color:d===c.modules.length?"var(--g)":"var(--muted)"}}>{d}/{c.modules.length}</span>
                    </div>
                    <div className="prog" style={{height:3}}><div className="pfill" style={{width:`${(d/c.modules.length)*100}%`,background:c.color}}/></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <div className="clabel" style={{marginBottom:12}}>Minha Carteira</div>
          {!Object.keys(portfolio).length?(
            <div style={{textAlign:"center",padding:"28px 0",color:"var(--muted)"}}><div style={{fontSize:28,marginBottom:8}}>📂</div><div>Use o Simulador para comprar ações!</div></div>
          ):(
            <div className="slist">
              {Object.entries(portfolio).map(([t,pos])=>{
                const s=stocks.find(s=>s.ticker===t);
                const ret=s?((s.price-pos.avgPrice)/pos.avgPrice*100).toFixed(2):0;
                return(
                  <div key={t} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:"var(--bg2)",borderRadius:8}}>
                    <div><div style={{fontWeight:700}}>{t}</div><div style={{fontSize:11,color:"var(--muted)"}}>{pos.qty} ações · PM {fmt(pos.avgPrice)}</div></div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontWeight:600}}>{s?fmt(s.price*pos.qty):"-"}</div>
                      <div style={{fontSize:11,color:ret>=0?"var(--g)":"var(--red)"}}>{ret>=0?"+":""}{ret}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="card">
          <div className="clabel" style={{marginBottom:12}}>Últimas Operações</div>
          {!trades.length?(
            <div style={{textAlign:"center",padding:"28px 0",color:"var(--muted)"}}><div style={{fontSize:28,marginBottom:8}}>📋</div><div>Nenhuma operação ainda.</div></div>
          ):(
            <div className="slist">
              {trades.slice(0,8).map((t,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:"var(--bg2)",borderRadius:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:14}}>{t.type==="buy"?"🟢":"🔴"}</span>
                    <div><div style={{fontWeight:600,fontSize:13}}>{t.type==="buy"?"Compra":"Venda"} {t.ticker}</div><div style={{fontSize:11,color:"var(--muted)"}}>{t.qty} ações</div></div>
                  </div>
                  <div style={{fontWeight:600,fontSize:13}}>{fmt(t.price*t.qty)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
