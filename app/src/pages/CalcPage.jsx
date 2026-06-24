// Calculadoras financeiras: juros compostos, aposentadoria e dividendos.
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { fmt } from "../lib/format";
import { ChartTip } from "../components/ChartTip";

export function CalcPage({macro}){
  const[tab,setTab]=useState("j");
  const[j,setJ]=useState({i:10000,m:500,t:0.8,p:60});
  const calcData=()=>{
    let v=j.i;const d=[];
    for(let i=0;i<=j.p;i+=6){d.push({mes:i===0?"Hoje":i+"m",value:Math.round(v)});for(let k=0;k<6&&i+k<j.p;k++) v=v*(1+j.t/100)+j.m;}
    return{d,final:v,juros:v-j.i-(j.m*j.p)};
  };
  const{d,final,juros}=calcData();
  return(
    <div className="page">
      <div className="topbar">
        <div><div className="ptitle syne">Calculadoras</div><div className="psub">Simule seus investimentos</div></div>
        <div style={{display:"flex",gap:8,fontSize:12}}>
          {macro?.selic&&<span style={{background:"var(--bg2)",border:"1px solid var(--b)",borderRadius:99,padding:"4px 12px"}}>SELIC <span style={{color:"var(--g)",fontWeight:700}}>{macro.selic}% a.a.</span></span>}
          {macro?.cdi&&<span style={{background:"var(--bg2)",border:"1px solid var(--b)",borderRadius:99,padding:"4px 12px"}}>CDI <span style={{color:"var(--gold)",fontWeight:700}}>{macro.cdi}% a.a.</span></span>}
          {macro?.ipca&&<span style={{background:"var(--bg2)",border:"1px solid var(--b)",borderRadius:99,padding:"4px 12px"}}>IPCA <span style={{color:"var(--muted)",fontWeight:700}}>{macro.ipca}%</span></span>}
        </div>
      </div>
      <div className="tabs" style={{marginBottom:26,width:"fit-content"}}>
        {[["j","📈 Juros Compostos"],["a","🏖️ Aposentadoria"],["d","💰 Dividendos"]].map(([k,l])=>(
          <button key={k} className={`tab${tab===k?" act":""}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>
      {tab==="j"&&(
        <div className="g2">
          <div className="card">
            {[["Valor inicial (R$)","i",1000],["Aporte mensal (R$)","m",100],["Taxa mensal (%)","t",0.1],["Período (meses)","p",12]].map(([l,k,st])=>(
              <div key={k} className="fg"><label className="ilabel">{l}</label><input className="inp" type="number" step={st} value={j[k]} onChange={e=>setJ(p=>({...p,[k]:parseFloat(e.target.value)||0}))}/></div>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{background:"var(--bg1)",border:"1px solid var(--b)",borderRadius:12,padding:22,textAlign:"center"}}>
              <div style={{fontSize:12,color:"var(--muted)",marginBottom:6}}>Valor final estimado</div>
              <div className="syne" style={{fontSize:32,fontWeight:800,color:"var(--g)"}}>{fmt(final)}</div>
              <div style={{marginTop:6,fontSize:12,color:"var(--muted)"}}>Juros ganhos: <span style={{color:"var(--g)",fontWeight:700}}>{fmt(juros)}</span></div>
            </div>
            <div className="card">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={d}>
                  <defs><linearGradient id="jg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00d68f" stopOpacity={.2}/><stop offset="95%" stopColor="#00d68f" stopOpacity={0}/></linearGradient></defs>
                  <XAxis dataKey="mes" tick={{fill:"var(--muted)",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"var(--muted)",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Area type="monotone" dataKey="value" stroke="#00d68f" strokeWidth={2} fill="url(#jg)" name="Valor"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      {tab==="a"&&<ApoCalc macro={macro}/>}
      {tab==="d"&&<DivCalc/>}
    </div>
  );
}
function ApoCalc({macro}){
  const[s,setS]=useState({i:30,a:65,r:5000});
  const anos=s.a-s.i;const fv=s.r*300;
  // Usa SELIC mensal real como taxa de referência (simplificado)
  const taxa=(macro?.selic||13.75)/100/12;
  const m=anos*12;
  const aporte=m>0?Math.round(fv/((Math.pow(1+taxa,m)-1)/taxa)):0;
  return(
    <div className="g2">
      <div className="card">{[["Idade atual","i",1],["Aposentar com (anos)","a",1],["Renda mensal desejada (R$)","r",500]].map(([l,k,st])=>(
        <div key={k} className="fg"><label className="ilabel">{l}</label><input className="inp" type="number" step={st} value={s[k]} onChange={e=>setS(p=>({...p,[k]:parseFloat(e.target.value)||0}))}/></div>
      ))}</div>
      <div style={{background:"var(--bg1)",border:"1px solid var(--b)",borderRadius:12,padding:28,display:"flex",flexDirection:"column",justifyContent:"center"}}>
        <div style={{fontSize:12,color:"var(--muted)",marginBottom:6}}>Aporte mensal necessário</div>
        <div className="syne" style={{fontSize:30,fontWeight:800,color:"var(--g)"}}>{fmt(aporte)}/mês</div>
        <div style={{marginTop:12,color:"var(--muted)",fontSize:13,lineHeight:1.6}}>Com {anos} anos e SELIC {(macro?.selic||13.75).toFixed(2)}% a.a. ({(taxa*100).toFixed(2)}%/mês), precisará acumular <span style={{color:"var(--g)",fontWeight:700}}>{fmt(fv)}</span> para gerar a renda desejada.</div>
      </div>
    </div>
  );
}
function DivCalc(){
  const[inv,setInv]=useState(50000);const[dy,setDy]=useState(8);
  const mensal=(inv*(dy/100))/12;
  return(
    <div className="g2">
      <div className="card">
        <div className="fg"><label className="ilabel">Valor investido (R$)</label><input className="inp" type="number" step={5000} value={inv} onChange={e=>setInv(+e.target.value||0)}/></div>
        <div className="fg"><label className="ilabel">Dividend Yield anual (%)</label><input className="inp" type="number" step={0.5} value={dy} onChange={e=>setDy(+e.target.value||0)}/></div>
      </div>
      <div style={{background:"var(--bg1)",border:"1px solid var(--b)",borderRadius:12,padding:28,display:"flex",flexDirection:"column",justifyContent:"center"}}>
        <div style={{fontSize:12,color:"var(--muted)",marginBottom:6}}>Renda mensal estimada</div>
        <div className="syne" style={{fontSize:30,fontWeight:800,color:"var(--g)"}}>{fmt(mensal)}</div>
        <div style={{marginTop:6,fontSize:12,color:"var(--muted)"}}>Anual: <span style={{color:"var(--g)",fontWeight:700}}>{fmt(mensal*12)}</span></div>
      </div>
    </div>
  );
}
