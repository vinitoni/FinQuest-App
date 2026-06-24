// Tutorial de boas-vindas exibido na primeira sessão do usuário.
import { useState } from "react";

export function OnboardingTutorial({user,onFinish}){
  const firstName=(user?.name||"investidor").split(" ")[0];
  const STEPS=[
    {icon:"👋",accent:"var(--g)",
     title:`Bem-vindo ao FinQuest, ${firstName}!`,
     desc:"Aqui você aprende a investir de verdade, praticando, sem arriscar um centavo do seu dinheiro real. Deixa eu te mostrar como funciona em 30 segundos.",
     chip:null},
    {icon:"📈",accent:"var(--g)",
     title:"R$100 mil pra você investir",
     desc:"Você começa com R$100.000 virtuais pra montar sua carteira com ações reais da B3. Os preços são de mercado: seus ganhos e perdas seguem a bolsa de verdade.",
     chip:"Simulador · risco zero"},
    {icon:"🎓",accent:"var(--blue)",
     title:"Aprenda no seu ritmo",
     desc:"Cursos por níveis, do básico ao avançado. Curto, direto e gamificado: cada módulo concluído te dá XP e faz você subir de nível.",
     chip:"Academy · +150 XP por módulo"},
    {icon:"💚",accent:"var(--g)",
     title:"Finny, sua mentora com IA",
     desc:"Dúvida sobre um investimento? A Finny responde em linguagem simples, na hora. É como ter um consultor financeiro no bolso, 24h por dia.",
     chip:"Finny · IA exclusiva"},
    {icon:"🏆",accent:"var(--gold)",
     title:"Evolua e compita",
     desc:"Ganhe XP, suba no ranking e desafie outros investidores em duelos. Tudo pronto, bora montar sua primeira carteira?",
     chip:"Ranking · Duelos"},
  ];
  const[step,setStep]=useState(0);
  const[dontShow,setDontShow]=useState(true);
  const last=step===STEPS.length-1;
  const s=STEPS[step];

  function close(go){ onFinish(dontShow,go); }

  return(
    <div className="modal-ov" style={{zIndex:700}}>
      <div className="modal-box" style={{width:"100%",maxWidth:440,padding:0,overflow:"hidden"}}>
        {/* topo: progresso + pular */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px 0"}}>
          <div style={{display:"flex",gap:6}}>
            {STEPS.map((_,i)=>(
              <div key={i} style={{height:4,width:i===step?22:8,borderRadius:99,background:i===step?s.accent:i<step?"var(--b2)":"var(--b)",transition:"all .25s"}}/>
            ))}
          </div>
          <button onClick={()=>close(false)} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:12,fontWeight:600}}>Pular</button>
        </div>

        {/* conteúdo do passo */}
        <div key={step} style={{padding:"28px 32px 4px",textAlign:"center",animation:"su .28s ease"}}>
          <div style={{width:74,height:74,borderRadius:20,margin:"0 auto 20px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,background:"rgba(0,214,143,.08)",border:`1px solid ${s.accent}33`}}>{s.icon}</div>
          <div className="syne" style={{fontSize:22,fontWeight:800,marginBottom:11,lineHeight:1.2}}>{s.title}</div>
          <div style={{fontSize:14.5,color:"#b8cfe0",lineHeight:1.7,marginBottom:s.chip?16:8}}>{s.desc}</div>
          {s.chip&&<div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 13px",borderRadius:99,fontSize:12,fontWeight:700,background:"rgba(0,214,143,.1)",color:s.accent,border:`1px solid ${s.accent}33`}}>{s.chip}</div>}
        </div>

        {/* rodapé */}
        <div style={{padding:"22px 32px 24px"}}>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            {step>0&&<button className="btn boutline" style={{flex:"0 0 auto"}} onClick={()=>setStep(st=>st-1)}>← Voltar</button>}
            <button className="btn bprimary" style={{flex:1}} onClick={()=>last?close("/simulador"):setStep(st=>st+1)}>
              {last?"Começar a investir →":"Próximo"}
            </button>
          </div>
          <label style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center",marginTop:16,cursor:"pointer",userSelect:"none"}}>
            <input type="checkbox" checked={dontShow} onChange={e=>setDontShow(e.target.checked)} style={{width:15,height:15,accentColor:"var(--g)",cursor:"pointer"}}/>
            <span style={{fontSize:12.5,color:"var(--muted)"}}>Não mostrar novamente</span>
          </label>
        </div>
      </div>
    </div>
  );
}
