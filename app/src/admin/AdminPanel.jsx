// Painel administrativo: visão geral, gestão da Academy, eventos e usuários.
import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { uid, toEmbed } from "../lib/format";
import { Modal } from "../components/Modal";
import { Toast } from "../components/Toast";

export function AdminPanel({courses,setCourses,events,setEvents,onExit}){
  const[page,setPage]=useState("overview");
  const[toast,setToast]=useState(null);
  return(
    <><div className="mesh"/>
    {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
    <div className="admin-sb">
      <div style={{padding:"20px 17px",borderBottom:"1px solid var(--b)"}}>
        <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".14em",color:"var(--muted)",marginBottom:3}}>FinQuest</div>
        <div className="syne" style={{fontSize:17,fontWeight:800,color:"var(--gold)"}}>Painel Admin</div>
      </div>
      <nav style={{flex:1,padding:"11px 9px",display:"flex",flexDirection:"column",gap:1}}>
        {[["📊","Visão Geral","overview"],["🎓","Academy","academy"],["🌪️","Eventos","events"],["👥","Usuários","users"]].map(([icon,label,key])=>(
          <button key={key} className={`anav${page===key?" act":""}`} onClick={()=>setPage(key)}>
            <span style={{fontSize:16}}>{icon}</span>{label}
          </button>
        ))}
      </nav>
      <div style={{padding:13,borderTop:"1px solid var(--b)"}}>
        <button className="btn boutline bsm" style={{width:"100%"}} onClick={onExit}>← Sair do admin</button>
      </div>
    </div>
    <div style={{marginLeft:216,padding:34,maxWidth:1060,position:"relative",zIndex:1}}>
      {page==="overview"&&<AdminOverview courses={courses} events={events}/>}
      {page==="academy" &&<AdminAcademy  courses={courses} setCourses={setCourses} showToast={setToast}/>}
      {page==="events"  &&<AdminEvents   events={events} setEvents={setEvents} showToast={setToast}/>}
      {page==="users"   &&<AdminUsers/>}
    </div>
    </>
  );
}

function AdminOverview({courses,events}){
  const tm=courses.reduce((s,c)=>s+c.modules.length,0);
  const tb=courses.reduce((s,c)=>s+c.modules.reduce((ms,m)=>ms+m.blocks.length,0),0);
  const[userCount,setUserCount]=useState("...");
  useEffect(()=>{
    supabase.from("profiles").select("id",{count:"exact",head:true}).then(({count})=>setUserCount(count??0));
  },[]);
  return(
    <div>
      <div style={{marginBottom:28}}><div className="syne" style={{fontSize:24,fontWeight:800,marginBottom:3}}>Visão Geral</div><div style={{fontSize:13,color:"var(--muted)"}}>Estatísticas da plataforma</div></div>
      <div className="g4" style={{marginBottom:26}}>
        {[["👥",userCount,"Usuários"],["🎓",courses.length,"Cursos"],["📚",tm,"Módulos"],["🌪️",events.length,"Eventos"]].map(([icon,val,l])=>(
          <div key={l} className="card" style={{textAlign:"center"}}>
            <div style={{fontSize:26,marginBottom:8}}>{icon}</div>
            <div className="syne" style={{fontSize:26,fontWeight:800,color:"var(--gold)"}}>{val}</div>
            <div style={{fontSize:11,color:"var(--muted)",marginTop:3}}>{l}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="clabel" style={{marginBottom:13}}>Cursos</div>
        {courses.map(c=>(
          <div key={c.id} style={{display:"flex",alignItems:"center",gap:11,padding:"9px 13px",background:"var(--bg2)",borderRadius:9,marginBottom:7}}>
            <span style={{fontSize:20}}>{c.icon}</span>
            <div style={{flex:1}}><div style={{fontWeight:600}}>{c.title}</div><div style={{fontSize:11,color:"var(--muted)"}}>{c.modules.length} módulos</div></div>
            <span className={`badge ${c.level==="Iniciante"?"bg":c.level==="Intermediário"?"bb":"br"}`}>{c.level}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminAcademy({courses,setCourses,showToast}){
  const[sc,setSc]=useState(null);const[sm,setSm]=useState(null);
  const[editBlock,setEditBlock]=useState(null);const[nbt,setNbt]=useState("text");
  const[showNC,setShowNC]=useState(false);
  const[nd,setNd]=useState({title:"",icon:"📚",level:"Iniciante",duration:"1h",color:"#00d68f"});
  const course=courses.find(c=>c.id===sc);const mod=course?.modules.find(m=>m.id===sm);

  function addCourse(){if(!nd.title.trim()) return;setCourses(cs=>[...cs,{...nd,id:"c"+uid(),modules:[]}]);setShowNC(false);setNd({title:"",icon:"📚",level:"Iniciante",duration:"1h",color:"#00d68f"});showToast("Curso criado!");}
  function delCourse(id){setCourses(cs=>cs.filter(c=>c.id!==id));setSc(null);setSm(null);showToast("Curso removido.");}
  function addMod(cId){const m={id:"m"+uid(),title:"Novo módulo",blocks:[]};setCourses(cs=>cs.map(c=>c.id!==cId?c:{...c,modules:[...c.modules,m]}));showToast("Módulo adicionado!");}
  function delMod(cId,mId){setCourses(cs=>cs.map(c=>c.id!==cId?c:{...c,modules:c.modules.filter(m=>m.id!==mId)}));setSm(null);showToast("Módulo removido.");}
  function updModTitle(cId,mId,title){setCourses(cs=>cs.map(c=>c.id!==cId?c:{...c,modules:c.modules.map(m=>m.id!==mId?m:{...m,title})}));}
  function saveBlock(bd){
    const newId = "b" + uid();
    setCourses(cs => cs.map(c => {
      if(c.id !== sc) return c;
      const newMods = c.modules.map(m => {
        if(m.id !== sm) return m;
        if(editBlock === "new") return { ...m, blocks: [...m.blocks, { ...bd, id: newId }] };
        return { ...m, blocks: m.blocks.map(b => b.id === bd.id ? bd : b) };
      });
      return { ...c, modules: newMods };
    }));
    setEditBlock(null);
    showToast("Bloco salvo!");
  }
  function delBlock(cId,mId,bId){setCourses(cs=>cs.map(c=>c.id!==cId?c:{...c,modules:c.modules.map(m=>m.id!==mId?m:{...m,blocks:m.blocks.filter(b=>b.id!==bId)})}));showToast("Bloco removido.");}

  return(
    <div>
      {editBlock&&<BlockEditor block={editBlock==="new"?{type:nbt,content:"",url:"",caption:"",questions:[]}:editBlock} isNew={editBlock==="new"} onSave={saveBlock} onClose={()=>setEditBlock(null)}/>}
      <Modal open={showNC} onClose={()=>setShowNC(false)} title="Novo Curso" width={440}>
        {[["Título","title","text"],["Emoji","icon","text"],["Duração","duration","text"]].map(([l,k,t])=>(
          <div key={k} className="fg"><label className="ilabel">{l}</label><input className="inp" type={t} value={nd[k]} onChange={e=>setNd(p=>({...p,[k]:e.target.value}))}/></div>
        ))}
        <div className="fg"><label className="ilabel">Nível</label>
          <select className="inp" value={nd.level} onChange={e=>setNd(p=>({...p,level:e.target.value}))}>
            {["Iniciante","Intermediário","Avançado"].map(l=><option key={l}>{l}</option>)}
          </select>
        </div>
        <div style={{display:"flex",gap:8}}><button className="btn bprimary" style={{flex:1}} onClick={addCourse}>Criar</button><button className="btn boutline" onClick={()=>setShowNC(false)}>Cancelar</button></div>
      </Modal>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:26}}>
        <div><div className="syne" style={{fontSize:22,fontWeight:800,marginBottom:3}}>Gerenciar Academy</div><div style={{fontSize:13,color:"var(--muted)"}}>Cursos, módulos e blocos</div></div>
        <button className="btn bprimary bsm" onClick={()=>setShowNC(true)}>+ Novo Curso</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"210px 210px 1fr",gap:16}}>
        <div>
          <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:"var(--muted)",marginBottom:9}}>Cursos</div>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {courses.map(c=>(
              <div key={c.id} style={{display:"flex",alignItems:"center",gap:7,padding:"8px 11px",borderRadius:8,background:sc===c.id?"rgba(245,200,66,.1)":"var(--sf)",border:`1px solid ${sc===c.id?"rgba(245,200,66,.3)":"var(--b)"}`,cursor:"pointer"}} onClick={()=>{setSc(c.id);setSm(null);}}>
                <span style={{fontSize:15}}>{c.icon}</span>
                <div style={{flex:1,minWidth:0}}><div style={{fontSize:12.5,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.title}</div><div style={{fontSize:10,color:"var(--muted)"}}>{c.modules.length} módulos</div></div>
                <button onClick={e=>{e.stopPropagation();delCourse(c.id);}} style={{background:"rgba(255,82,82,.15)",border:"none",color:"var(--red)",borderRadius:4,cursor:"pointer",padding:"2px 6px",fontSize:10}}>✕</button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
            <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:"var(--muted)"}}>Módulos</div>
            {sc&&<button className="btn bghost bxs" onClick={()=>addMod(sc)}>+ Add</button>}
          </div>
          {!sc?<div style={{color:"var(--muted)",fontSize:12}}>Selecione um curso.</div>:(
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {course?.modules.map(m=>(
                <div key={m.id} style={{padding:"8px 11px",borderRadius:8,background:sm===m.id?"rgba(77,158,255,.1)":"var(--sf)",border:`1px solid ${sm===m.id?"rgba(77,158,255,.3)":"var(--b)"}`,cursor:"pointer"}} onClick={()=>setSm(m.id)}>
                  <div style={{display:"flex",justifyContent:"space-between",gap:4}}>
                    <div style={{fontSize:12.5,fontWeight:600}}>{m.title}</div>
                    <button onClick={e=>{e.stopPropagation();delMod(sc,m.id);}} style={{background:"rgba(255,82,82,.15)",border:"none",color:"var(--red)",borderRadius:4,cursor:"pointer",padding:"2px 5px",fontSize:10}}>✕</button>
                  </div>
                  <div style={{fontSize:10,color:"var(--muted)",marginTop:2}}>{m.blocks.length} bloco(s)</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
            <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:"var(--muted)"}}>{mod?mod.title:"Blocos"}</div>
            {sm&&<div style={{display:"flex",gap:5}}>
              <select className="inp" style={{padding:"4px 8px",fontSize:11,width:100}} value={nbt} onChange={e=>setNbt(e.target.value)}>
                <option value="text">📄 Texto</option><option value="video">🎥 Vídeo</option>
                <option value="image">🖼️ Imagem</option><option value="quiz">📝 Quiz</option>
              </select>
              <button className="btn bprimary bxs" onClick={()=>setEditBlock("new")}>+ Bloco</button>
            </div>}
          </div>
          {!sm?<div style={{color:"var(--muted)",fontSize:12}}>Selecione um módulo.</div>:(
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              <input className="inp" style={{fontSize:12.5,marginBottom:3}} value={mod?.title||""} onChange={e=>updModTitle(sc,sm,e.target.value)} placeholder="Título do módulo"/>
              {mod?.blocks.length===0&&<div className="card" style={{textAlign:"center",padding:"30px 16px",color:"var(--muted)"}}><div style={{fontSize:24,marginBottom:7}}>📦</div><div>Nenhum bloco.</div></div>}
              {mod?.blocks.map(block=>(
                <div key={block.id} className="card" style={{padding:"11px 14px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span className={`blktag bt-${block.type}`}>{block.type==="text"?"📄 Texto":block.type==="video"?"🎥 Vídeo":block.type==="image"?"🖼️ Imagem":`📝 Quiz(${block.questions?.length||0})`}</span>
                    <div style={{display:"flex",gap:5}}>
                      <button className="btn bghost bxs" onClick={()=>setEditBlock(block)}>Editar</button>
                      <button className="btn bred bxs" onClick={()=>delBlock(sc,sm,block.id)}>✕</button>
                    </div>
                  </div>
                  {block.type==="text"&&<div style={{fontSize:11,color:"var(--muted)",maxHeight:44,overflow:"hidden",lineHeight:1.4}} dangerouslySetInnerHTML={{__html:block.content}}/>}
                  {(block.type==="video"||block.type==="image")&&<div style={{fontSize:11,color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{block.url||"URL não definida"}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BlockEditor({block,isNew,onSave,onClose}){
  const[d,setD]=useState({...block,questions:block.questions?block.questions.map(q=>({...q,options:[...q.options]})):[]});
  function addQ(){setD(p=>({...p,questions:[...p.questions,{id:uid(),question:"",options:["","","",""],correct:0,explanation:""}]}));}
  function updQ(i,f,v){setD(p=>({...p,questions:p.questions.map((q,qi)=>qi!==i?q:{...q,[f]:v})}));}
  function updOpt(qi,oi,v){setD(p=>({...p,questions:p.questions.map((q,i)=>i!==qi?q:{...q,options:q.options.map((o,j)=>j!==oi?o:v)})}));}
  function delQ(i){setD(p=>({...p,questions:p.questions.filter((_,qi)=>qi!==i)}));}
  const titles={text:"Texto",video:"Vídeo",image:"Imagem",quiz:"Quiz"};
  return(
    <Modal open={true} onClose={onClose} title={(isNew?"Novo":"Editar")+" bloco: "+titles[d.type]} width={660}>
      {d.type==="text"&&(
        <div>
          <label className="ilabel">HTML do conteúdo</label>
          <textarea className="ta" style={{minHeight:170,fontFamily:"monospace",fontSize:12}} value={d.content} onChange={e=>setD(p=>({...p,content:e.target.value}))} placeholder="<h2>Título</h2><p>Texto...</p>"/>
          <div style={{fontSize:11,color:"var(--muted)",marginTop:5}}>Tags: &lt;h2&gt; &lt;h3&gt; &lt;p&gt; &lt;ul&gt;&lt;li&gt; &lt;strong&gt; &lt;em&gt; &lt;blockquote&gt;</div>
          {d.content&&<div style={{marginTop:13}}><div className="ilabel" style={{marginBottom:5}}>Prévia</div><div className="card rich" dangerouslySetInnerHTML={{__html:d.content}}/></div>}
        </div>
      )}
      {d.type==="video"&&(
        <div>
          <div className="fg"><label className="ilabel">URL YouTube</label><input className="inp" value={d.url} onChange={e=>setD(p=>({...p,url:e.target.value}))} placeholder="https://youtube.com/watch?v=..."/><div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>URL normal, convertida automaticamente para embed.</div></div>
          <div className="fg"><label className="ilabel">Legenda (opcional)</label><input className="inp" value={d.caption} onChange={e=>setD(p=>({...p,caption:e.target.value}))}/></div>
          {d.url&&toEmbed(d.url)&&<div style={{borderRadius:10,overflow:"hidden"}}><iframe src={toEmbed(d.url)} width="100%" height={190} frameBorder="0" allowFullScreen title="preview"/></div>}
        </div>
      )}
      {d.type==="image"&&(
        <div>
          <div className="fg"><label className="ilabel">URL da imagem</label><input className="inp" value={d.url} onChange={e=>setD(p=>({...p,url:e.target.value}))} placeholder="https://..."/></div>
          <div className="fg"><label className="ilabel">Legenda</label><input className="inp" value={d.caption} onChange={e=>setD(p=>({...p,caption:e.target.value}))}/></div>
          {d.url&&<div style={{borderRadius:10,overflow:"hidden",maxHeight:170}}><img src={d.url} alt="preview" style={{width:"100%",objectFit:"cover",display:"block"}} onError={e=>e.target.style.display="none"}/></div>}
        </div>
      )}
      {d.type==="quiz"&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:13}}>
            <span style={{fontWeight:600}}>{d.questions.length} pergunta(s)</span>
            <button className="btn bghost bsm" onClick={addQ}>+ Pergunta</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:16,maxHeight:400,overflowY:"auto"}}>
            {d.questions.map((q,qi)=>(
              <div key={q.id} style={{padding:15,background:"var(--bg2)",borderRadius:10,border:"1px solid var(--b)"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:9}}>
                  <span style={{color:"var(--gold)",fontWeight:700,fontSize:13}}>Pergunta {qi+1}</span>
                  <button onClick={()=>delQ(qi)} style={{background:"rgba(255,82,82,.15)",border:"none",color:"var(--red)",borderRadius:4,cursor:"pointer",padding:"2px 8px",fontSize:11}}>Remover</button>
                </div>
                <div className="fg"><label className="ilabel">Enunciado</label><input className="inp" value={q.question} onChange={e=>updQ(qi,"question",e.target.value)} placeholder="Digite a pergunta..."/></div>
                <div style={{marginBottom:9}}>
                  <label className="ilabel" style={{marginBottom:6}}>Opções (marque a correta)</label>
                  {q.options.map((opt,oi)=>(
                    <div key={oi} style={{display:"flex",gap:7,marginBottom:5,alignItems:"center"}}>
                      <input type="radio" name={"c"+qi} checked={q.correct===oi} onChange={()=>updQ(qi,"correct",oi)} style={{accentColor:"var(--g)",flexShrink:0}}/>
                      <input className="inp" style={{fontSize:12.5,padding:"7px 11px"}} value={opt} onChange={e=>updOpt(qi,oi,e.target.value)} placeholder={`Opção ${String.fromCharCode(65+oi)}`}/>
                    </div>
                  ))}
                </div>
                <div className="fg"><label className="ilabel">Explicação da resposta correta</label><textarea className="ta" style={{minHeight:52,fontSize:12.5}} value={q.explanation} onChange={e=>updQ(qi,"explanation",e.target.value)} placeholder="Por que a resposta está correta..."/></div>
              </div>
            ))}
            {d.questions.length===0&&<div style={{textAlign:"center",padding:"24px 0",color:"var(--muted)",fontSize:13}}>Clique em "+ Pergunta" para adicionar.</div>}
          </div>
        </div>
      )}
      <div style={{display:"flex",gap:8,marginTop:20}}>
        <button className="btn bprimary" style={{flex:1}} onClick={()=>onSave(d)}>Salvar bloco</button>
        <button className="btn boutline" onClick={onClose}>Cancelar</button>
      </div>
    </Modal>
  );
}

function AdminEvents({events,setEvents,showToast}){
  const blank={title:"",desc:"",emoji:"📊",impact:"bullish"};
  const[showNew,setShowNew]=useState(false);const[editing,setEditing]=useState(null);const[d,setD]=useState(blank);
  function save(){if(!d.title.trim()) return;if(editing){setEvents(es=>es.map(e=>e.id===editing?{...d,id:editing}:e));}else{setEvents(es=>[...es,{...d,id:"e"+uid()}]);}showToast(editing?"Evento atualizado!":"Evento criado!");setShowNew(false);setEditing(null);setD(blank);}
  return(
    <div>
      <Modal open={showNew} onClose={()=>{setShowNew(false);setEditing(null);setD(blank);}} title={editing?"Editar Evento":"Novo Evento"} width={460}>
        <div className="fg"><label className="ilabel">Emoji</label><input className="inp" value={d.emoji} onChange={e=>setD(p=>({...p,emoji:e.target.value}))} style={{fontSize:22}}/></div>
        <div className="fg"><label className="ilabel">Título</label><input className="inp" value={d.title} onChange={e=>setD(p=>({...p,title:e.target.value}))}/></div>
        <div className="fg"><label className="ilabel">Descrição</label><textarea className="ta" style={{minHeight:64}} value={d.desc} onChange={e=>setD(p=>({...p,desc:e.target.value}))}/></div>
        <div className="fg"><label className="ilabel">Impacto</label>
          <select className="inp" value={d.impact} onChange={e=>setD(p=>({...p,impact:e.target.value}))}>
            <option value="bullish">📈 Alta (Bullish)</option><option value="bearish">📉 Baixa (Bearish)</option>
          </select>
        </div>
        <div style={{display:"flex",gap:8}}><button className="btn bprimary" style={{flex:1}} onClick={save}>{editing?"Salvar":"Criar"}</button><button className="btn boutline" onClick={()=>{setShowNew(false);setEditing(null);setD(blank);}}>Cancelar</button></div>
      </Modal>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:26}}>
        <div><div className="syne" style={{fontSize:22,fontWeight:800,marginBottom:3}}>Eventos</div><div style={{fontSize:13,color:"var(--muted)"}}>Crie eventos que afetam os preços do simulador</div></div>
        <button className="btn bprimary bsm" onClick={()=>{setD(blank);setShowNew(true);}}>+ Novo</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {events.map(ev=>(
          <div key={ev.id} className="card" style={{display:"flex",alignItems:"center",gap:13,borderColor:ev.impact==="bullish"?"rgba(0,214,143,.2)":"rgba(255,82,82,.2)"}}>
            <span style={{fontSize:32}}>{ev.emoji}</span>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:7,marginBottom:3}}><div className="syne" style={{fontWeight:700}}>{ev.title}</div><span className={`badge ${ev.impact==="bullish"?"bg":"br"}`}>{ev.impact==="bullish"?"Alta":"Baixa"}</span></div>
              <div style={{fontSize:13,color:"var(--muted)"}}>{ev.desc}</div>
            </div>
            <div style={{display:"flex",gap:6}}>
              <button className="btn bghost bsm" onClick={()=>{setD({title:ev.title,desc:ev.desc,emoji:ev.emoji,impact:ev.impact});setEditing(ev.id);setShowNew(true);}}>Editar</button>
              <button className="btn bred bsm" onClick={()=>{setEvents(es=>es.filter(e=>e.id!==ev.id));showToast("Removido.");}}>Remover</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const ADMIN_SECRET="fq-admin-secret-2025";

function AdminUsers(){
  const[users,setUsers]=useState([]);
  const[loading,setLoading]=useState(true);
  const[err,setErr]=useState("");
  const[editId,setEditId]=useState(null);
  const[editName,setEditName]=useState("");
  const[saving,setSaving]=useState(false);
  const LVL=["","Iniciante","Investidor","Estrategista","Trader","Mestre"];
  function lvlName(xp){return xp<500?LVL[1]:xp<1500?LVL[2]:xp<3000?LVL[3]:xp<5000?LVL[4]:LVL[5];}
  function lvlBadge(xp){return xp<500?"bg":xp<1500?"bb":xp<3000?"bb":"br";}

  function fetchUsers(){
    setLoading(true);setErr("");
    supabase.from("profiles").select("*").order("created_at",{ascending:false})
      .then(({data,error})=>{
        if(error){setErr("Erro: "+error.message);}
        else if(data) setUsers(data);
        setLoading(false);
      });
  }
  useEffect(()=>{fetchUsers();},[]);

  async function saveName(userId){
    if(!editName.trim()){setEditId(null);return;}
    setSaving(true);
    try{
      const r=await fetch("/api/admin-update",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+ADMIN_SECRET},
        body:JSON.stringify({userId,updates:{name:editName.trim()}}),
      });
      if(r.ok){
        setUsers(us=>us.map(u=>u.id===userId?{...u,name:editName.trim()}:u));
        setEditId(null);
      } else {
        const j=await r.json();
        setErr(j.error||"Erro ao salvar");
      }
    } catch(e){setErr("Erro de rede");}
    setSaving(false);
  }

  const totalXp=users.reduce((s,u)=>s+u.xp,0);
  const avgXp=users.length?Math.round(totalXp/users.length):0;

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:26}}>
        <div><div className="syne" style={{fontSize:22,fontWeight:800,marginBottom:3}}>Usuários</div><div style={{fontSize:13,color:"var(--muted)"}}>Usuários reais cadastrados na plataforma</div></div>
        <button className="btn boutline bsm" onClick={fetchUsers}>↻ Atualizar</button>
      </div>
      {err&&<div style={{color:"var(--red)",fontSize:13,padding:"10px 14px",background:"rgba(255,82,82,.1)",borderRadius:8,marginBottom:16}}>{err}</div>}
      <div className="g4" style={{marginBottom:20}}>
        {[[users.length,"Cadastros","var(--g)"],[avgXp+" XP","Média XP","var(--gold)"]].map(([v,l,c])=>(
          <div key={l} className="card" style={{textAlign:"center"}}><div className="syne" style={{fontSize:24,fontWeight:800,color:c}}>{v}</div><div style={{fontSize:11,color:"var(--muted)",marginTop:3}}>{l}</div></div>
        ))}
      </div>
      <div className="scroll-x">
      <div className="card" style={{padding:0,overflow:"hidden",minWidth:640}}>
        <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr 100px 70px 110px 60px",padding:"9px 17px",borderBottom:"1px solid var(--b)"}}>
          {["Nome","E-mail","Cadastro","XP","Nível",""].map(h=><div key={h} style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:"var(--muted)"}}>{h}</div>)}
        </div>
        {loading&&<div style={{padding:24,textAlign:"center",color:"var(--muted)",fontSize:13}}>Carregando...</div>}
        {!loading&&users.length===0&&<div style={{padding:24,textAlign:"center",color:"var(--muted)",fontSize:13}}>Nenhum usuário cadastrado ainda.</div>}
        {users.map((u,i)=>(
          <div key={u.id} style={{display:"grid",gridTemplateColumns:"1.4fr 1fr 100px 70px 110px 60px",padding:"11px 17px",borderBottom:i<users.length-1?"1px solid var(--b)":"none",alignItems:"center",gap:4}}>
            {editId===u.id?(
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <input className="inp" value={editName} onChange={e=>setEditName(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter")saveName(u.id);if(e.key==="Escape")setEditId(null);}}
                  style={{fontSize:12,padding:"4px 8px",flex:1}} autoFocus/>
                <button className="btn bprimary" style={{padding:"3px 8px",fontSize:11}} onClick={()=>saveName(u.id)} disabled={saving}>✓</button>
                <button className="btn boutline" style={{padding:"3px 7px",fontSize:11}} onClick={()=>setEditId(null)}>✕</button>
              </div>
            ):(
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div className="avatar" style={{width:26,height:26,fontSize:9,flexShrink:0}}>{(u.name||"?").slice(0,2)}</div>
                <span style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.name}</span>
              </div>
            )}
            <div style={{fontSize:12,color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email||"-"}</div>
            <div style={{fontSize:12,color:"var(--muted)"}}>{new Date(u.created_at).toLocaleDateString("pt-BR")}</div>
            <div style={{fontWeight:600,color:"var(--gold)",fontSize:13}}>{u.xp}</div>
            <span className={`badge ${lvlBadge(u.xp)}`} style={{fontSize:11}}>{lvlName(u.xp)}</span>
            <button className="btn boutline" style={{padding:"3px 8px",fontSize:11,opacity:.7}}
              onClick={()=>{setEditId(u.id);setEditName(u.name||"");}}>✏</button>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
