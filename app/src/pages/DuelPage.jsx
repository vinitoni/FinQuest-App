// Duelo de carteiras: cada jogador opera uma carteira independente de R$100k.
// Fluxo: criar (lobby aberto) -> oponente aceita -> os dois negociam ações ao
// vivo durante o período -> vence quem valorizar mais (%) no fim.
import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import { fmt, fmtP } from "../lib/format";
import { Modal } from "../components/Modal";

const DURATIONS=[
  {k:"15m",label:"15 min",  ms:900e3},
  {k:"1h", label:"1 hora",  ms:3600e3},
  {k:"1d", label:"1 dia",   ms:86400e3},
  {k:"1w", label:"1 semana",ms:604800e3},
];
const DUEL_XP=500;
const START_CASH=100000;

// Valor de uma carteira do duelo { TICKER:{qty,avgPrice} } pelos preços atuais.
function portValue(port,stocks){
  if(!port) return 0;
  return Object.entries(port).reduce((s,[t,p])=>{
    const st=stocks.find(x=>x.ticker===t);
    return s+(st?st.price*Number(p.qty):0);
  },0);
}
function fmtRemaining(ms){
  if(ms<=0) return "encerrando...";
  const s=Math.floor(ms/1000);
  const d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),sec=s%60;
  if(d>0) return d+"d "+h+"h";
  if(h>0) return h+"h "+m+"m";
  if(m>0) return m+"m "+sec+"s";
  return sec+"s";
}

export function DuelPage({user,stocks,earnXp,showToast}){
  const[duels,setDuels]=useState([]);        // duelos em que participo
  const[openDuels,setOpenDuels]=useState([]); // duelos abertos de outros jogadores
  const[loading,setLoading]=useState(true);
  const[selDur,setSelDur]=useState("1d");
  const[busy,setBusy]=useState(false);
  const[now,setNow]=useState(Date.now());
  const[tradeId,setTradeId]=useState(null);   // id do duelo aberto para negociar
  const claimed=useRef(new Set());

  const isCreator=d=>d.creator_id===user.id;
  const myCash=d=>isCreator(d)?Number(d.creator_cash):Number(d.opponent_cash);
  const myPort=d=>isCreator(d)?(d.creator_portfolio||{}):(d.opponent_portfolio||{});
  const oppCash=d=>isCreator(d)?Number(d.opponent_cash):Number(d.creator_cash);
  const oppPort=d=>isCreator(d)?(d.opponent_portfolio||{}):(d.creator_portfolio||{});
  const oppName=d=>isCreator(d)?(d.opponent_name||"Oponente"):d.creator_name;
  const myTotal=d=>myCash(d)+portValue(myPort(d),stocks);
  const oppTotal=d=>oppCash(d)+portValue(oppPort(d),stocks);
  const myRet=d=>d.status==="done"?(isCreator(d)?d.creator_return:d.opponent_return):(myTotal(d)/START_CASH-1)*100;
  const oppRet=d=>d.status==="done"?(isCreator(d)?d.opponent_return:d.creator_return):(oppTotal(d)/START_CASH-1)*100;

  async function resolveDuel(d){
    const cTotal=Number(d.creator_cash)+portValue(d.creator_portfolio,stocks);
    const oTotal=Number(d.opponent_cash)+portValue(d.opponent_portfolio,stocks);
    const cr=(cTotal/START_CASH-1)*100, or=(oTotal/START_CASH-1)*100;
    const winner=cr>or?d.creator_id:or>cr?d.opponent_id:null;
    await supabase.from("duels").update({status:"done",creator_return:cr,opponent_return:or,winner_id:winner}).eq("id",d.id).eq("status","active");
  }
  async function claimXp(d){
    if(d.status!=="done"||claimed.current.has(d.id)) return;
    const awarded=isCreator(d)?d.creator_awarded:d.opponent_awarded;
    if(d.winner_id===user.id && !awarded){
      claimed.current.add(d.id);
      earnXp(DUEL_XP);
      showToast("Você venceu o duelo! +"+DUEL_XP+" XP 🎉");
      await supabase.from("duels").update(isCreator(d)?{creator_awarded:true}:{opponent_awarded:true}).eq("id",d.id);
    }
  }

  async function refresh(silent){
    if(!user) return;
    if(!silent) setLoading(true);
    const mineFilter=`creator_id.eq.${user.id},opponent_id.eq.${user.id}`;
    let{data:mine}=await supabase.from("duels").select("*").or(mineFilter).order("created_at",{ascending:false});
    mine=mine||[];
    // resolve duelos ativos cujo tempo acabou
    const due=mine.filter(d=>d.status==="active"&&new Date(d.end_at)<=new Date());
    if(due.length){
      await Promise.all(due.map(resolveDuel));
      const r=await supabase.from("duels").select("*").or(mineFilter).order("created_at",{ascending:false});
      mine=r.data||mine;
    }
    for(const d of mine) await claimXp(d);
    const{data:open}=await supabase.from("duels").select("*").eq("status","open").neq("creator_id",user.id).order("created_at",{ascending:false});
    setDuels(mine);
    setOpenDuels(open||[]);
    setLoading(false);
  }

  useEffect(()=>{refresh();
    const id=setInterval(()=>refresh(true),20000); // sincroniza trades do oponente
    return()=>clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id);},[]);

  async function createDuel(){
    if(busy) return;
    setBusy(true);
    const dur=DURATIONS.find(x=>x.k===selDur);
    const{error}=await supabase.from("duels").insert({
      creator_id:user.id,creator_name:user.name,
      duration_label:dur.label,duration_ms:dur.ms,status:"open",
      creator_cash:START_CASH,creator_portfolio:{},
    });
    setBusy(false);
    if(error){showToast("Erro ao criar o duelo");return;}
    showToast("Desafio criado! Aguardando um oponente 🕒");
    refresh();
  }
  async function cancelDuel(d){
    await supabase.from("duels").delete().eq("id",d.id).eq("status","open");
    showToast("Desafio cancelado.");
    refresh();
  }
  async function acceptDuel(d){
    if(busy) return;
    setBusy(true);
    const t0=Date.now(),t1=t0+Number(d.duration_ms);
    const{error}=await supabase.from("duels").update({
      opponent_id:user.id,opponent_name:user.name,status:"active",
      started_at:new Date(t0).toISOString(),end_at:new Date(t1).toISOString(),
      opponent_cash:START_CASH,opponent_portfolio:{},
    }).eq("id",d.id).eq("status","open");
    setBusy(false);
    if(error){showToast("Não foi possível aceitar (talvez já tenha sido aceito)");refresh();return;}
    showToast("Duelo começou! Bora negociar ⚔️");
    refresh();
  }

  // ─── trades dentro do duelo (carteira independente) ───
  async function persistSide(d,cash,port){
    const upd=isCreator(d)?{creator_cash:cash,creator_portfolio:port}:{opponent_cash:cash,opponent_portfolio:port};
    setDuels(ds=>ds.map(x=>x.id===d.id?{...x,...upd}:x)); // otimista
    await supabase.from("duels").update(upd).eq("id",d.id);
  }
  function duelBuy(id,ticker,qty){
    const d=duels.find(x=>x.id===id); if(!d) return;
    if(d.status!=="active"||new Date(d.end_at)<=new Date()){showToast("Duelo encerrado.");return;}
    const s=stocks.find(x=>x.ticker===ticker); if(!s) return;
    const cost=s.price*qty, cash=myCash(d);
    if(cost>cash){showToast("Saldo do duelo insuficiente!");return;}
    const port={...myPort(d)};
    const prev=port[ticker]||{qty:0,avgPrice:0};
    const nq=prev.qty+qty;
    port[ticker]={qty:nq,avgPrice:((prev.avgPrice*prev.qty)+(s.price*qty))/nq};
    persistSide(d,cash-cost,port);
    showToast(qty+"x "+ticker+" comprada no duelo!");
  }
  function duelSell(id,ticker,qty){
    const d=duels.find(x=>x.id===id); if(!d) return;
    if(d.status!=="active"||new Date(d.end_at)<=new Date()){showToast("Duelo encerrado.");return;}
    const port={...myPort(d)};
    const pos=port[ticker];
    if(!pos||pos.qty<qty){showToast("Quantidade insuficiente!");return;}
    const s=stocks.find(x=>x.ticker===ticker); if(!s) return;
    const nq=pos.qty-qty;
    if(nq===0) delete port[ticker]; else port[ticker]={...pos,qty:nq};
    persistSide(d,myCash(d)+s.price*qty,port);
    showToast("Vendeu "+qty+"x "+ticker+" no duelo!");
  }

  const myOpen=duels.filter(d=>d.status==="open");
  const active=duels.filter(d=>d.status==="active");
  const done=duels.filter(d=>d.status==="done");
  const tradeDuel=tradeId?duels.find(d=>d.id===tradeId):null;
  const tradeEnded=tradeDuel?(tradeDuel.status!=="active"||new Date(tradeDuel.end_at)<=now):false;

  function Standings({d}){
    const mr=myRet(d),or=oppRet(d),leading=mr>or;
    const ended=d.status==="done";
    const iWon=d.winner_id===user.id;
    return(
      <div className="card" style={{padding:"15px 18px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{fontSize:12,color:"var(--muted)"}}>⚔️ Duelo {d.duration_label.toLowerCase()}</span>
          {ended
            ?<span className={"badge "+(iWon?"bg":d.winner_id?"br":"")}>{iWon?"🏆 Vitória":d.winner_id?"Derrota":"Empate"}</span>
            :<span className="badge" style={{background:"rgba(245,200,66,.15)",color:"var(--gold)"}}>⏳ {fmtRemaining(new Date(d.end_at)-now)}</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1,textAlign:"center"}}>
            <div style={{fontWeight:700,fontSize:13}}>Você</div>
            <div className="syne" style={{fontSize:22,fontWeight:800,color:mr>=0?"var(--g)":"var(--red)"}}>{fmtP(mr)}</div>
            <div style={{fontSize:11,color:"var(--muted)"}}>{fmt(myTotal(d))}</div>
          </div>
          <div className="syne" style={{fontSize:16,fontWeight:800,color:leading?"var(--g)":"var(--muted)"}}>VS</div>
          <div style={{flex:1,textAlign:"center"}}>
            <div style={{fontWeight:700,fontSize:13}}>{oppName(d)}</div>
            <div className="syne" style={{fontSize:22,fontWeight:800,color:or>=0?"var(--blue)":"var(--red)"}}>{fmtP(or)}</div>
            <div style={{fontSize:11,color:"var(--muted)"}}>{fmt(oppTotal(d))}</div>
          </div>
        </div>
        {!ended&&new Date(d.end_at)>now&&(
          <button className="btn bprimary" style={{width:"100%",marginTop:13}} onClick={()=>setTradeId(d.id)}>📈 Negociar</button>
        )}
      </div>
    );
  }

  return(
    <div className="page">
      {tradeDuel&&(
        <DuelTradeModal
          duel={tradeDuel} stocks={stocks} ended={tradeEnded} now={now}
          cash={myCash(tradeDuel)} port={myPort(tradeDuel)}
          myRet={myRet(tradeDuel)} oppRet={oppRet(tradeDuel)} oppName={oppName(tradeDuel)}
          onBuy={(t,q)=>duelBuy(tradeDuel.id,t,q)} onSell={(t,q)=>duelSell(tradeDuel.id,t,q)}
          onClose={()=>setTradeId(null)}
        />
      )}

      <div className="topbar">
        <div><div className="ptitle syne">⚔️ Duelo de Carteiras</div><div className="psub">Cada um com R$100k, quem valorizar mais vence</div></div>
        <button className="btn bghost bsm" onClick={()=>refresh()}>↻</button>
      </div>

      <div style={{padding:"13px 17px",background:"rgba(0,214,143,.06)",border:"1px solid rgba(0,214,143,.22)",borderRadius:10,marginBottom:22,fontSize:13,color:"var(--muted)"}}>
        <strong style={{color:"var(--g)"}}>Como funciona: </strong>
        Você cria um desafio e espera alguém aceitar. Quando o oponente entra, vocês recebem <strong>R$100.000 cada</strong> numa carteira <strong>separada da sua principal</strong> e podem <strong>comprar e vender ações o tempo todo</strong> com preços reais da B3. No fim do período, <strong>quem valorizou mais (%)</strong> leva <strong style={{color:"var(--gold)"}}>+{DUEL_XP} XP</strong>.
      </div>

      {/* criar duelo */}
      <div className="card" style={{marginBottom:22}}>
        <div className="clabel" style={{marginBottom:12}}>Criar novo desafio</div>
        <div style={{fontSize:12,color:"var(--muted)",marginBottom:7}}>Duração do duelo</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
          {DURATIONS.map(x=>(
            <button key={x.k} className={"btn bsm "+(selDur===x.k?"bprimary":"boutline")} onClick={()=>setSelDur(x.k)}>{x.label}</button>
          ))}
        </div>
        <button className="btn bprimary" style={{width:"100%"}} disabled={busy} onClick={createDuel}>{busy?"...":"⚔️ Abrir desafio"}</button>
      </div>

      {/* meus desafios aguardando */}
      {myOpen.length>0&&(
        <div style={{marginBottom:22}}>
          <div className="clabel" style={{marginBottom:11}}>Aguardando oponente</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {myOpen.map(d=>(
              <div key={d.id} className="card" style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px"}}>
                <span style={{fontSize:22,flexShrink:0}}>🕒</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>Duelo {d.duration_label.toLowerCase()}</div>
                  <div style={{fontSize:11,color:"var(--muted)"}}>Esperando alguém aceitar seu desafio</div>
                </div>
                <button className="btn bred bsm" style={{flexShrink:0}} onClick={()=>cancelDuel(d)}>Cancelar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* lobby: desafios abertos de outros */}
      {openDuels.length>0&&(
        <div style={{marginBottom:22}}>
          <div className="clabel" style={{marginBottom:11}}>Desafios abertos · entre num duelo</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {openDuels.map(d=>(
              <div key={d.id} className="card" style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px"}}>
                <div className="avatar" style={{width:36,height:36,fontSize:12,flexShrink:0}}>{(d.creator_name||"?").slice(0,2).toUpperCase()}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.creator_name} desafiou</div>
                  <div style={{fontSize:11,color:"var(--muted)"}}>Duelo de {d.duration_label.toLowerCase()} · R$100k cada</div>
                </div>
                <button className="btn bprimary bsm" style={{flexShrink:0}} disabled={busy} onClick={()=>acceptDuel(d)}>Aceitar ⚔️</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* duelos ativos */}
      {active.length>0&&(
        <div style={{marginBottom:22}}>
          <div className="clabel" style={{marginBottom:11}}>Duelos em andamento</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>{active.map(d=><Standings key={d.id} d={d}/>)}</div>
        </div>
      )}

      {/* histórico */}
      {done.length>0&&(
        <div>
          <div className="clabel" style={{marginBottom:11}}>Histórico</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>{done.map(d=><Standings key={d.id} d={d}/>)}</div>
        </div>
      )}

      {loading&&<div style={{textAlign:"center",color:"var(--muted)",fontSize:13,padding:20}}>Carregando duelos...</div>}
      {!loading&&myOpen.length===0&&active.length===0&&done.length===0&&openDuels.length===0&&(
        <div style={{textAlign:"center",color:"var(--muted)",fontSize:13,padding:20}}>Nenhum duelo ainda. Abra o primeiro desafio acima!</div>
      )}
    </div>
  );
}

// ─── Modal de negociação dentro do duelo ───
function DuelTradeModal({duel,stocks,ended,now,cash,port,myRet,oppRet,oppName,onBuy,onSell,onClose}){
  const total=cash+portValue(port,stocks);
  const ret=(total/START_CASH-1)*100;
  const leading=myRet>oppRet;
  return(
    <Modal open={true} onClose={onClose} title={"⚔️ Duelo vs "+oppName} width={760}>
      {/* placar + tempo */}
      <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
        <div className="badge" style={{background:ended?"rgba(255,82,82,.15)":"rgba(245,200,66,.15)",color:ended?"var(--red)":"var(--gold)"}}>
          {ended?"Encerrado":"⏳ "+fmtRemaining(new Date(duel.end_at)-now)}
        </div>
        <div style={{fontSize:12,color:"var(--muted)"}}>Você <strong style={{color:myRet>=0?"var(--g)":"var(--red)"}}>{fmtP(myRet)}</strong></div>
        <div style={{fontSize:12,color:"var(--muted)"}}>{oppName} <strong style={{color:oppRet>=0?"var(--blue)":"var(--red)"}}>{fmtP(oppRet)}</strong></div>
        <div style={{marginLeft:"auto",fontSize:12,fontWeight:700,color:leading?"var(--g)":"var(--muted)"}}>{leading?"Na frente 🔥":"Atrás"}</div>
      </div>

      {/* carteira do duelo */}
      <div className="g4" style={{marginBottom:16}}>
        {[["Caixa",fmt(cash)],["Em ações",fmt(portValue(port,stocks))],["Total",fmt(total)],["Retorno",fmtP(ret)]].map(([l,v],i)=>(
          <div key={l} className="card" style={{padding:"10px 13px",textAlign:"center"}}>
            <div style={{fontSize:10,color:"var(--muted)"}}>{l}</div>
            <div className="syne" style={{fontSize:15,fontWeight:800,color:i===3?(ret>=0?"var(--g)":"var(--red)"):"var(--text)"}}>{v}</div>
          </div>
        ))}
      </div>

      {ended
        ?<div style={{textAlign:"center",color:"var(--muted)",fontSize:13,padding:"14px 0"}}>O tempo deste duelo acabou. As negociações estão encerradas.</div>
        :<div style={{display:"flex",flexDirection:"column",gap:7,maxHeight:340,overflowY:"auto"}}>
          {stocks.map(s=>(
            <DuelStockRow key={s.ticker} stock={s} held={port[s.ticker]?.qty||0} cash={cash} onBuy={onBuy} onSell={onSell}/>
          ))}
        </div>}
    </Modal>
  );
}

function DuelStockRow({stock,held,cash,onBuy,onSell}){
  const[q,setQ]=useState(1);
  const qty=Math.max(1,q||1);
  const canBuy=stock.price*qty<=cash;
  return(
    <div className="card" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",flexWrap:"wrap"}}>
      <div style={{width:96}}>
        <div className="syne" style={{fontWeight:700,color:"var(--g)",fontSize:13}}>{stock.ticker}</div>
        <div style={{fontSize:10,color:"var(--muted)"}}>{held>0?held+" em carteira":stock.sector}</div>
      </div>
      <div style={{flex:1,minWidth:120}}>
        <span style={{fontWeight:700,fontSize:13}}>R${stock.price.toFixed(2)}</span>
        <span className={"badge "+(stock.change>=0?"bg":"br")} style={{marginLeft:8}}>{stock.change>=0?"▲":"▼"}{Math.abs(stock.change).toFixed(2)}%</span>
      </div>
      <input className="inp" type="number" min={1} value={q} onChange={e=>setQ(Math.max(1,parseInt(e.target.value)||1))} style={{width:64,padding:"6px 8px"}}/>
      <button className="btn bprimary bxs" disabled={!canBuy} onClick={()=>onBuy(stock.ticker,qty)}>Comprar</button>
      <button className="btn bred bxs" disabled={held<1} onClick={()=>onSell(stock.ticker,Math.min(qty,held))}>Vender</button>
    </div>
  );
}
