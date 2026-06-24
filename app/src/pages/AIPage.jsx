// Finny: tutora financeira com IA (chamada real à API Anthropic via /api/ai).
import { useState, useEffect, useRef } from "react";

export function AIPage(){
  const[msgs,setMsgs]=useState([{role:"assistant",content:"Olá! Sou a **Finny**, sua assistente financeira do FinQuest 💚\n\nPode me perguntar sobre **renda fixa, ações, FIIs, ETFs, Tesouro Direto, CDI, SELIC, dividendos, carteiras** e muito mais.\n\nComo posso te ajudar hoje?"}]);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const bottomRef=useRef(null);
  const inputRef=useRef(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs,loading]);

  async function send(){
    const text=input.trim();
    if(!text||loading) return;
    setInput("");
    const newMsgs=[...msgs,{role:"user",content:text}];
    setMsgs(newMsgs);
    setLoading(true);
    try{
      const payload={
        model:"claude-sonnet-4-6",
        max_tokens:1024,
        system:`Você é a Finny, assistente financeira inteligente do FinQuest, plataforma brasileira de educação financeira gamificada.

Personalidade: direta, acolhedora e encorajadora. Faz o usuário se sentir capaz, não intimidado. Sem jargão de guru.

Especialidades: renda fixa (Tesouro Direto, CDB, LCI, LCA, poupança), ações (B3), FIIs, ETFs, CDI, SELIC, IPCA, dividendos, carteiras diversificadas, juros compostos.

Regras:
- Responda sempre em português brasileiro
- Use exemplos com valores em R$
- Formate com **negrito** para termos importantes e conceitos-chave
- Seja concisa, prefira respostas diretas e objetivas
- Nunca recomende ativos específicos para comprar ou vender
- Lembre que investimento real exige estudo e análise do perfil de risco
- Se perguntarem algo fora de finanças, redirecione gentilmente`,
        messages:newMsgs.map(m=>({role:m.role,content:m.content}))
      };
      const res=await fetch("/api/ai",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify(payload)
      });
      const data=await res.json();
      if(data.error) throw new Error(data.error.message);
      const reply=data.content?.map(c=>c.text||"").join("")||"Desculpe, tente novamente.";
      setMsgs(p=>[...p,{role:"assistant",content:reply}]);
    }catch(e){
      setMsgs(p=>[...p,{role:"assistant",content:"⚠️ Erro ao conectar à IA: "+e.message+". Verifique sua conexão."}]);
    }finally{setLoading(false);}
  }

  function render(txt){
    return txt.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br/>");
  }

  const sugs=["O que é Tesouro Direto?","Como funciona o CDI?","O que são FIIs?","Como montar carteira diversificada?","Diferença entre ações ON e PN?","O que é taxa SELIC?"];

  return(
    <div className="page">
      <div className="topbar">
        <div>
          <div className="ptitle syne">💚 Finny</div>
          <div className="psub">Sua assistente financeira inteligente</div>
        </div>
        <span className="badge bg" style={{fontSize:12,padding:"5px 13px"}}><span className="live" style={{marginRight:5}}/>Online</span>
      </div>

      {msgs.length<=1&&(
        <div style={{marginBottom:18}}>
          <div style={{fontSize:12,color:"var(--muted)",marginBottom:9}}>💡 Sugestões para começar</div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {sugs.map(s=>(
              <button key={s} className="btn boutline bsm" onClick={()=>setInput(s)} style={{fontSize:12}}>{s}</button>
            ))}
          </div>
        </div>
      )}

      <div className="chat-wrap">
        <div className="chat-msgs">
          {msgs.map((m,i)=>(
            <div key={i} className={`msg ${m.role==="user"?"msg-u":"msg-a"}`} dangerouslySetInnerHTML={{__html:render(m.content)}}/>
          ))}
          {loading&&<div className="msg msg-a"><div className="typing"><span/><span/><span/></div></div>}
          <div ref={bottomRef}/>
        </div>
        <div className="chat-inp-row">
          <input ref={inputRef} className="inp" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Pergunte sobre investimentos..." style={{flex:1}}/>
          <button className="btn bprimary" onClick={send} disabled={!input.trim()||loading}>
            {loading?<span className="spinner"/>:"Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}
