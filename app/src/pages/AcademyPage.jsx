// Academy: lista de cursos, módulos e o visualizador de módulo com quiz.
import { useState } from "react";
import { toEmbed } from "../lib/format";

export function AcademyPage({courses,progress,completeModule}){
  const[sc,setSc]=useState(null);
  const[sm,setSm]=useState(null);
  const course=courses.find(c=>c.id===sc);
  const mod=course?.modules.find(m=>m.id===sm);

  if(mod&&course) return <ModuleViewer course={course} module={mod} isDone={progress[course.id]?.has(mod.id)||false} onComplete={()=>completeModule(course.id,mod.id)} onBack={()=>setSm(null)}/>;

  if(course) return(
    <div className="page">
      <button className="btn boutline bsm" onClick={()=>setSc(null)} style={{marginBottom:20}}>← Todos os cursos</button>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:26}}>
        <span style={{fontSize:44}}>{course.icon}</span>
        <div>
          <div className="ptitle syne">{course.title}</div>
          <div style={{display:"flex",gap:8,marginTop:6}}>
            <span className={`badge ${course.level==="Iniciante"?"bg":course.level==="Intermediário"?"bb":"br"}`}>{course.level}</span>
            <span className="badge bgold">🕐 {course.duration}</span>
          </div>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        {course.modules.map((m,i)=>{
          const done=progress[course.id]?.has(m.id);
          return(
            <div key={m.id} className="card" style={{display:"flex",alignItems:"center",gap:13,cursor:"pointer",borderColor:done?"rgba(0,214,143,.3)":"var(--b)"}} onClick={()=>setSm(m.id)}>
              <div style={{width:34,height:34,borderRadius:"50%",background:done?"var(--g)":"var(--b)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:done?"#000":"var(--muted)",flexShrink:0}}>{done?"✓":i+1}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:14}}>{m.title}</div>
                <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{m.blocks.map(b=>b.type==="quiz"?`📝 Quiz(${b.questions?.length||0})`:b.type==="video"?"🎥":b.type==="image"?"🖼️":"📄").join(" · ")}</div>
              </div>
              {done&&<span className="badge bg">✓</span>}
              <button className="btn bghost bsm">{done?"Revisar":"Estudar"} →</button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return(
    <div className="page">
      <div className="topbar"><div><div className="ptitle syne">FinQuest Academy</div><div className="psub">Aprenda sobre investimentos no seu ritmo</div></div></div>
      <div className="g3">
        {courses.map(c=>{
          const d=progress[c.id]?.size||0;
          const pct=Math.round((d/c.modules.length)*100);
          return(
            <div key={c.id} className="card" style={{cursor:"pointer",transition:"all .2s",borderColor:d===c.modules.length?"rgba(0,214,143,.3)":"var(--b)"}} onClick={()=>setSc(c.id)}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:11}}>
                <span style={{fontSize:34}}>{c.icon}</span>
                <span className={`badge ${c.level==="Iniciante"?"bg":c.level==="Intermediário"?"bb":"br"}`}>{c.level}</span>
              </div>
              <div className="syne" style={{fontSize:15,fontWeight:700,marginBottom:4,lineHeight:1.3}}>{c.title}</div>
              <div style={{fontSize:11,color:"var(--muted)",marginBottom:13}}>{c.modules.length} módulos · {c.duration}</div>
              <div className="prog" style={{marginBottom:5}}><div className="pfill" style={{width:`${pct}%`,background:c.color}}/></div>
              <div style={{fontSize:11,color:"var(--muted)",display:"flex",justifyContent:"space-between"}}>
                <span>{pct}%</span>
                {d===c.modules.length&&<span style={{color:"var(--g)"}}>✓ Completo</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModuleViewer({course,module,isDone,onComplete,onBack}){
  const[qs,setQs]=useState(null);
  const qBlock=module.blocks.find(b=>b.type==="quiz");
  function startQuiz(){setQs({ans:{},submitted:false});}
  function pick(qi,ai){if(!qs?.submitted) setQs(s=>({...s,ans:{...s.ans,[qi]:ai}}));}
  function submit(){
    if(!qBlock) return;
    const total=qBlock.questions.length;
    if(Object.keys(qs.ans).length<total) return;
    const correct=qBlock.questions.filter((q,i)=>qs.ans[i]===q.correct).length;
    const score=Math.round(correct/total*100);
    setQs(s=>({...s,submitted:true,score,correct,total}));
    if(score>=70&&!isDone) setTimeout(onComplete,400);
  }
  return(
    <div className="page">
      <button className="btn boutline bsm" onClick={onBack} style={{marginBottom:20}}>← Voltar</button>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:26}}>
        <div><div style={{fontSize:11,color:"var(--muted)",marginBottom:3}}>{course.title}</div><div className="ptitle syne">{module.title}</div></div>
        {isDone&&<span className="badge bg" style={{fontSize:12,padding:"5px 13px"}}>✓ Concluído</span>}
      </div>
      <div style={{maxWidth:720,display:"flex",flexDirection:"column",gap:18}}>
        {module.blocks.map(b=>(
          <div key={b.id}>
            {b.type==="text"&&<div className="card rich" dangerouslySetInnerHTML={{__html:b.content}}/>}
            {b.type==="video"&&(
              <div className="card" style={{padding:0,overflow:"hidden"}}>
                <iframe src={toEmbed(b.url)} width="100%" height="330" frameBorder="0" allowFullScreen title={b.caption} style={{display:"block"}}/>
                {b.caption&&<div style={{padding:"9px 17px",fontSize:12,color:"var(--muted)",borderTop:"1px solid var(--b)"}}>🎥 {b.caption}</div>}
              </div>
            )}
            {b.type==="image"&&b.url&&(
              <div className="card" style={{padding:0,overflow:"hidden"}}>
                <img src={b.url} alt={b.caption} style={{width:"100%",maxHeight:380,objectFit:"cover",display:"block"}}/>
                {b.caption&&<div style={{padding:"9px 17px",fontSize:12,color:"var(--muted)",borderTop:"1px solid var(--b)"}}>🖼️ {b.caption}</div>}
              </div>
            )}
            {b.type==="quiz"&&(
              <div className="card" style={{borderColor:"rgba(245,200,66,.2)"}}>
                <div style={{display:"flex",gap:9,alignItems:"center",marginBottom:16}}>
                  <span style={{fontSize:20}}>📝</span>
                  <div><div className="syne" style={{fontSize:17,fontWeight:700}}>Quiz do Módulo</div><div style={{fontSize:12,color:"var(--muted)"}}>{b.questions.length} perguntas · mín. 70% para concluir</div></div>
                </div>
                {!qs?<button className="btn bprimary" onClick={startQuiz}>Iniciar Quiz</button>:(
                  <div>
                    {b.questions.map((q,qi)=>(
                      <div key={q.id} style={{marginBottom:22}}>
                        <div style={{fontWeight:700,fontSize:14,marginBottom:11,lineHeight:1.5}}><span style={{color:"var(--gold)",marginRight:6}}>{qi+1}.</span>{q.question}</div>
                        <div style={{display:"flex",flexDirection:"column",gap:6}}>
                          {q.options.map((opt,ai)=>{
                            const picked=qs.ans[qi]===ai;
                            const sub=qs.submitted;
                            let cls="qopt";
                            if(sub&&ai===q.correct) cls+=" qc";
                            else if(sub&&picked) cls+=" qw";
                            else if(sub&&ai===q.correct) cls+=" qr";
                            return(
                              <button key={ai} className={cls} disabled={sub} onClick={()=>pick(qi,ai)} style={{outline:!sub&&picked?"2px solid var(--blue)":"none"}}>
                                <span style={{opacity:.5,marginRight:8}}>{String.fromCharCode(65+ai)}.</span>{opt}
                              </button>
                            );
                          })}
                        </div>
                        {qs.submitted&&(
                          <div style={{marginTop:7,padding:"8px 12px",borderRadius:8,background:qs.ans[qi]===q.correct?"rgba(0,214,143,.08)":"rgba(255,82,82,.08)",fontSize:13}}>
                            <span style={{fontWeight:700,color:qs.ans[qi]===q.correct?"var(--g)":"var(--red)",marginRight:5}}>{qs.ans[qi]===q.correct?"✓ Correto!":"✗ Incorreto."}</span>
                            <span style={{color:"var(--muted)"}}>{q.explanation}</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {!qs.submitted&&<button className="btn bprimary" onClick={submit} disabled={Object.keys(qs.ans).length<b.questions.length}>Confirmar ({Object.keys(qs.ans).length}/{b.questions.length})</button>}
                    {qs.submitted&&(
                      <div style={{padding:"16px 20px",borderRadius:12,border:`1px solid ${qs.score>=70?"rgba(0,214,143,.4)":"rgba(255,82,82,.4)"}`,background:qs.score>=70?"rgba(0,214,143,.07)":"rgba(255,82,82,.07)",textAlign:"center",marginTop:5}}>
                        <div style={{fontSize:34,marginBottom:7}}>{qs.score>=70?"🎉":"😅"}</div>
                        <div className="syne" style={{fontSize:26,fontWeight:800,color:qs.score>=70?"var(--g)":"var(--red)"}}>{qs.score}%</div>
                        <div style={{color:"var(--muted)",marginTop:3}}>{qs.correct}/{qs.total} corretas</div>
                        {qs.score<70&&<div><div style={{fontSize:12,color:"var(--muted)",margin:"8px 0"}}>Mínimo 70% para avançar.</div><button className="btn boutline bsm" onClick={startQuiz}>Tentar novamente</button></div>}
                        {qs.score>=70&&<div style={{color:"var(--g)",fontSize:12,marginTop:6}}>+150 XP · Módulo concluído!</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
