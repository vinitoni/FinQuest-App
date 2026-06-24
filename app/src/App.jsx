import { useState, useEffect, useCallback } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";

import { fmt } from "./lib/format";
import { LS_PORT, loadUserData } from "./lib/userData";
import { COURSES } from "./data/courses";
import { INITIAL_EVENTS } from "./data/events";
import { useMarket } from "./hooks/useMarket";
import { useMacro } from "./hooks/useMacro";
import { useSecretAdmin } from "./hooks/useSecretAdmin";
import { Toast } from "./components/Toast";
import { OnboardingTutorial } from "./components/OnboardingTutorial";
import { AppShell } from "./components/AppShell";
import { Landing } from "./pages/Landing";
import { AuthScreen } from "./pages/AuthScreen";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminPanel } from "./admin/AdminPanel";

export default function FinQuest(){
  const navigate=useNavigate();
  const[user,setUser]=useState(null);
  const[authLoading,setAuthLoading]=useState(true);
  const[courses,setCourses]=useState(COURSES);
  const[events,setEvents]=useState(INITIAL_EVENTS);
  const[portfolio,setPortfolio]=useState({});
  const[cash,setCash]=useState(100000);
  const[trades,setTrades]=useState([]);
  const[xp,setXp]=useState(0);
  const[toast,setToast]=useState(null);
  const[progress,setProgress]=useState({});
  const[activeEvent,setActiveEvent]=useState(null);
  const[showTutorial,setShowTutorial]=useState(false);
  const{stocks,lastUpdated,loading:mktLoading,apiStatus,fetchPrices}=useMarket();
  const{macro}=useMacro();

  const showToast=msg=>setToast(msg);
  // earnXp persiste o XP no Supabase. Antes, XP de duelo/eventos era só local e sumia ao recarregar
  const earnXp=pts=>setXp(p=>{
    const nx=p+pts;
    if(user) supabase.from("profiles").update({xp:nx}).eq("id",user.id).then(()=>{});
    return nx;
  });

  const totalPort=Object.entries(portfolio).reduce((s,[t,p])=>{
    const st=stocks.find(s=>s.ticker===t);
    return s+(st?st.price:p.avgPrice)*p.qty;
  },0);
  const totalWealth=cash+totalPort;
  const pnl=totalWealth-100000;
  const level=xp<500?1:xp<1500?2:xp<3000?3:xp<5000?4:5;
  const LVL_NAMES=["","Iniciante","Investidor","Estrategista","Trader","Mestre"];
  const xpPct=Math.min(100,(xp/[500,1500,3000,5000,9999][level-1])*100);

  // Mantém o patrimônio total do ranking atualizado conforme os preços se movem
  // (sem precisar de trade). Dispara a cada refresh de cotações.
  useEffect(()=>{
    if(!user || Object.keys(portfolio).length===0) return;
    supabase.from("profiles").update({total_wealth:totalWealth}).eq("id",user.id).then(()=>{});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[lastUpdated]);

  // secret admin - no visible button anywhere
  useSecretAdmin(useCallback(()=>navigate("/admin"),[navigate]) );

  // ─── Supabase session restoration ───────────────────────────────
  useEffect(()=>{
    // Recuperação de senha: o link do e-mail cria uma sessão, mas aqui NÃO podemos
    // auto-logar, senão o usuário cai no dashboard sem definir a nova senha.
    const isRecovery = window.location.pathname==="/reset-password"
      || window.location.hash.includes("type=recovery");
    supabase.auth.getSession().then(async ({data:{session}})=>{
      if(session && !isRecovery){ await handleAuthSuccess(session.user); }
      else if(isRecovery){ navigate("/reset-password"); }
      setAuthLoading(false);
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange(async (event,session)=>{
      if(event==="PASSWORD_RECOVERY"){ navigate("/reset-password"); return; }
      if(event==="SIGNED_OUT"){ setUser(null);setCash(100000);setXp(0);setPortfolio({});setTrades([]);setProgress({});setShowTutorial(false);navigate("/"); }
    });
    return ()=>subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  async function handleAuthSuccess(authUser){
    const userData=await loadUserData(authUser);
    setUser({id:authUser.id,name:userData.profile.name,email:authUser.email||userData.profile.email||""});
    setCash(userData.profile.cash??100000);
    setXp(userData.profile.xp??0);
    setPortfolio(userData.portfolio);
    setTrades(userData.trades);
    setProgress(userData.progress);
    // tutorial de boas-vindas, só se nunca foi concluído/dispensado neste device
    try { if(!localStorage.getItem("fq_tut_"+authUser.id)) setShowTutorial(true); } catch {}
    navigate("/dashboard");
  }

  function finishTutorial(dontShow,go){
    setShowTutorial(false);
    if(dontShow && user){ try { localStorage.setItem("fq_tut_"+user.id,"1"); } catch {} }
    if(typeof go==="string") navigate(go);
  }

  function buyStock(ticker,qty){
    const s=stocks.find(s=>s.ticker===ticker);
    const cost=s.price*qty;
    if(cost>cash){showToast("Saldo insuficiente!");return;}
    const newCash=cash-cost;
    const newXp=xp+50;
    const prev=portfolio[ticker]||{qty:0,avgPrice:0};
    const nq=prev.qty+qty;
    const newPos={qty:nq,avgPrice:((prev.avgPrice*prev.qty)+(s.price*qty))/nq};
    // calcula novo patrimônio total (cash novo + carteira atual com novo ativo)
    const newPortValue=Object.entries({...portfolio,[ticker]:newPos}).reduce((s,[t,p])=>{
      const st=stocks.find(st=>st.ticker===t);return s+(st?st.price*p.qty:0);},0);
    const newTotalWealth=newCash+newPortValue;
    const newPortfolioState={...portfolio,[ticker]:newPos};
    setCash(newCash);
    setPortfolio(()=>newPortfolioState);
    setTrades(t=>[{type:"buy",ticker,qty,price:s.price,date:new Date().toLocaleString("pt-BR")},...t]);
    try { localStorage.setItem(LS_PORT(user?.id||"anon"),JSON.stringify(newPortfolioState)); } catch {}
    if(user){
      supabase.from("portfolio").upsert({user_id:user.id,ticker,qty:newPos.qty,avg_price:newPos.avgPrice},{onConflict:"user_id,ticker"}).then(()=>{});
      supabase.from("trades").insert({user_id:user.id,ticker,qty,price:s.price,type:"buy",profit:null}).then(()=>{});
      supabase.from("profiles").update({cash:newCash,xp:newXp,total_wealth:newTotalWealth}).eq("id",user.id).then(()=>{});
    }
    earnXp(50);showToast(qty+"x "+ticker+" comprada!");
  }

  function sellStock(ticker,qty){
    const pos=portfolio[ticker];
    if(!pos||pos.qty<qty){showToast("Quantidade insuficiente!");return;}
    const s=stocks.find(s=>s.ticker===ticker);
    const profit=(s.price-pos.avgPrice)*qty;
    const newCash=cash+s.price*qty;
    const newXp=xp+30;
    const nq=pos.qty-qty;
    const newPortfolio=nq===0?Object.fromEntries(Object.entries(portfolio).filter(([t])=>t!==ticker)):{...portfolio,[ticker]:{...pos,qty:nq}};
    const newPortValue=Object.entries(newPortfolio).reduce((s,[t,p])=>{
      const st=stocks.find(st=>st.ticker===t);return s+(st?st.price*p.qty:0);},0);
    const newTotalWealth=newCash+newPortValue;
    setCash(newCash);
    setPortfolio(()=>newPortfolio);
    setTrades(t=>[{type:"sell",ticker,qty,price:s.price,profit,date:new Date().toLocaleString("pt-BR")},...t]);
    try { localStorage.setItem(LS_PORT(user?.id||"anon"),JSON.stringify(newPortfolio)); } catch {}
    if(user){
      if(nq===0) supabase.from("portfolio").delete().eq("user_id",user.id).eq("ticker",ticker).then(()=>{});
      else supabase.from("portfolio").upsert({user_id:user.id,ticker,qty:nq,avg_price:pos.avgPrice},{onConflict:"user_id,ticker"}).then(()=>{});
      supabase.from("trades").insert({user_id:user.id,ticker,qty,price:s.price,type:"sell",profit}).then(()=>{});
      supabase.from("profiles").update({cash:newCash,xp:newXp,total_wealth:newTotalWealth}).eq("id",user.id).then(()=>{});
    }
    earnXp(30);showToast("Venda: "+(profit>=0?"lucro":"prejuízo")+" de "+fmt(Math.abs(profit)));
  }

  async function updateProfile(updates){
    if(!user) return;
    setUser(u=>({...u,...updates}));
    try {
      await supabase.from("profiles").update(updates).eq("id",user.id);
      showToast("Perfil atualizado!");
    } catch { showToast("Erro ao salvar."); }
  }

  function markEvent(ev){
    setActiveEvent(ev);
    setTimeout(()=>setActiveEvent(null),4500);
    earnXp(10);
  }

  function completeModule(cId,mId){
    setProgress(p=>{const s=new Set(p[cId]||[]);s.add(mId);return{...p,[cId]:s};});
    if(user){
      supabase.from("progress").upsert({user_id:user.id,course_id:cId,module_id:mId},{onConflict:"user_id,course_id,module_id"}).then(()=>{});
      supabase.from("profiles").update({xp:xp+150}).eq("id",user.id).then(()=>{});
    }
    earnXp(150);showToast("Módulo concluído! +150 XP");
  }

  const sharedProps={user,courses,events,stocks,portfolio,cash,trades,xp,xpPct,level,LVL_NAMES,
    totalWealth,pnl,progress,lastUpdated,mktLoading,apiStatus,fetchPrices,macro,
    buyStock,sellStock,markEvent,completeModule,earnXp,showToast,updateProfile};

  if(authLoading) return <><div className="mesh"/><div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",flexDirection:"column",gap:12}}><div className="logomark" style={{width:48,height:48,fontSize:18}}>FQ</div><div style={{color:"var(--muted)",fontSize:13}}>Carregando...</div></div></>;

  const appShell=(
    <>
      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
      {activeEvent&&(
        <div style={{position:"fixed",top:18,right:18,zIndex:200,maxWidth:330,animation:"su .35s ease"}}>
          <div style={{background:"var(--sf)",border:`1px solid ${activeEvent.impact==="bullish"?"rgba(0,214,143,.4)":"rgba(255,82,82,.4)"}`,borderRadius:12,padding:"13px 17px",display:"flex",gap:12,alignItems:"flex-start"}}>
            <span style={{fontSize:24}}>{activeEvent.emoji}</span>
            <div><div style={{fontWeight:700,marginBottom:3,fontSize:14}}>{activeEvent.title}</div><div style={{fontSize:12,color:"var(--muted)"}}>{activeEvent.desc}</div></div>
          </div>
        </div>
      )}
      <AppShell {...sharedProps} onLogout={async()=>{await supabase.auth.signOut();navigate("/");}}/>
      {showTutorial&&<OnboardingTutorial user={user} onFinish={finishTutorial}/>}
    </>
  );

  return(
    <>
      <div className="mesh"/>
      <Routes>
        <Route path="/"        element={<Landing onLogin={()=>navigate("/login")} onSignup={()=>navigate("/signup")} stocks={stocks}/>}/>
        <Route path="/login"   element={<AuthScreen mode="login"  onSuccess={handleAuthSuccess} onSwitch={()=>navigate("/signup")} onBack={()=>navigate("/")}/>}/>
        <Route path="/signup"  element={<AuthScreen mode="signup" onSuccess={handleAuthSuccess} onSwitch={()=>navigate("/login")}  onBack={()=>navigate("/")}/>}/>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin"   element={<AdminLogin onSuccess={()=>navigate("/admin/panel")} onBack={()=>navigate("/")}/>}/>
        <Route path="/admin/panel" element={<AdminPanel courses={courses} setCourses={setCourses} events={events} setEvents={setEvents} onExit={()=>navigate("/")}/>}/>
        <Route path="/*"       element={user ? appShell : <Navigate to="/" replace/>}/>
      </Routes>
    </>
  );
}
