// Simulador da bolsa: mercado, operações de compra/venda e carteira.
import { useState } from "react";
import { fmt, fmtP } from "../lib/format";
import { Modal } from "../components/Modal";

// Linha da carteira com venda parcial (estilo corretora)
function PositionRow({ticker,pos,stock,sellStock,setInfo}){
  const[q,setQ]=useState(1);
  const max=pos.qty;
  const cur=stock?stock.price:pos.avgPrice;
  const ret=stock?(stock.price-pos.avgPrice)/pos.avgPrice*100:0;
  const sellQ=Math.min(Math.max(1,q),max);
  const setPct=p=>setQ(Math.max(1,Math.floor(max*p)));
  return(
    <div className="card" style={{padding:"16px 20px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1.3fr .7fr 1fr 1.2fr",alignItems:"center",gap:10}}>
        <div><div className="syne" style={{fontWeight:700,color:"var(--g)"}}>{ticker}</div><div style={{fontSize:11,color:"var(--muted)"}}>{stock?.name}</div></div>
        <div><div style={{fontSize:10,color:"var(--muted)"}}>Qtd</div><div style={{fontWeight:600}}>{pos.qty}</div></div>
        <div>
          <div style={{fontSize:10,color:"var(--muted)",display:"flex",gap:4,alignItems:"center"}}>PM <button onClick={()=>setInfo("pm")} style={{background:"rgba(77,158,255,.15)",border:"none",color:"var(--blue)",fontSize:9,fontWeight:700,cursor:"pointer",borderRadius:99,padding:"1px 5px"}}>i</button></div>
          <div style={{fontWeight:600}}>{fmt(pos.avgPrice)}</div>
        </div>
        <div>
          <div style={{fontSize:10,color:"var(--muted)"}}>Resultado</div>
          <div style={{fontWeight:700,color:ret>=0?"var(--g)":"var(--red)"}}>{fmtP(ret)}</div>
          <div style={{fontSize:11,color:"var(--muted)"}}>{stock?fmt(cur*pos.qty):"-"}</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginTop:13,paddingTop:13,borderTop:"1px solid var(--b)"}}>
        <span style={{fontSize:12,color:"var(--muted)"}}>Vender</span>
        <input className="inp" type="number" min={1} max={max} value={q} onChange={e=>setQ(Math.min(max,Math.max(1,parseInt(e.target.value)||1)))} style={{width:78,padding:"6px 9px"}}/>
        <div style={{display:"flex",gap:5}}>
          <button className="btn bghost bxs" onClick={()=>setPct(.25)}>25%</button>
          <button className="btn bghost bxs" onClick={()=>setPct(.5)}>50%</button>
          <button className="btn bghost bxs" onClick={()=>setQ(max)}>Tudo</button>
        </div>
        <span style={{fontSize:12,color:"var(--muted)",marginLeft:"auto"}}>≈ {fmt(cur*sellQ)}</span>
        <button className="btn bred bsm" onClick={()=>sellStock(ticker,sellQ)}>Vender {sellQ===max?"tudo":sellQ}</button>
      </div>
    </div>
  );
}

export function SimPage({stocks,portfolio,cash,buyStock,sellStock,lastUpdated,mktLoading,apiStatus,fetchPrices}){
  const[sel,setSel]=useState(null);
  const[qty,setQty]=useState(1);
  const[tab,setTab]=useState("mkt");
  const[info,setInfo]=useState(null);

  const INFO={
    price:{t:"Como funcionam os preços?",b:"Cotações reais da B3 via <strong>Yahoo Finance</strong> com ~15min de delay. Atualização automática a cada 5 minutos. Quando indisponível, exibimos o último fechamento conhecido."},
    change:{t:"O que é variação diária?",b:"Indica quanto o ativo subiu ou caiu vs. fechamento anterior. <strong>▲ verde = alta</strong>, <strong>▼ vermelho = queda</strong>. No mercado real, muda a cada segundo durante o pregão (10h–17h)."},
    pm:{t:"Preço Médio (PM)",b:"Média ponderada dos preços de compra. Exemplo: 10 ações a R$30 + 10 a R$40 = PM R$35.<br/><br/><strong>Resultado = (Preço atual − PM) × Quantidade</strong>"},
    codigo:{t:"Entenda os códigos da bolsa",b:"Toda ação tem um código (o <strong>ticker</strong>), formado por <strong>4 letras + um número</strong>. Ex: <strong>PETR4</strong>, <strong>VALE3</strong>, <strong>BBAS3</strong>.<br/><br/>"+
      "<strong>As letras</strong> identificam a empresa:<br/>• PETR = Petrobras · VALE = Vale · BBAS = Banco do Brasil · ITUB = Itaú<br/><br/>"+
      "<strong>O número</strong> diz o tipo da ação:<br/>"+
      "• <strong>3</strong> = Ordinária (ON), dá direito a voto nas assembleias<br/>"+
      "• <strong>4</strong> = Preferencial (PN), sem voto, mas com prioridade nos dividendos<br/>"+
      "• <strong>11</strong> = Unit, ETF ou Fundo Imobiliário (FII)<br/><br/>"+
      "Por isso <strong>BBAS3</strong> (Banco do Brasil ON) é diferente de <strong>ITUB4</strong> (Itaú PN): muda a empresa e o tipo."},
    frac:{t:"Lote padrão x Fracionário (o \"F\")",b:"Na B3 a mesma ação pode ser negociada de dois jeitos:<br/><br/>"+
      "• <strong>Lote padrão</strong> (ex: <strong>BBAS3</strong>): compra/venda de <strong>100 em 100</strong> ações. É onde está a maior liquidez.<br/>"+
      "• <strong>Fracionário</strong> (ex: <strong>BBAS3F</strong>, com o <strong>F</strong> no fim): permite comprar de <strong>1 a 99</strong> ações. Ideal pra quem está começando com pouco dinheiro.<br/><br/>"+
      "É a <strong>mesma empresa e o mesmo preço por ação</strong>, só muda a quantidade mínima. O \"F\" indica o mercado fracionário.<br/><br/>"+
      "Aqui no simulador você opera <strong>de 1 em 1</strong> (como no fracionário), pra você aprender sem precisar de lotes inteiros."},
  };

  const totalPort=Object.entries(portfolio).reduce((s,[t,p])=>{
    const st=stocks.find(s=>s.ticker===t);
    return s+(st?st.price:p.avgPrice)*p.qty;
  },0);

  return(
    <div className="page">
      <Modal open={!!info} onClose={()=>setInfo(null)} title={info?INFO[info]?.t:""} width={480}>
        {info&&<div style={{fontSize:14,color:"#b8cfe0",lineHeight:1.7}} dangerouslySetInnerHTML={{__html:INFO[info]?.b}}/>}
        <button className="btn boutline" style={{width:"100%",marginTop:18}} onClick={()=>setInfo(null)}>Entendido</button>
      </Modal>

      <div className="topbar">
        <div>
          <div className="ptitle syne">Simulador da Bolsa</div>
          <div className="psub" style={{display:"flex",alignItems:"center",gap:8}}>
            {apiStatus==="ok"&&lastUpdated
              ?<><span className="live"/>Tempo real · {lastUpdated.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</>
              :apiStatus==="fallback"
              ?<span style={{color:"var(--gold)"}}>📅 Último fechamento B3, atualizando...</span>
              :apiStatus==="idle"||loading
              ?<span style={{color:"var(--muted)"}}>⏳ Conectando à B3...</span>
              :<span style={{color:"var(--red)"}}>⚠ Erro na API</span>
            }
          </div>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <button className="btn bghost bsm" onClick={fetchPrices} disabled={mktLoading}>{mktLoading?<span className="spinner"/>:"🔄"}</button>
          <div className="card" style={{padding:"8px 15px"}}><div style={{fontSize:10,color:"var(--muted)"}}>Saldo</div><div className="syne" style={{fontWeight:800,color:"var(--g)",fontSize:15}}>{fmt(cash)}</div></div>
          <div className="card" style={{padding:"8px 15px"}}><div style={{fontSize:10,color:"var(--muted)"}}>Em carteira</div><div className="syne" style={{fontWeight:800,fontSize:15}}>{fmt(totalPort)}</div></div>
        </div>
      </div>

      <div style={{padding:"10px 15px",background:"rgba(77,158,255,.06)",border:"1px solid rgba(77,158,255,.2)",borderRadius:10,marginBottom:20,display:"flex",gap:11,alignItems:"center",fontSize:13}}>
        <span>ℹ️</span>
        <div style={{flex:1,color:"var(--muted)"}}>
          {apiStatus==="ok"
            ?"✅ Cotações em tempo real via Yahoo Finance (B3 com ~15min delay). Auto-atualização a cada 5 min."
            :apiStatus==="fallback"
            ?"📅 Exibindo preços do último fechamento da B3. Atualizando cotações em tempo real..."
            :"⏳ Conectando ao serviço de cotações..."}
        </div>
        <button onClick={()=>setInfo("price")} style={{background:"rgba(77,158,255,.15)",border:"1px solid rgba(77,158,255,.3)",color:"var(--blue)",fontSize:11,fontWeight:700,cursor:"pointer",borderRadius:99,padding:"2px 9px"}}>i</button>
      </div>

      <div className="tabs" style={{marginBottom:20,width:"fit-content"}}>
        {[["mkt","📊 Mercado"],["cart","💼 Carteira"]].map(([k,l])=>(
          <button key={k} className={`tab${tab===k?" act":""}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {tab==="mkt"&&(
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:14,fontSize:13,color:"var(--muted)"}}>
          <span>🎓 Novo na bolsa?</span>
          <button className="btn bghost bxs" onClick={()=>setInfo("codigo")}>O que significa PETR4, BBAS3?</button>
          <button className="btn bghost bxs" onClick={()=>setInfo("frac")}>Lote padrão x Fracionário (F)</button>
        </div>
      )}

      {tab==="mkt"&&(
        <div className="g2">
          <div className="scroll-x">
          <div className="card" style={{padding:0,overflow:"hidden",minWidth:340}}>
            <div style={{display:"flex",padding:"10px 16px",borderBottom:"1px solid var(--b)",gap:10}}>
              {[["64px","Ativo",""],["1fr","Empresa",""],["84px","Preço",""],["70px","Var.%",""],["68px","","mkt-op"]].map(([w,h,cls])=>(
                <div key={h+cls} className={cls} style={{width:w,flexShrink:0,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:"var(--muted)",flex:h==="Empresa"?"1":"none"}}>{h}</div>
              ))}
            </div>
            {stocks.map(s=>(
              <div key={s.ticker} className="stk-row" style={{background:sel?.ticker===s.ticker?"rgba(0,214,143,.04)":""}}>
                <div style={{width:64,flexShrink:0,cursor:"pointer"}} onClick={()=>{setSel(s);setQty(1);}}>
                  <span className="syne" style={{fontWeight:700,color:"var(--g)",fontSize:12}}>{s.ticker}</span>
                </div>
                <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>{setSel(s);setQty(1);}}>
                  <div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
                  <div style={{fontSize:11,color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.sector}</div>
                </div>
                <div style={{width:84,flexShrink:0}}>
                  <span style={{fontWeight:700,fontSize:13}}>R${s.price.toFixed(2)}</span>
                </div>
                <div style={{width:70,flexShrink:0}}>
                  <span className={"badge "+(s.change>=0?"bg":"br")}>{s.change>=0?"▲":"▼"}{Math.abs(s.change).toFixed(2)}%</span>
                </div>
                <div className="mkt-op" style={{width:68,flexShrink:0}}>
                  <button className="btn bghost bxs" onClick={()=>{setSel(s);setQty(1);}}>Operar</button>
                </div>
              </div>
            ))}
          </div>
          </div>

          <div>
            {sel?(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div className="card">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                    <div>
                      <div className="syne" style={{fontSize:20,fontWeight:800,color:"var(--g)"}}>{sel.ticker}</div>
                      <div style={{color:"var(--muted)",fontSize:13}}>{sel.name} · {sel.sector}</div>
                    </div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      <span className={`badge ${sel.change>=0?"bg":"br"}`}>{sel.change>=0?"▲":"▼"}{Math.abs(sel.change).toFixed(2)}%</span>
                      <button onClick={()=>setInfo("change")} style={{background:"rgba(77,158,255,.15)",border:"none",color:"var(--blue)",fontSize:10,fontWeight:700,cursor:"pointer",borderRadius:99,padding:"2px 8px"}}>i</button>
                    </div>
                  </div>
                  <div className="syne" style={{fontSize:28,fontWeight:800,marginBottom:10}}>R${sel.price.toFixed(2)}</div>
                  {sel.high&&<div style={{display:"flex",gap:14,fontSize:12,color:"var(--muted)"}}>
                    <span>Máx: <strong style={{color:"var(--g)"}}>R${sel.high.toFixed(2)}</strong></span>
                    <span>Mín: <strong style={{color:"var(--red)"}}>R${sel.low?.toFixed(2)}</strong></span>
                    {sel.volume&&<span>Vol: <strong>{(sel.volume/1e6).toFixed(1)}M</strong></span>}
                  </div>}
                </div>
                <div className="card">
                  <div className="clabel" style={{marginBottom:11}}>Realizar Operação</div>
                  <div className="fg">
                    <label className="ilabel">Quantidade</label>
                    <input className="inp" type="number" min={1} value={qty} onChange={e=>setQty(Math.max(1,parseInt(e.target.value)||1))}/>
                  </div>
                  <div style={{padding:"9px 12px",background:"var(--bg2)",borderRadius:8,marginBottom:11,fontSize:13}}>
                    <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:"var(--muted)"}}>Total</span><strong>{fmt(sel.price*qty)}</strong></div>
                    {portfolio[sel.ticker]&&(
                      <div style={{display:"flex",justifyContent:"space-between",marginTop:5,alignItems:"center"}}>
                        <span style={{color:"var(--muted)",display:"flex",alignItems:"center",gap:4}}>
                          PM
                          <button onClick={()=>setInfo("pm")} style={{background:"rgba(77,158,255,.15)",border:"none",color:"var(--blue)",fontSize:9,fontWeight:700,cursor:"pointer",borderRadius:99,padding:"1px 5px"}}>i</button>
                        </span>
                        <strong>{fmt(portfolio[sel.ticker].avgPrice)} · {portfolio[sel.ticker].qty} ações</strong>
                      </div>
                    )}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <button className="btn bprimary" onClick={()=>buyStock(sel.ticker,qty)}>🟢 Comprar</button>
                    <button className="btn bred" onClick={()=>sellStock(sel.ticker,qty)} disabled={!portfolio[sel.ticker]}>🔴 Vender</button>
                  </div>
                </div>
              </div>
            ):(
              <div className="card" style={{textAlign:"center",padding:"56px 24px"}}>
                <div style={{fontSize:44,marginBottom:12}}>📈</div>
                <div style={{fontWeight:600,marginBottom:5}}>Selecione um ativo</div>
                <div style={{color:"var(--muted)",fontSize:13}}>Clique em qualquer ação para operar.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab==="cart"&&(
        !Object.keys(portfolio).length?(
          <div className="card" style={{textAlign:"center",padding:56}}>
            <div style={{fontSize:44,marginBottom:12}}>💼</div>
            <div style={{fontWeight:600,marginBottom:5}}>Carteira vazia</div>
            <div style={{color:"var(--muted)"}}>Compre ações no Mercado para começar.</div>
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {Object.entries(portfolio).map(([t,pos])=>(
              <PositionRow key={t} ticker={t} pos={pos} stock={stocks.find(s=>s.ticker===t)} sellStock={sellStock} setInfo={setInfo}/>
            ))}
          </div>
        )
      )}
    </div>
  );
}
