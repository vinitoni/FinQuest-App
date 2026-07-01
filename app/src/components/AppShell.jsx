// Layout autenticado: sidebar de navegação (desktop) + barra inferior (mobile) + render da página atual conforme a rota.
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DashPage } from "../pages/DashPage";
import { AcademyPage } from "../pages/AcademyPage";
import { CalcPage } from "../pages/CalcPage";
import { SimPage } from "../pages/SimPage";
import { NewsPage } from "../pages/NewsPage";
import { DuelPage } from "../pages/DuelPage";
import { RankPage } from "../pages/RankPage";
import { AIPage } from "../pages/AIPage";
import { ProfilePage } from "../pages/ProfilePage";

const PATH_MAP={
  "/dashboard":"dashboard","/academy":"academy","/calc":"calc",
  "/simulador":"sim","/radar":"events","/duelo":"duel",
  "/ranking":"ranking","/finny":"ai","/perfil":"profile",
};

export function AppShell(props){
  const navigate=useNavigate();
  const{pathname}=useLocation();
  const page=PATH_MAP[pathname]||"dashboard";
  const{user,level,LVL_NAMES,onLogout}=props;
  const[showMore,setShowMore]=useState(false);
  const nav=[
    {icon:"📊",label:"Dashboard",   k:"dashboard",path:"/dashboard"},
    {icon:"🎓",label:"Academy",     k:"academy",  path:"/academy",   s:"Aprender"},
    {icon:"🧮",label:"Calculadoras",k:"calc",     path:"/calc"},
    {icon:"📈",label:"Simulador",   k:"sim",      path:"/simulador", s:"Investir"},
    {icon:"📰",label:"Radar",       k:"events",   path:"/radar"},
    {icon:"⚔️",label:"Duelo",       k:"duel",     path:"/duelo",     s:"Competir",badge:"NOVO"},
    {icon:"🏆",label:"Ranking",     k:"ranking",  path:"/ranking"},
    {icon:"💚",label:"Finny",       k:"ai",       path:"/finny",     s:"Exclusivo",badge:"NOVO"},
    {icon:"👤",label:"Perfil",      k:"profile",  path:"/perfil",    s:"Conta"},
  ];
  // itens principais na barra inferior do mobile; o resto fica atrás do "Mais"
  const mainKeys=["dashboard","academy","sim","duel"];
  const bottomMain=nav.filter(n=>mainKeys.includes(n.k));
  const bottomMore=nav.filter(n=>!mainKeys.includes(n.k));
  const moreActive=bottomMore.some(n=>n.k===page);

  function go(path){ setShowMore(false); navigate(path); }

  return(
    <>
      <div className="sidebar">
        <div className="s-logo" onClick={()=>navigate("/dashboard")} style={{cursor:"pointer"}}><div className="logomark">FQ</div><span className="syne-text">FinQuest</span></div>
        <nav className="s-nav">
          {nav.map(item=>(
            <div key={item.k}>
              {item.s&&<div className="s-section">{item.s}</div>}
              <div className={"nav-item"+(page===item.k?" act":"")} onClick={()=>navigate(item.path)} title={item.label}>
                <span style={{fontSize:16,flexShrink:0}}>{item.icon}</span>
                <span style={{flex:1}} className="ntxt">{item.label}</span>
                {item.badge&&<span style={{fontSize:9,background:"var(--g)",color:"#000",padding:"1px 6px",borderRadius:99,fontWeight:800}} className="ntxt">{item.badge}</span>}
              </div>
            </div>
          ))}
        </nav>
        <div className="s-user">
          <div className="avatar" style={{width:34,height:34,fontSize:12,flexShrink:0}}>{user?.name?.slice(0,2).toUpperCase()}</div>
          <div style={{flex:1,minWidth:0}} className="user-text">
            <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.name}</div>
            <div style={{fontSize:11,color:"var(--gold)"}}>⭐ {LVL_NAMES[level]}</div>
          </div>
          <button onClick={onLogout} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:16,padding:4}} title="Sair" className="user-text">⏏</button>
        </div>
      </div>

      <nav className="bottom-nav">
        {bottomMain.map(item=>(
          <button key={item.k} className={"bn-item"+(page===item.k?" act":"")} onClick={()=>go(item.path)}>
            <span className="bn-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
        <button className={"bn-item"+(moreActive?" act":"")} onClick={()=>setShowMore(true)}>
          <span className="bn-icon">⋯</span>
          <span>Mais</span>
        </button>
      </nav>

      {showMore&&(
        <div className="sheet-ov" onClick={e=>e.target===e.currentTarget&&setShowMore(false)}>
          <div className="sheet-box">
            <div style={{width:36,height:4,background:"var(--b2)",borderRadius:99,margin:"0 auto 14px"}}/>
            {bottomMore.map(item=>(
              <div key={item.k} className={"sheet-item"+(page===item.k?" act":"")} onClick={()=>go(item.path)}>
                <span style={{fontSize:18,flexShrink:0}}>{item.icon}</span>
                <span style={{flex:1}}>{item.label}</span>
                {item.badge&&<span style={{fontSize:9,background:"var(--g)",color:"#000",padding:"1px 6px",borderRadius:99,fontWeight:800}}>{item.badge}</span>}
              </div>
            ))}
            <div className="sheet-item" onClick={()=>{setShowMore(false);onLogout();}}>
              <span style={{fontSize:18,flexShrink:0}}>⏏</span>
              <span style={{flex:1}}>Sair da conta</span>
            </div>
          </div>
        </div>
      )}

      <main className="main">
        {page==="dashboard"&&<DashPage   {...props}/>}
        {page==="academy"  &&<AcademyPage {...props}/>}
        {page==="calc"     &&<CalcPage macro={props.macro}/>}
        {page==="sim"      &&<SimPage    {...props}/>}
        {page==="events"   &&<NewsPage   {...props}/>}
        {page==="duel"     &&<DuelPage   {...props}/>}
        {page==="ranking"  &&<RankPage   {...props}/>}
        {page==="ai"       &&<AIPage/>}
        {page==="profile"  &&<ProfilePage {...props}/>}
      </main>
    </>
  );
}
