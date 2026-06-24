// Radar de mercado: notícias financeiras e watchlist de ativos.
import { useState, useEffect, useRef } from "react";

export function NewsPage({stocks,apiStatus}){
  const[tab,setTab]=useState("news");
  const[news,setNews]=useState([]);
  const[newsLoading,setNewsLoading]=useState(false);
  const[lastFetch,setLastFetch]=useState(null);
  const loadingRef=useRef(false);

  const watchedTickers=["PETR4","VALE3","WEGE3","ITUB4","ABEV3"];

  const sentimentStyle={
    bullish:{border:"rgba(0,214,143,.5)",bg:"rgba(0,214,143,.12)",color:"#00D68F",label:"Alta",icon:"↑"},
    bearish:{border:"rgba(255,82,82,.5)",bg:"rgba(255,82,82,.12)",color:"#FF5252",label:"Baixa",icon:"↓"},
    neutral:{border:"rgba(139,148,158,.3)",bg:"rgba(139,148,158,.1)",color:"#8B949E",label:"Neutro",icon:"→"},
  };
  const catColor={
    "Dividendos":"#F5C842","Macro":"#4D9EFF","Câmbio":"#FF9F43",
    "FIIs":"#8B5CF6","Global":"#06B6D4","Resultados":"#EC4899",
    "Bolsa":"#00D68F","Mercados":"#8B949E",
  };

  function relTime(iso){
    const diff=(Date.now()-new Date(iso))/1000;
    if(diff<60) return "agora";
    if(diff<3600) return Math.floor(diff/60)+"min atrás";
    if(diff<86400) return Math.floor(diff/3600)+"h atrás";
    return Math.floor(diff/86400)+"d atrás";
  }

  async function loadNews(){
    if(loadingRef.current) return;
    loadingRef.current=true;
    setNewsLoading(true);
    try{
      const r=await fetch("/api/news");
      if(!r.ok) throw new Error("HTTP "+r.status);
      const d=await r.json();
      setNews(d.articles||[]);
      setLastFetch(new Date());
    }catch(e){
      // mantém notícias existentes
    }finally{
      loadingRef.current=false;
      setNewsLoading(false);
    }
  }

  useEffect(()=>{
    loadNews();
    const id=setInterval(loadNews,15*60*1000);
    return()=>clearInterval(id);
  },[]);

  return(
    <div className="page">
      <div className="topbar">
        <div>
          <div className="ptitle syne">Radar de Mercado</div>
          <div className="psub">Notícias financeiras em tempo real</div>
        </div>
        {tab==="news"&&(
          <button className="btn bghost bsm" onClick={loadNews} disabled={newsLoading}
            style={{display:"flex",alignItems:"center",gap:6,minWidth:110}}>
            <span style={{fontSize:15,display:"inline-block",
              animation:newsLoading?"spin 0.9s linear infinite":undefined}}>↻</span>
            {newsLoading?"Atualizando...":"Atualizar"}
          </button>
        )}
      </div>

      <div className="tabs" style={{marginBottom:22,width:"fit-content"}}>
        {[["news","📰 Notícias"],["watch","⭐ Watchlist"]].map(([k,l])=>(
          <button key={k} className={"tab"+(tab===k?" act":"")} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {tab==="news"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* skeleton */}
          {newsLoading&&news.length===0&&[1,2,3,4].map(i=>(
            <div key={i} className="card" style={{padding:0,overflow:"hidden"}}>
              {i===1&&<div style={{height:190,background:"rgba(255,255,255,.04)"}}/>}
              <div style={{padding:"14px 18px",display:"flex",flexDirection:"column",gap:8}}>
                <div style={{height:11,borderRadius:5,background:"rgba(255,255,255,.05)",width:"25%"}}/>
                <div style={{height:14,borderRadius:5,background:"rgba(255,255,255,.06)",width:"85%"}}/>
                <div style={{height:12,borderRadius:5,background:"rgba(255,255,255,.04)",width:"60%"}}/>
              </div>
            </div>
          ))}

          {!newsLoading&&news.length===0&&(
            <div className="card" style={{textAlign:"center",padding:"44px 24px"}}>
              <div style={{fontSize:34,marginBottom:12}}>📡</div>
              <div style={{fontWeight:700,fontSize:15,marginBottom:8}}>Nenhuma notícia carregada</div>
              <div style={{color:"var(--muted)",fontSize:13,marginBottom:18}}>Verifique a conexão e tente novamente</div>
              <button className="btn bghost bsm" onClick={loadNews}>Tentar novamente</button>
            </div>
          )}

          {news.map((article,idx)=>{
            const st=sentimentStyle[article.sentiment]||sentimentStyle.neutral;
            const cc=catColor[article.category]||catColor["Mercados"];
            const isHero=idx===0&&!!article.thumbnail;

            if(isHero) return(
              <a key={article.id} href={article.link||"#"} target="_blank" rel="noopener noreferrer"
                style={{textDecoration:"none",color:"inherit"}}>
                <div className="card" style={{padding:0,overflow:"hidden",cursor:"pointer",
                  transition:"border-color .15s",borderColor:"var(--b)"}}>
                  <div style={{position:"relative",height:210,overflow:"hidden"}}>
                    <img src={article.thumbnail} alt={article.title}
                      style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
                      onError={e=>e.target.style.display="none"}/>
                    <div style={{position:"absolute",inset:0,
                      background:"linear-gradient(to top,rgba(6,9,15,.92) 0%,rgba(6,9,15,.3) 60%,transparent 100%)"}}/>
                    <div style={{position:"absolute",bottom:14,left:16,right:16}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                        <span style={{fontSize:10,fontWeight:800,letterSpacing:.06,textTransform:"uppercase",
                          color:cc}}>{article.category}</span>
                        <span style={{fontSize:10,color:"rgba(255,255,255,.45)"}}>·</span>
                        <span style={{fontSize:10,color:"rgba(255,255,255,.5)"}}>{article.source}</span>
                        <span style={{fontSize:10,color:"rgba(255,255,255,.5)",marginLeft:"auto"}}>{relTime(article.pubDate)}</span>
                      </div>
                      <div className="syne" style={{fontSize:18,fontWeight:800,lineHeight:1.25,color:"#fff",
                        overflow:"hidden",display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical"}}>
                        {article.title}
                      </div>
                    </div>
                  </div>
                  <div style={{padding:"10px 16px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:20,
                      background:st.bg,color:st.color}}>{st.icon} {st.label}</span>
                    <span style={{fontSize:12,color:"var(--g)",fontWeight:600}}>Ler matéria →</span>
                  </div>
                </div>
              </a>
            );

            return(
              <a key={article.id} href={article.link||"#"} target="_blank" rel="noopener noreferrer"
                style={{textDecoration:"none",color:"inherit"}}>
                <div className="card" style={{display:"flex",gap:0,padding:0,overflow:"hidden",cursor:"pointer"}}>
                  {/* Thumbnail */}
                  {article.thumbnail&&(
                    <img src={article.thumbnail} alt=""
                      style={{width:120,height:90,objectFit:"cover",flexShrink:0,display:"block"}}
                      onError={e=>{e.target.style.display="none";}}/>
                  )}
                  {/* Content */}
                  <div style={{flex:1,minWidth:0,padding:"12px 16px",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
                    <div>
                      <div style={{fontSize:10,fontWeight:800,letterSpacing:.06,textTransform:"uppercase",
                        color:cc,marginBottom:5}}>{article.category}</div>
                      <div className="syne" style={{fontSize:13.5,fontWeight:700,lineHeight:1.3,
                        overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
                        {article.title}
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:8}}>
                      <span style={{fontSize:11,color:"var(--muted)"}}>
                        {article.source} · {relTime(article.pubDate)}
                      </span>
                      <span style={{fontSize:10.5,fontWeight:700,padding:"2px 8px",borderRadius:20,
                        background:st.bg,color:st.color,whiteSpace:"nowrap"}}>
                        {st.icon} {st.label}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}

          {news.length>0&&lastFetch&&(
            <div style={{textAlign:"center",fontSize:11.5,color:"var(--muted)",padding:"6px 0 2px"}}>
              Atualizado às {lastFetch.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}
            </div>
          )}
        </div>
      )}

      {tab==="watch"&&(
        <div>
          <div style={{fontSize:13,color:"var(--muted)",marginBottom:16}}>
            Acompanhe em tempo real os ativos que você monitora.
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {stocks.filter(s=>watchedTickers.includes(s.ticker)).map(s=>(
              <div key={s.ticker} className="card" style={{display:"flex",alignItems:"center",gap:14,padding:"16px 20px"}}>
                <div style={{width:42,height:42,borderRadius:10,background:"rgba(0,214,143,.08)",
                  border:"1px solid rgba(0,214,143,.15)",display:"flex",alignItems:"center",
                  justifyContent:"center",flexShrink:0}}>
                  <span className="syne" style={{fontSize:11,fontWeight:800,color:"var(--g)"}}>
                    {s.ticker.slice(0,4)}
                  </span>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14}}>{s.name}</div>
                  <div style={{fontSize:12,color:"var(--muted)",marginTop:1}}>{s.sector}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div className="syne" style={{fontSize:16,fontWeight:800}}>R${s.price.toFixed(2)}</div>
                  <span className={"badge "+(s.change>=0?"bg":"br")} style={{marginTop:3,display:"inline-flex"}}>
                    {s.change>=0?"▲":"▼"}{Math.abs(s.change).toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:14,padding:"12px 16px",background:"rgba(77,158,255,.06)",
            border:"1px solid rgba(77,158,255,.15)",borderRadius:10,fontSize:12.5,color:"var(--muted)"}}>
            {apiStatus==="ok"
              ?"✅ Cotações em tempo real via B3 (15min delay)."
              :"📅 Exibindo preços do último fechamento da B3."}
          </div>
        </div>
      )}
    </div>
  );
}
