// Página pública inicial: hero, ticker de cotações e destaques do produto.

export function Landing({onLogin,onSignup,stocks}){
  const tix=[...stocks,...stocks,...stocks];
  return(
    <>
      <div className="mesh"/>
      <div style={{position:"relative",zIndex:1,background:"var(--bg)"}}>
        <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 48px",borderBottom:"1px solid var(--b)",background:"rgba(6,9,15,.9)",backdropFilter:"blur(14px)",position:"sticky",top:0,zIndex:10}}>
          <div className="syne" style={{fontSize:21,fontWeight:800,color:"var(--g)",display:"flex",alignItems:"center",gap:9}}>
            <div className="logomark">FQ</div>FinQuest
          </div>
          <div style={{display:"flex",gap:9}}>
            <button className="btn boutline bsm" onClick={onLogin}>Entrar</button>
            <button className="btn bprimary bsm" onClick={onSignup}>Criar conta grátis</button>
          </div>
        </nav>
        <div className="hero">
          <div className="hglow"/>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"5px 15px",borderRadius:99,background:"rgba(0,214,143,.08)",border:"1px solid rgba(0,214,143,.2)",color:"var(--g)",fontSize:12,fontWeight:700,marginBottom:20}}>
            🚀 Cotações reais B3 · IA tutora · Duelo multiplayer
          </div>
          <h1 className="syne" style={{fontSize:"clamp(36px,5.5vw,70px)",fontWeight:800,lineHeight:1.05,letterSpacing:"-.03em",maxWidth:780}}>
            Aprenda a investir<br/><span style={{color:"var(--g)"}}>sem arriscar</span> seu dinheiro.
          </h1>
          <p style={{fontSize:17,color:"var(--muted)",maxWidth:500,margin:"18px auto 34px",lineHeight:1.65}}>
            Preços reais da B3, cursos interativos, duelo de carteiras e IA tutora exclusiva.
          </p>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
            <button className="btn bprimary" style={{fontSize:16,padding:"13px 32px",borderRadius:10}} onClick={onSignup}>Criar conta grátis</button>
            <button className="btn boutline" style={{fontSize:16,padding:"13px 32px",borderRadius:10}} onClick={onSignup}>Ver simulação →</button>
          </div>
          <div style={{display:"flex",gap:36,marginTop:46,flexWrap:"wrap",justifyContent:"center"}}>
            {[["R$100k","capital fictício"],["Dados reais","via B3"],["IA tutora","por Claude"],["Duelo","multiplayer"]].map(([n,l])=>(
              <div key={n} style={{textAlign:"center"}}>
                <div className="syne" style={{fontSize:22,fontWeight:800,color:"var(--g)"}}>{n}</div>
                <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="ticker-tape">
          <div className="ticker-inner">
            {tix.map((s,i)=>(
              <div key={i} className="tick-item">
                <span style={{fontWeight:700}}>{s.ticker}</span>
                <span style={{color:s.change>=0?"var(--g)":"var(--red)"}}>R${s.price.toFixed(2)} {s.change>=0?"▲":"▼"}{Math.abs(s.change).toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{maxWidth:1160,margin:"0 auto",padding:"70px 40px"}}>
          <div className="syne" style={{fontSize:"clamp(24px,4vw,42px)",fontWeight:800,letterSpacing:"-.02em",marginBottom:42}}>O que torna o FinQuest diferente</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14}}>
            {[["📡","Preços reais","Cotações B3 via Yahoo Finance com ~15min delay"],
              ["🤖","IA Tutora","Tire dúvidas com Claude AI especializado em investimentos"],
              ["⚔️","Modo Duelo","Compita com outros investidores em tempo real"],
              ["📊","Benchmarks","Compare sua carteira com CDI e Ibovespa"],
              ["🎓","Academy","Cursos com vídeo, imagem, texto e quizzes elaborados"],
              ["🎯","Gamificação","XP, níveis e conquistas por cada aprendizado"]
            ].map(([icon,name,desc])=>(
              <div key={name} style={{background:"var(--sf)",border:"1px solid var(--b)",borderRadius:14,padding:22,transition:"all .2s",cursor:"default"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--b2)";e.currentTarget.style.transform="translateY(-4px)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--b)";e.currentTarget.style.transform="";}}>
                <div style={{fontSize:28,marginBottom:11}}>{icon}</div>
                <div className="syne" style={{fontSize:15,fontWeight:700,marginBottom:5}}>{name}</div>
                <div style={{fontSize:12.5,color:"var(--muted)",lineHeight:1.55}}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{textAlign:"center",padding:"56px 40px",borderTop:"1px solid var(--b)"}}>
          <div className="syne" style={{fontSize:"clamp(22px,4vw,40px)",fontWeight:800,marginBottom:14}}>Comece hoje. É grátis.</div>
          <button className="btn bprimary" style={{fontSize:16,padding:"13px 36px"}} onClick={onSignup}>Criar conta agora →</button>
        </div>
        <footer style={{borderTop:"1px solid var(--b)",padding:"16px 48px",display:"flex",justifyContent:"space-between",color:"var(--muted)",fontSize:12}}>
          <span className="syne" style={{fontWeight:800,color:"var(--g)"}}>FinQuest</span>
          <span>© 2026 · Finquest. Não é consultoria financeira.</span>
        </footer>
      </div>
    </>
  );
}
