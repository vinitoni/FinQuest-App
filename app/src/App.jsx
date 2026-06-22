import { useState, useEffect, useRef, useCallback } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "./supabase";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";

// ─── helpers ────────────────────────────────────────────────────
const fmt  = v => v == null ? "R$0,00" : v.toLocaleString("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:2});
const fmtP = v => `${v>=0?"+":""}${Number(v).toFixed(2)}%`;
const uid  = () => Math.random().toString(36).slice(2,8);
const toEmbed = url => {
  if(!url) return "";
  if(url.includes("/embed/")) return url;
  const m = url.match(/(?:v=|youtu\.be\/)([^&\s?]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url;
};

// ─── stock metadata & fallback prices ───────────────────────────
const TICKERS = ["PETR4","VALE3","ITUB4","BBDC4","WEGE3","MGLU3","BBAS3","ABEV3","SUZB3","JBSS3"];
const STOCK_META = {
  PETR4:{name:"Petrobras",  sector:"Energia"},    VALE3:{name:"Vale",           sector:"Mineração"},
  ITUB4:{name:"Itaú",       sector:"Bancos"},     BBDC4:{name:"Bradesco",       sector:"Bancos"},
  WEGE3:{name:"WEG",        sector:"Industrial"}, MGLU3:{name:"Magalu",         sector:"Varejo"},
  BBAS3:{name:"Banco do Brasil",sector:"Bancos"}, ABEV3:{name:"Ambev",          sector:"Consumo"},
  SUZB3:{name:"Suzano",     sector:"Papel"},      JBSS3:{name:"JBS",            sector:"Alimentos"},
};
// Preços do último fechamento B3 — fallback quando Brapi.dev indisponível
// Atualizado em: 06/03/2026. Brapi.dev substitui estes valores automaticamente.
const FALLBACK = {
  PETR4: 40.64, // Petrobras — fechamento 05/03 (Investing.com)
  VALE3: 81.29, // Vale      — fechamento 05/03 (Investing.com, confirmado)
  ITUB4: 43.51, // Itaú      — fechamento 05/03 (Investing.com)
  BBDC4: 20.49, // Bradesco  — fechamento 05/03 (Investing.com)
  WEGE3: 46.71, // WEG       — fechamento 05/03 (Investing.com)
  MGLU3:  9.64, // Magalu    — fechamento 05/03 (aprox. — hoje ~9,94)
  BBAS3: 25.00, // BB        — fechamento 05/03 (Investing.com)
  ABEV3: 15.10, // Ambev     — fechamento 05/03 (aprox. — hoje ~15,29)
  SUZB3: 55.90, // Suzano    — fechamento 05/03 (aprox. — hoje ~56,50)
  JBSS3: 39.03, // JBS       — fechamento 05/03 (Investidor10)
};
// Variação do último pregão (05/03 vs 04/03) — fonte: Investing.com
const FALLBACK_CHANGE = {
  PETR4: +0.35,  // +0,35% em 05/03
  VALE3: -3.33,  // -3,33% (de 84,09 para 81,29)
  ITUB4: -0.69,  // estimado
  BBDC4:  0.00,  // estável (prev. também 20,49)
  WEGE3: -0.17,  // pequena queda
  MGLU3: +0.83,  // estimado
  BBAS3: -1.57,  // estimado (caiu para 25,00)
  ABEV3: +1.27,  // estimado
  SUZB3: +0.54,  // estimado
  JBSS3:  0.00,  // estável
};

const INITIAL_EVENTS = [
  {id:"e1",emoji:"📉",title:"BC sobe juros",      desc:"SELIC +0,5pp. Impacto negativo em crescimento.",impact:"bearish"},
  {id:"e2",emoji:"🚀",title:"Lucro recorde",       desc:"WEGE3 reporta +40% no lucro trimestral.",       impact:"bullish"},
  {id:"e3",emoji:"⚠️",title:"Crise internacional", desc:"Tensões geopolíticas. Dólar dispara.",           impact:"bearish"},
  {id:"e4",emoji:"📈",title:"PIB surpreende",      desc:"Dados positivos da economia animam mercados.",   impact:"bullish"},
  {id:"e5",emoji:"🛢️",title:"Petróleo >$100",      desc:"Barril sobe. PETR4 lidera as altas.",            impact:"bullish"},
];

const COURSES = [
  {id:"c1",title:"Introdução ao Mercado",icon:"🎓",color:"#00d68f",level:"Iniciante",duration:"2h",
   modules:[
    {id:"m1",title:"O que é investir?",blocks:[
      {id:"b1",type:"text",content:"<h2>O que é investir?</h2><p>Investir significa aplicar dinheiro em ativos para fazê-lo crescer. Quando parado, a <strong>inflação corrói</strong> seu poder de compra.</p><ul><li><strong>Renda fixa:</strong> retorno previsível, menor risco</li><li><strong>Renda variável:</strong> maior potencial, mais risco</li><li><strong>Diversificação:</strong> combinar tipos reduz o risco geral</li></ul>"},
      {id:"b2",type:"quiz",questions:[
        {id:"q1",question:"Por que guardar dinheiro parado pode ser prejudicial?",options:["O banco pode confiscá-lo","A inflação corrói o poder de compra","As notas perdem valor físico","O governo tributa dinheiro parado"],correct:1,explanation:"A inflação faz os preços subirem, diminuindo o poder de compra do dinheiro parado."},
        {id:"q2",question:"O que é renda variável?",options:["Retorno garantido pelo governo","Poupança com rendimento fixo","Investimento cujo retorno depende do mercado","Título do Banco Central"],correct:2,explanation:"Renda variável tem retorno que varia com o mercado — mais risco, maior potencial de retorno."}
      ]}
    ]},
    {id:"m2",title:"Juros compostos",blocks:[
      {id:"b3",type:"text",content:"<h2>Juros Compostos</h2><p>São <em>juros sobre juros</em> — o maior aliado do investidor. O crescimento é <strong>exponencial</strong> com o tempo.</p><blockquote>Retorno Real ≈ Retorno Nominal − Inflação</blockquote><p>Se rende 8%/ano e a inflação é 5%, seu ganho real é de apenas 3%.</p>"},
      {id:"b4",type:"video",url:"https://www.youtube.com/embed/wf91rEGw88Q",caption:"Juros compostos na prática"},
      {id:"b5",type:"quiz",questions:[
        {id:"q1",question:"Se um investimento rende 10%/ano e a inflação é 4%, qual o retorno real?",options:["14%","10%","6%","4%"],correct:2,explanation:"Retorno real ≈ 10% - 4% = 6%. Esse é o percentual que aumentou de fato seu poder de compra."}
      ]}
    ]}
  ]},
  {id:"c2",title:"Renda Fixa",icon:"🏦",color:"#f0c040",level:"Iniciante",duration:"3h",
   modules:[
    {id:"m3",title:"Tesouro Direto",blocks:[
      {id:"b6",type:"text",content:"<h2>Tesouro Direto</h2><p>Programa do <strong>Governo Federal</strong> para venda de títulos públicos. É o investimento mais seguro do Brasil.</p><ul><li><strong>Tesouro Selic:</strong> reserva de emergência</li><li><strong>Tesouro IPCA+:</strong> proteção da inflação</li><li><strong>Tesouro Prefixado:</strong> taxa definida na compra</li></ul>"},
      {id:"b7",type:"quiz",questions:[
        {id:"q1",question:"Quem emite os títulos do Tesouro Direto?",options:["Bancos privados","Bolsa (B3)","Governo Federal","Fundos de investimento"],correct:2,explanation:"O Tesouro Direto é programa do Tesouro Nacional (Governo Federal)."},
        {id:"q2",question:"Qual título é ideal para reserva de emergência?",options:["Prefixado","IPCA+ 2045","Tesouro Selic","IPCA+ com juros semestrais"],correct:2,explanation:"O Tesouro Selic tem liquidez diária e não sofre marcação a mercado negativa."}
      ]}
    ]},
    {id:"m4",title:"CDB, LCI e LCA",blocks:[
      {id:"b8",type:"text",content:"<h2>CDB</h2><p>Emitido por bancos. Coberto pelo <strong>FGC</strong> até R$250.000.</p><h2>LCI e LCA</h2><p>Isentas de IR para pessoas físicas — o que eleva o retorno líquido.</p>"},
      {id:"b9",type:"quiz",questions:[
        {id:"q1",question:"LCI e LCA têm qual vantagem tributária?",options:["IR reduzido a 5%","Isenção total de IR","Isenção de IOF","Desconto de 50% no IR"],correct:1,explanation:"LCI e LCA são isentas de IR para pessoas físicas, aumentando o retorno líquido."}
      ]}
    ]}
  ]},
  {id:"c3",title:"Fundos Imobiliários",icon:"🏗️",color:"#7c6aff",level:"Intermediário",duration:"4h",
   modules:[{id:"m5",title:"O que são FIIs?",blocks:[
    {id:"b10",type:"text",content:"<h2>FIIs</h2><p>Permitem investir em imóveis de forma fracionada. Receba <strong>dividendos mensais</strong>.</p><p><strong>DY</strong> = Dividendos / Preço × 100</p>"},
    {id:"b11",type:"quiz",questions:[{id:"q1",question:"O que é Dividend Yield?",options:["Preço da cota","Dividendo÷Preço","Taxa de vacância","Valor patrimonial"],correct:1,explanation:"DY = Dividendos ÷ Preço da cota — indica o rendimento percentual em dividendos."}]}
  ]}]},
  {id:"c4",title:"ETFs",icon:"🌍",color:"#ff9f43",level:"Intermediário",duration:"3h",
   modules:[{id:"m6",title:"O que são ETFs?",blocks:[
    {id:"b12",type:"text",content:"<h2>Exchange Traded Funds</h2><p>ETFs replicam índices. <strong>BOVA11</strong> replica o Ibovespa. <strong>IVVB11</strong> replica o S&P 500.</p>"},
    {id:"b13",type:"quiz",questions:[{id:"q1",question:"O IVVB11 replica qual índice?",options:["Ibovespa","S&P 500","Nasdaq 100","Dow Jones"],correct:1,explanation:"O IVVB11 replica o S&P 500 — maiores empresas americanas via B3."}]}
  ]}]},
  {id:"c5",title:"Bolsa de Valores",icon:"📊",color:"#ff6b6b",level:"Avançado",duration:"5h",
   modules:[{id:"m7",title:"Como funcionam ações",blocks:[
    {id:"b14",type:"text",content:"<h2>Ações</h2><p>Ao comprar uma ação, você se torna sócio. Retorno via <strong>valorização</strong> e <strong>dividendos</strong>.</p><p>Indicadores: P/L, ROE, DY, Endividamento.</p>"},
    {id:"b15",type:"quiz",questions:[{id:"q1",question:"O que o P/L representa?",options:["Patrimônio líquido","Preço ÷ Lucro","Dividendo pago","Volume médio"],correct:1,explanation:"P/L = Preço ÷ Lucro por ação. Indica quantos anos para recuperar o investimento."}]}
  ]}]},
  {id:"c6",title:"Investimentos Internacionais",icon:"🌐",color:"#00cec9",level:"Avançado",duration:"4h",
   modules:[{id:"m8",title:"Por que investir no exterior?",blocks:[
    {id:"b16",type:"text",content:"<h2>Diversificação global</h2><p>Protege de riscos do Brasil e dá acesso a Apple, Google, Amazon.</p><p>Formas: <strong>BDRs</strong>, <strong>ETFs globais</strong> (IVVB11, WRLD11), corretoras internacionais.</p>"},
    {id:"b17",type:"quiz",questions:[{id:"q1",question:"O que é um BDR?",options:["Brazilian Dividend Returns","Brazilian Depositary Receipts","Banco Digital de Reservas","Bolsa de Derivativos"],correct:1,explanation:"BDR = certificado que representa ações estrangeiras negociado na B3."}]}
  ]}]},
];

const OPPONENTS = [
  {id:"o1",name:"Lucas Mendes",  avatar:"LM",rating:1840,wins:42,losses:18,style:"Agressivo"},
  {id:"o2",name:"Ana Lima",      avatar:"AL",rating:1620,wins:28,losses:22,style:"Conservador"},
  {id:"o3",name:"Carlos Souza",  avatar:"CS",rating:1390,wins:15,losses:30,style:"Moderado"},
  {id:"o4",name:"Fernanda Costa",avatar:"FC",rating:1950,wins:55,losses:12,style:"Especulativo"},
];

const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
:root{--bg:#06090f;--bg1:#0c1118;--bg2:#111925;--sf:#131e2d;--b:#1c2d42;--b2:#253d56;
  --g:#00d68f;--gold:#f5c842;--red:#ff5252;--blue:#4d9eff;--purple:#8b5cf6;--orange:#ff9f43;
  --text:#dde8f5;--muted:#4e6e8e;--muted2:#2d4460;}
body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden;}
::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:var(--b2);border-radius:99px;}
.syne{font-family:'Syne',sans-serif;}
.mesh{position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse at 15% 25%,rgba(0,214,143,.08) 0,transparent 45%),radial-gradient(ellipse at 85% 75%,rgba(77,158,255,.06) 0,transparent 45%);}
.sidebar{position:fixed;left:0;top:0;bottom:0;width:220px;background:var(--bg1);border-right:1px solid var(--b);display:flex;flex-direction:column;z-index:100;}
.s-logo{padding:24px 20px 20px;border-bottom:1px solid var(--b);font-family:'Syne',sans-serif;font-size:21px;font-weight:800;color:var(--g);display:flex;align-items:center;gap:10px;}
.logomark{width:32px;height:32px;background:linear-gradient(135deg,var(--g),#00a86b);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:#000;}
.s-nav{flex:1;padding:12px 10px;display:flex;flex-direction:column;gap:1px;overflow-y:auto;}
.s-section{font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted2);padding:10px 12px 4px;}
.nav-item{display:flex;align-items:center;gap:11px;padding:10px 12px;border-radius:8px;cursor:pointer;transition:all .15s;font-size:13.5px;font-weight:500;color:var(--muted);border:1px solid transparent;}
.nav-item:hover{background:var(--sf);color:var(--text);}
.nav-item.act{background:rgba(0,214,143,.1);color:var(--g);border-color:rgba(0,214,143,.18);}
.s-user{padding:14px;border-top:1px solid var(--b);display:flex;align-items:center;gap:11px;}
.avatar{border-radius:50%;background:linear-gradient(135deg,var(--g),var(--blue));display:flex;align-items:center;justify-content:center;font-weight:700;color:#000;flex-shrink:0;}
.main{margin-left:220px;min-height:100vh;position:relative;z-index:1;}
.page{padding:28px 28px 64px;max-width:1160px;}
.topbar{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;gap:14px;flex-wrap:wrap;}
.ptitle{font-family:'Syne',sans-serif;font-size:26px;font-weight:800;letter-spacing:-.02em;}
.psub{font-size:13px;color:var(--muted);margin-top:2px;}
.card{background:var(--sf);border:1px solid var(--b);border-radius:14px;padding:18px 20px;}
.clabel{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:7px;}
.g2{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:18px;}
.g3{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px;}
.g4{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;}
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;}
.bg{background:rgba(0,214,143,.12);color:var(--g);}
.br{background:rgba(255,82,82,.12);color:var(--red);}
.bgold{background:rgba(245,200,66,.12);color:var(--gold);}
.bb{background:rgba(77,158,255,.12);color:var(--blue);}
.bp{background:rgba(139,92,246,.12);color:var(--purple);}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:10px 20px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:13.5px;font-weight:600;cursor:pointer;transition:all .15s;border:none;white-space:nowrap;}
.btn:disabled{opacity:.45;cursor:not-allowed;}
.bprimary{background:var(--g);color:#000;}.bprimary:hover:not(:disabled){background:#00f0a0;transform:translateY(-1px);}
.boutline{background:transparent;border:1px solid var(--b2);color:var(--text);}.boutline:hover{border-color:var(--g);color:var(--g);}
.bghost{background:rgba(0,214,143,.08);color:var(--g);}.bghost:hover{background:rgba(0,214,143,.16);}
.bred{background:rgba(255,82,82,.14);color:var(--red);}.bred:hover{background:rgba(255,82,82,.24);}
.bgold-btn{background:rgba(245,200,66,.14);color:var(--gold);border:1px solid rgba(245,200,66,.3);}.bgold-btn:hover{background:rgba(245,200,66,.24);}
.bsm{padding:6px 13px;font-size:12px;border-radius:6px;}
.bxs{padding:4px 9px;font-size:11px;border-radius:5px;}
.inp{background:var(--bg2);border:1px solid var(--b);border-radius:8px;padding:10px 14px;color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;width:100%;transition:border-color .2s;outline:none;}
.inp:focus{border-color:var(--g);}
.ilabel{font-size:11px;font-weight:700;color:var(--muted);margin-bottom:5px;display:block;text-transform:uppercase;letter-spacing:.06em;}
.ta{background:var(--bg2);border:1px solid var(--b);border-radius:8px;padding:11px 14px;color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;width:100%;resize:vertical;outline:none;min-height:88px;}
.ta:focus{border-color:var(--g);}
.fg{margin-bottom:16px;}
.prog{height:5px;background:var(--b);border-radius:99px;overflow:hidden;}
.pfill{height:100%;border-radius:99px;transition:width .4s;}
.xpw{background:var(--b);border-radius:99px;height:7px;overflow:hidden;}
.xpf{height:100%;background:linear-gradient(90deg,var(--g),#00f5a8);border-radius:99px;}
.tabs{display:flex;gap:3px;background:var(--bg1);border-radius:10px;padding:4px;}
.tab{padding:7px 15px;border-radius:7px;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;color:var(--muted);border:none;background:transparent;}
.tab.act{background:var(--sf);color:var(--text);}
.modal-ov{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:500;display:flex;align-items:center;justify-content:center;padding:20px;animation:fi .18s ease;}
.modal-box{background:var(--sf);border:1px solid var(--b);border-radius:18px;padding:28px;max-height:92vh;overflow-y:auto;animation:su .22s ease;}
@keyframes fi{from{opacity:0}to{opacity:1}}
@keyframes su{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.spinner{width:18px;height:18px;border:2px solid var(--b);border-top-color:var(--g);border-radius:50%;animation:spin .7s linear infinite;}
.toast{position:fixed;bottom:26px;right:26px;z-index:999;background:var(--sf);border:1px solid var(--g);border-radius:12px;padding:11px 18px;font-size:13.5px;font-weight:600;color:var(--g);animation:su .3s ease;display:flex;align-items:center;gap:9px;box-shadow:0 8px 32px rgba(0,0,0,.5);}
.live{width:7px;height:7px;border-radius:50%;background:var(--g);animation:pulse 1.4s infinite;display:inline-block;}
.rich h2{font-family:'Syne',sans-serif;font-size:19px;font-weight:700;margin:0 0 10px;}
.rich h3{font-size:15px;font-weight:700;margin:14px 0 7px;}
.rich p{color:#b8cfe0;line-height:1.72;margin-bottom:10px;font-size:14.5px;}
.rich ul{margin:0 0 10px 17px;color:#b8cfe0;line-height:1.72;}
.rich li{margin-bottom:3px;font-size:14.5px;}
.rich strong{color:var(--g);}
.rich em{color:var(--gold);}
.rich blockquote{border-left:3px solid var(--g);padding:9px 15px;background:rgba(0,214,143,.06);border-radius:0 8px 8px 0;margin:10px 0;font-weight:600;font-size:14.5px;}
.qopt{padding:12px 15px;border-radius:9px;border:1px solid var(--b);background:var(--bg2);cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13.5px;font-weight:500;text-align:left;transition:all .18s;width:100%;}
.qopt:hover:not(:disabled){border-color:var(--blue);background:rgba(77,158,255,.06);}
.qopt.qc{border-color:var(--g)!important;background:rgba(0,214,143,.1)!important;color:var(--g)!important;}
.qopt.qw{border-color:var(--red)!important;background:rgba(255,82,82,.1)!important;color:var(--red)!important;}
.qopt.qr{border-color:rgba(0,214,143,.35)!important;background:rgba(0,214,143,.04)!important;}
.chat-wrap{display:flex;flex-direction:column;height:calc(100vh - 220px);max-height:640px;}
.chat-msgs{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:13px;padding:18px;background:var(--bg1);border-radius:14px 14px 0 0;border:1px solid var(--b);border-bottom:none;}
.chat-inp-row{display:flex;gap:9px;padding:14px 16px;background:var(--sf);border:1px solid var(--b);border-radius:0 0 14px 14px;}
.msg{max-width:82%;padding:11px 15px;border-radius:14px;font-size:14px;line-height:1.62;}
.msg-u{background:var(--g);color:#000;font-weight:600;align-self:flex-end;border-radius:14px 14px 3px 14px;}
.msg-a{background:var(--bg2);border:1px solid var(--b);align-self:flex-start;border-radius:14px 14px 14px 3px;}
.typing{display:flex;gap:5px;padding:12px 15px;}
.typing span{width:7px;height:7px;border-radius:50%;background:var(--muted);animation:pulse .9s infinite;}
.typing span:nth-child(2){animation-delay:.2s;}.typing span:nth-child(3){animation-delay:.4s;}
.stk-row{display:flex;align-items:center;padding:12px 16px;border-bottom:1px solid var(--b);transition:background .12s;cursor:pointer;gap:10px;}
.stk-row:hover{background:rgba(255,255,255,.02);}
.stk-row:last-child{border-bottom:none;}
.slist{display:flex;flex-direction:column;gap:8px;max-height:340px;overflow-y:auto;}
.lvlbadge{display:inline-flex;align-items:center;gap:8px;padding:5px 13px;border-radius:99px;background:rgba(245,200,66,.1);border:1px solid rgba(245,200,66,.2);color:var(--gold);font-size:12px;font-weight:700;}
.blktag{padding:2px 9px;border-radius:4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;}
.bt-text{background:rgba(77,158,255,.15);color:var(--blue);}
.bt-video{background:rgba(255,82,82,.15);color:var(--red);}
.bt-image{background:rgba(139,92,246,.15);color:var(--purple);}
.bt-quiz{background:rgba(245,200,66,.15);color:var(--gold);}
.hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:80px 40px;position:relative;}
.hglow{position:absolute;width:700px;height:700px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,rgba(0,214,143,.1) 0,transparent 70%);top:50%;left:50%;transform:translate(-50%,-55%);}
.ticker-tape{overflow:hidden;border-top:1px solid var(--b);border-bottom:1px solid var(--b);background:var(--bg1);padding:9px 0;}
.ticker-inner{display:flex;gap:36px;animation:ticker 30s linear infinite;white-space:nowrap;}
.tick-item{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:600;flex-shrink:0;}
.auth-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);padding:40px;}
.auth-card{background:var(--sf);border:1px solid var(--b);border-radius:18px;padding:44px;width:100%;max-width:420px;}
.duel-vs{display:flex;align-items:center;justify-content:center;gap:20px;padding:28px;background:var(--bg1);border-radius:16px;border:1px solid var(--b);}
.duel-side{text-align:center;flex:1;}
.admin-sb{position:fixed;left:0;top:0;bottom:0;width:216px;background:#060b10;border-right:1px solid var(--b);z-index:100;display:flex;flex-direction:column;}
.anav{display:flex;align-items:center;gap:11px;padding:9px 14px;border-radius:8px;cursor:pointer;color:var(--muted);font-size:13.5px;font-weight:500;transition:all .15s;border:none;background:none;width:100%;text-align:left;}
.anav:hover{background:var(--sf);color:var(--text);}
.anav.act{background:rgba(245,200,66,.1);color:var(--gold);}
@media(max-width:960px){
  .sidebar{width:56px;}
  .s-logo .syne-text,.s-section,.nav-item .ntxt,.s-user .user-text{display:none;}
  .nav-item{justify-content:center;padding:11px 0;}
  .s-user{justify-content:center;}
  .main{margin-left:56px;}
  .page{padding:20px 16px 60px;}
  .g4{grid-template-columns:repeat(2,1fr);}
  .ptitle{font-size:20px!important;}
}
@media(max-width:700px){
  .g2,.g3{grid-template-columns:1fr;}
  .g4{grid-template-columns:1fr 1fr;}
  .topbar{flex-direction:column;align-items:flex-start;}
}
`;

// ─── ONBOARDING TUTORIAL ─────────────────────────────────────────
function OnboardingTutorial({user,onFinish}){
  const firstName=(user?.name||"investidor").split(" ")[0];
  const STEPS=[
    {icon:"👋",accent:"var(--g)",
     title:`Bem-vindo ao FinQuest, ${firstName}!`,
     desc:"Aqui você aprende a investir de verdade — praticando, sem arriscar um centavo do seu dinheiro real. Deixa eu te mostrar como funciona em 30 segundos.",
     chip:null},
    {icon:"📈",accent:"var(--g)",
     title:"R$100 mil pra você investir",
     desc:"Você começa com R$100.000 virtuais pra montar sua carteira com ações reais da B3. Os preços são de mercado — seus ganhos e perdas seguem a bolsa de verdade.",
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
     desc:"Ganhe XP, suba no ranking e desafie outros investidores em duelos. Tudo pronto — bora montar sua primeira carteira?",
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

// ─── SHARED UI ───────────────────────────────────────────────────
function Modal({open,onClose,title,children,width=640}){
  if(!open) return null;
  return(
    <div className="modal-ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box" style={{width:"100%",maxWidth:width}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div className="syne" style={{fontSize:18,fontWeight:700}}>{title}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:20,lineHeight:1}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Toast({msg,onDone}){
  useEffect(()=>{const t=setTimeout(onDone,2800);return()=>clearTimeout(t);},[]);
  return <div className="toast">✓ {msg}</div>;
}

const ChartTip=({active,payload,label})=>{
  if(!active||!payload?.length) return null;
  return(
    <div style={{background:"var(--bg1)",border:"1px solid var(--b)",borderRadius:8,padding:"8px 13px",fontSize:12}}>
      <div style={{color:"var(--muted)",marginBottom:4}}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{color:p.color||"var(--text)",fontWeight:700,marginBottom:2}}>{p.name}: {typeof p.value==="number"?fmt(p.value):p.value}</div>
      ))}
    </div>
  );
};

// ─── SECRET ADMIN HOOK ───────────────────────────────────────────
function useSecretAdmin(cb){
  const buf=useRef("");
  const SECRET="finquestadmin";
  useEffect(()=>{
    const h=e=>{
      if(["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName)) return;
      buf.current=(buf.current+e.key.toLowerCase()).slice(-SECRET.length);
      if(buf.current===SECRET){buf.current="";cb();}
    };
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[cb]);
}

// ─── BRAPI HOOK ──────────────────────────────────────────────────
function useMarket(){
  // Build stock list — uses real API data if available, otherwise last known B3 close
  const makeStocks=useCallback(function(overrides){
    return TICKERS.map(function(t){
      return {
        ticker:t,
        name:STOCK_META[t].name,
        sector:STOCK_META[t].sector,
        price:  overrides&&overrides[t]&&overrides[t].price  != null ? overrides[t].price  : FALLBACK[t],
        change: overrides&&overrides[t]&&overrides[t].change != null ? overrides[t].change : FALLBACK_CHANGE[t],
        high:   overrides&&overrides[t] ? overrides[t].high   : null,
        low:    overrides&&overrides[t] ? overrides[t].low    : null,
        volume: overrides&&overrides[t] ? overrides[t].volume : null,
        isRealtime: !!(overrides&&overrides[t]),
      };
    });
  },[]);

  const [stocks,setStocks]    = useState(function(){ return makeStocks(null); });
  const [lastUpdated,setLastUpdated] = useState(null);
  const [loading,setLoading]  = useState(false);
  const [apiStatus,setApiStatus] = useState("idle");

  const fetchPrices=useCallback(async function(){
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(function(){ controller.abort(); }, 10000);
    try{
      const url = "/api/stocks?symbols="+TICKERS.join(",");
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if(!res.ok) throw new Error("HTTP "+res.status);
      const data = await res.json();
      if(!data||!data.results||!data.results.length) throw new Error("empty response");
      const map = {};
      data.results.forEach(function(r){
        map[r.symbol] = {
          price:  r.regularMarketPrice   != null ? Number(r.regularMarketPrice)          : FALLBACK[r.symbol],
          change: r.regularMarketChangePercent != null ? Number(r.regularMarketChangePercent) : FALLBACK_CHANGE[r.symbol],
          high:   r.regularMarketDayHigh  || null,
          low:    r.regularMarketDayLow   || null,
          volume: r.regularMarketVolume   || null,
        };
      });
      setStocks(makeStocks(map));
      setLastUpdated(new Date());
      setApiStatus("ok");
    } catch(e){
      clearTimeout(timer);
      console.warn("Brapi.dev falhou:", e.message, "— usando último fechamento B3");
      setApiStatus("fallback");
    } finally{
      setLoading(false);
    }
  },[makeStocks]);

  useEffect(()=>{
    fetchPrices();
    const id=setInterval(fetchPrices,5*60*1000);
    return()=>clearInterval(id);
  },[fetchPrices]);


  return{stocks,setStocks,lastUpdated,loading,apiStatus,fetchPrices};
}

// ─── HG BRASIL MACRO HOOK ────────────────────────────────────────
const MACRO_DEFAULTS={cdi:13.75,selic:13.75,ipca:5.0,ibov:null,ibovChange:null,usd:null,eur:null};
function useMacro(){
  const[macro,setMacro]=useState(MACRO_DEFAULTS);
  useEffect(()=>{
    async function load(){
      try{
        const res=await fetch("/api/macro");
        if(!res.ok) return;
        const d=await res.json();
        if(d&&d.cdi) setMacro(d);
      }catch(e){ /* usa defaults */ }
    }
    load();
    const id=setInterval(load,30*60*1000);
    return()=>clearInterval(id);
  },[]);
  return{macro};
}

// ─── MAIN APP ────────────────────────────────────────────────────
// ─── Supabase data loader ────────────────────────────────────────
const LS_PORT = id => "fq_port_" + id;

async function loadUserData(authUser) {
  const [profileRes, portfolioRes, tradesRes, progressRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", authUser.id).single(),
    supabase.from("portfolio").select("*").eq("user_id", authUser.id),
    supabase.from("trades").select("*").eq("user_id", authUser.id).order("created_at", { ascending: false }),
    supabase.from("progress").select("*").eq("user_id", authUser.id),
  ]);
  const profile = profileRes.data || { id: authUser.id, name: "Investidor", xp: 0, cash: 100000 };

  const portfolioObj = {};
  const portRows = portfolioRes.data || [];
  if (portRows.length > 0) {
    portRows.forEach(r => { portfolioObj[r.ticker] = { qty: r.qty, avgPrice: r.avg_price }; });
    // Sync cloud data into localStorage so we have a local backup
    try { localStorage.setItem(LS_PORT(authUser.id), JSON.stringify(portfolioObj)); } catch {}
  } else {
    // Supabase returned empty — fall back to localStorage cache
    try {
      const local = JSON.parse(localStorage.getItem(LS_PORT(authUser.id)) || "{}");
      Object.assign(portfolioObj, local);
    } catch {}
  }

  const tradesArr = (tradesRes.data || []).map(r => ({
    type: r.type, ticker: r.ticker, qty: r.qty, price: r.price,
    profit: r.profit, date: new Date(r.created_at).toLocaleString("pt-BR"),
  }));
  const progressObj = {};
  (progressRes.data || []).forEach(r => {
    if (!progressObj[r.course_id]) progressObj[r.course_id] = new Set();
    progressObj[r.course_id].add(r.module_id);
  });
  return { profile, portfolio: portfolioObj, trades: tradesArr, progress: progressObj };
}

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
  // earnXp persiste o XP no Supabase — antes, XP de duelo/eventos era só local e sumia ao recarregar
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
    supabase.auth.getSession().then(async ({data:{session}})=>{
      if(session){ await handleAuthSuccess(session.user); }
      setAuthLoading(false);
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange(async (event,session)=>{
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
    // tutorial de boas-vindas — só se nunca foi concluído/dispensado neste device
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

  if(authLoading) return <><style>{css}</style><div className="mesh"/><div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",flexDirection:"column",gap:12}}><div className="logomark" style={{width:48,height:48,fontSize:18}}>FQ</div><div style={{color:"var(--muted)",fontSize:13}}>Carregando...</div></div></>;

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
      <style>{css}</style>
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

// ─── APP SHELL ───────────────────────────────────────────────────
const PATH_MAP={
  "/dashboard":"dashboard","/academy":"academy","/calc":"calc",
  "/simulador":"sim","/radar":"events","/duelo":"duel",
  "/ranking":"ranking","/finny":"ai","/perfil":"profile",
};

function AppShell(props){
  const navigate=useNavigate();
  const{pathname}=useLocation();
  const page=PATH_MAP[pathname]||"dashboard";
  const{user,level,LVL_NAMES,onLogout}=props;
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

// ─── LANDING (no admin button at all) ────────────────────────────
function Landing({onLogin,onSignup,stocks}){
  const tix=[...stocks,...stocks,...stocks];
  return(
    <>
      <style>{css}</style>
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
            {[["📡","Preços reais","Cotações B3 via Brapi.dev com ~15min delay"],
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
          <span>© 2024 · Educacional. Não é consultoria financeira.</span>
        </footer>
      </div>
    </>
  );
}

// ─── AUTH (with proper validation) ───────────────────────────────
function AuthScreen({mode,onSuccess,onSwitch,onBack}){
  const[form,setForm]=useState({name:"",email:"",password:""});
  const[errors,setErrors]=useState({});
  const[loading,setLoading]=useState(false);
  const[serverErr,setServerErr]=useState("");
  const isSignup=mode==="signup";
  const navigate = useNavigate();

  function validate(){
    const e={};
    if(isSignup&&!form.name.trim()) e.name="Nome obrigatório";
    if(!form.email.trim()||!form.email.includes("@")) e.email="E-mail inválido";
    if(form.password.length<6) e.password="Senha mínima 6 caracteres";
    setErrors(e);
    return Object.keys(e).length===0;
  }

  async function submit(){
    if(!validate()) return;
    setLoading(true);setServerErr("");
    if(isSignup){
      const{data,error}=await supabase.auth.signUp({
        email:form.email.trim(),password:form.password,
        options:{data:{name:form.name.trim()}}
      });
      if(error){setServerErr(error.message);setLoading(false);return;}
      await new Promise(r=>setTimeout(r,800)); // aguarda trigger criar o perfil
      await onSuccess(data.user);
    } else {
      const{data,error}=await supabase.auth.signInWithPassword({email:form.email.trim(),password:form.password});
      if(error){setServerErr("E-mail ou senha inválidos.");setLoading(false);return;}
      await onSuccess(data.user);
    }
    setLoading(false);
  }

  return(
    <><style>{css}</style><div className="mesh"/>
    <div className="auth-wrap" style={{position:"relative",zIndex:1}}>
      <div className="auth-card">
        <button onClick={onBack} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:13,marginBottom:20}}>← Voltar</button>
        <div className="syne" style={{fontSize:20,fontWeight:800,color:"var(--g)",display:"flex",alignItems:"center",gap:9,marginBottom:20}}>
          <div className="logomark">FQ</div>FinQuest
        </div>
        <div className="syne" style={{fontSize:22,fontWeight:800,marginBottom:4}}>{isSignup?"Criar conta grátis":"Entrar"}</div>
        <div style={{fontSize:13,color:"var(--muted)",marginBottom:24}}>{isSignup?"Comece sua jornada financeira.":"Bem-vindo de volta!"}</div>
        {isSignup&&(
          <div className="fg">
            <label className="ilabel">Nome completo</label>
            <input className="inp" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Seu nome" style={{borderColor:errors.name?"var(--red)":""}}/>
            {errors.name&&<div style={{color:"var(--red)",fontSize:12,marginTop:4}}>{errors.name}</div>}
          </div>
        )}
        <div className="fg">
          <label className="ilabel">E-mail</label>
          <input className="inp" type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="seu@email.com" style={{borderColor:errors.email?"var(--red)":""}}/>
          {errors.email&&<div style={{color:"var(--red)",fontSize:12,marginTop:4}}>{errors.email}</div>}
        </div>
        <div className="fg">
          <label className="ilabel">Senha</label>
          <input className="inp" type="password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} placeholder="Mín. 6 caracteres" onKeyDown={e=>e.key==="Enter"&&submit()} style={{borderColor:errors.password?"var(--red)":""}}/>
          {errors.password&&<div style={{color:"var(--red)",fontSize:12,marginTop:4}}>{errors.password}</div>}
          {!isSignup && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: -2,
                marginBottom: 16
              }}
            >
              <span
                onClick={() => navigate("/forgot-password")}
                style={{
                  color: "var(--g)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                Esqueceu sua senha?
              </span>
            </div>
          )}
        </div>
        {serverErr&&<div style={{color:"var(--red)",fontSize:12,marginBottom:8,padding:"8px 12px",background:"rgba(255,82,82,.1)",borderRadius:7}}>{serverErr}</div>}
        <button className="btn bprimary" style={{width:"100%",marginTop:6,opacity:loading?0.7:1}} onClick={submit} disabled={loading}>{loading?"Aguarde...":(isSignup?"Criar conta":"Entrar")}</button>
        <div style={{textAlign:"center",marginTop:16,fontSize:13,color:"var(--muted)"}}>
          {isSignup?"Já tem conta? ":"Não tem conta? "}
          <span style={{color:"var(--g)",cursor:"pointer",fontWeight:600}} onClick={onSwitch}>{isSignup?"Fazer login":"Criar conta"}</span>
        </div>
      </div>
    </div></>
  );
}

function AdminLogin({onSuccess,onBack}){
  const[form,setForm]=useState({email:"",password:""});
  const[err,setErr]=useState("");
  const CREDS=[
    {email:"admin@finquest.com",   password:"admin123"},
    {email:"devock69@gmail.com",   password:"admin123#123@"},
  ];
  function attempt(){
    const ok=CREDS.some(c=>c.email===form.email&&c.password===form.password);
    if(ok) onSuccess();
    else setErr("Credenciais inválidas. Verifique e tente novamente.");
  }
  return(
    <><style>{css}</style><div className="mesh"/>
    <div className="auth-wrap" style={{position:"relative",zIndex:1}}>
      <div className="auth-card" style={{borderColor:"rgba(245,200,66,.3)"}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:13,marginBottom:20}}>← Voltar</button>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:34,marginBottom:8}}>🔐</div>
          <div className="syne" style={{fontSize:22,fontWeight:800,marginBottom:3}}>Acesso Restrito</div>
          <div style={{fontSize:13,color:"var(--muted)"}}>Área administrativa</div>
        </div>
        <div className="fg"><label className="ilabel">E-mail admin</label><input className="inp" type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&attempt()}/></div>
        <div className="fg"><label className="ilabel">Senha</label><input className="inp" type="password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&attempt()}/></div>
        {err&&<div style={{color:"var(--red)",fontSize:13,marginBottom:12,background:"rgba(255,82,82,.1)",padding:"9px 13px",borderRadius:8}}>⚠️ {err}</div>}
        <button className="btn bgold-btn" style={{width:"100%"}} onClick={attempt}>Entrar no painel</button>
      </div>
    </div></>
  );
}

// ─── DASHBOARD with real Benchmarks ──────────────────────────────
function DashPage({cash,totalWealth,pnl,portfolio,stocks,xp,xpPct,level,LVL_NAMES,courses,progress,trades,lastUpdated,mktLoading,apiStatus,fetchPrices,macro}){
  const totalPort=totalWealth-cash;
  // Benchmark data usando CDI real do HG Brasil
  const benchData=useMemo(()=>{
    const months=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    let cart=100000,cdi=100000,ibov=100000;
    const monthlyRate=(macro?.cdi||13.75)/100/12;
    return months.slice(0,8).map(m=>{
      cart+=(Math.random()-.38)*6500;
      cdi*=1+monthlyRate;
      ibov+=(Math.random()-.46)*9000;
      return{m,Carteira:Math.round(cart),CDI:Math.round(cdi),Ibovespa:Math.round(Math.max(ibov,60000))};
    });
  },[macro?.cdi]);

  const doneMod=Object.values(progress).reduce((s,set)=>s+set.size,0);
  const totalMod=courses.reduce((s,c)=>s+c.modules.length,0);
  const cdiReturn=((benchData[benchData.length-1].CDI-100000)/100000*100);
  const ibovReturn=((benchData[benchData.length-1].Ibovespa-100000)/100000*100);
  const myReturn=(pnl/100000*100);

  return(
    <div className="page">
      <div className="topbar">
        <div>
          <div className="ptitle syne">Dashboard</div>
          <div className="psub" style={{display:"flex",alignItems:"center",gap:8}}>
            Visão geral da sua jornada
            {apiStatus==="ok"&&lastUpdated&&<span style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"var(--g)"}}><span className="live"/>Tempo real · B3 {lastUpdated.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</span>}
            {apiStatus==="fallback"&&<span style={{fontSize:11,color:"var(--gold)"}}>📅 Último fechamento B3</span>}
            {apiStatus==="error"&&<span style={{fontSize:11,color:"var(--red)"}}>⚠ Erro ao carregar preços</span>}
          </div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <button className="btn bghost bsm" onClick={fetchPrices} disabled={mktLoading}>{mktLoading?<span className="spinner"/>:"🔄"} Atualizar</button>
          <div className="lvlbadge">⭐ Nível {level} — {LVL_NAMES[level]}</div>
        </div>
      </div>

      <div className="g4" style={{marginBottom:18}}>
        {[
          {l:"Patrimônio Total",    v:fmt(totalWealth), sub:fmtP(myReturn),    pos:pnl>=0},
          {l:"Saldo Disponível",    v:fmt(cash),        sub:"livre para investir",neutral:true},
          {l:"Em Carteira",         v:fmt(totalPort),   sub:Object.keys(portfolio).length+" ativos",neutral:true},
          {l:"vs Capital Inicial",  v:fmtP(myReturn),   sub:"desde R$100.000",  pos:pnl>=0},
        ].map(s=>(
          <div key={s.l} className="card">
            <div className="clabel">{s.l}</div>
            <div className="syne" style={{fontSize:18,fontWeight:800}}>{s.v}</div>
            <div style={{fontSize:12,fontWeight:600,marginTop:3,color:s.neutral?"var(--muted)":s.pos?"var(--g)":"var(--red)"}}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="g2" style={{marginBottom:18}}>
        <div className="card">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
            <div>
              <div className="clabel">Patrimônio vs Benchmarks</div>
              <div className="syne" style={{fontSize:18,fontWeight:800}}>{fmt(totalWealth)}</div>
            </div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              {[["#00d68f","Carteira"],["#f5c842","CDI"],["#4d9eff","Ibovespa"]].map(([c,l])=>(
                <span key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,fontWeight:600}}>
                  <span style={{width:10,height:3,background:c,display:"inline-block",borderRadius:2}}/>  {l}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={benchData}>
              <XAxis dataKey="m" tick={{fill:"var(--muted)",fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"var(--muted)",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={<ChartTip/>}/>
              <Line type="monotone" dataKey="Carteira" stroke="#00d68f" strokeWidth={2.5} dot={false} name="Carteira"/>
              <Line type="monotone" dataKey="CDI" stroke="#f5c842" strokeWidth={1.8} dot={false} strokeDasharray="5 3" name="CDI"/>
              <Line type="monotone" dataKey="Ibovespa" stroke="#4d9eff" strokeWidth={1.8} dot={false} strokeDasharray="5 3" name="Ibovespa"/>
            </LineChart>
          </ResponsiveContainer>
          {macro?.ibovChange!=null&&<div style={{fontSize:11,color:"var(--muted)",marginTop:8}}>Ibovespa hoje: <span style={{color:macro.ibovChange>=0?"var(--g)":"var(--red)",fontWeight:700}}>{fmtP(macro.ibovChange)}</span>{macro?.ibov&&<span> · {Math.round(macro.ibov).toLocaleString("pt-BR")} pts</span>}</div>}
          <div style={{display:"flex",gap:10,marginTop:8}}>
            {[["Carteira",myReturn,"var(--g)"],["CDI "+(macro?.cdi||"--")+"% a.a.",cdiReturn,"var(--gold)"],["Ibovespa",ibovReturn,"var(--blue)"]].map(([l,v,c])=>(
              <div key={l} style={{flex:1,padding:"7px 10px",background:"var(--bg2)",borderRadius:8,textAlign:"center"}}>
                <div style={{fontSize:10,color:"var(--muted)",marginBottom:2}}>{l}</div>
                <div style={{fontSize:13,fontWeight:700,color:c}}>{fmtP(v)}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div className="card">
            <div className="clabel">XP & Nível</div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontWeight:700,fontSize:14}}>Nível {level} — {LVL_NAMES[level]}</span>
              <span style={{fontSize:12,color:"var(--muted)"}}>{xp} XP</span>
            </div>
            <div className="xpw"><div className="xpf" style={{width:`${xpPct}%`}}/></div>
            <div style={{fontSize:11,color:"var(--muted)",marginTop:5}}>{Math.round(xpPct)}% para o próximo nível</div>
          </div>
          <div className="card" style={{flex:1}}>
            <div className="clabel" style={{marginBottom:10}}>Progresso Academy</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontWeight:600,fontSize:14}}>{doneMod}/{totalMod} módulos</span>
              <span className="badge bg">{Math.round(doneMod/totalMod*100)||0}%</span>
            </div>
            <div className="prog" style={{marginBottom:12}}><div className="pfill" style={{width:`${doneMod/totalMod*100||0}%`,background:"var(--g)"}}/></div>
            {courses.slice(0,4).map(c=>{
              const d=progress[c.id]?.size||0;
              return(
                <div key={c.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:9}}>
                  <span style={{fontSize:15}}>{c.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
                      <span style={{color:"var(--muted)"}}>{c.title}</span>
                      <span style={{color:d===c.modules.length?"var(--g)":"var(--muted)"}}>{d}/{c.modules.length}</span>
                    </div>
                    <div className="prog" style={{height:3}}><div className="pfill" style={{width:`${(d/c.modules.length)*100}%`,background:c.color}}/></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <div className="clabel" style={{marginBottom:12}}>Minha Carteira</div>
          {!Object.keys(portfolio).length?(
            <div style={{textAlign:"center",padding:"28px 0",color:"var(--muted)"}}><div style={{fontSize:28,marginBottom:8}}>📂</div><div>Use o Simulador para comprar ações!</div></div>
          ):(
            <div className="slist">
              {Object.entries(portfolio).map(([t,pos])=>{
                const s=stocks.find(s=>s.ticker===t);
                const ret=s?((s.price-pos.avgPrice)/pos.avgPrice*100).toFixed(2):0;
                return(
                  <div key={t} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:"var(--bg2)",borderRadius:8}}>
                    <div><div style={{fontWeight:700}}>{t}</div><div style={{fontSize:11,color:"var(--muted)"}}>{pos.qty} ações · PM {fmt(pos.avgPrice)}</div></div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontWeight:600}}>{s?fmt(s.price*pos.qty):"—"}</div>
                      <div style={{fontSize:11,color:ret>=0?"var(--g)":"var(--red)"}}>{ret>=0?"+":""}{ret}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="card">
          <div className="clabel" style={{marginBottom:12}}>Últimas Operações</div>
          {!trades.length?(
            <div style={{textAlign:"center",padding:"28px 0",color:"var(--muted)"}}><div style={{fontSize:28,marginBottom:8}}>📋</div><div>Nenhuma operação ainda.</div></div>
          ):(
            <div className="slist">
              {trades.slice(0,8).map((t,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:"var(--bg2)",borderRadius:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:14}}>{t.type==="buy"?"🟢":"🔴"}</span>
                    <div><div style={{fontWeight:600,fontSize:13}}>{t.type==="buy"?"Compra":"Venda"} {t.ticker}</div><div style={{fontSize:11,color:"var(--muted)"}}>{t.qty} ações</div></div>
                  </div>
                  <div style={{fontWeight:600,fontSize:13}}>{fmt(t.price*t.qty)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// custom useMemo
function useMemo(fn,deps){
  const ref=useRef({v:undefined,d:undefined});
  if(!ref.current.d||deps.some((d,i)=>d!==ref.current.d[i])){ref.current={v:fn(),d:deps};}
  return ref.current.v;
}

// ─── SIMULATOR ────────────────────────────────────────────────────
function SimPage({stocks,portfolio,cash,buyStock,sellStock,lastUpdated,mktLoading,apiStatus,fetchPrices}){
  const[sel,setSel]=useState(null);
  const[qty,setQty]=useState(1);
  const[tab,setTab]=useState("mkt");
  const[info,setInfo]=useState(null);

  const INFO={
    price:{t:"Como funcionam os preços?",b:"Cotações reais da B3 via <strong>Brapi.dev</strong> com ~15min de delay. Atualização automática a cada 5 minutos. Quando indisponível, exibimos o último fechamento conhecido."},
    change:{t:"O que é variação diária?",b:"Indica quanto o ativo subiu ou caiu vs. fechamento anterior. <strong>▲ verde = alta</strong>, <strong>▼ vermelho = queda</strong>. No mercado real, muda a cada segundo durante o pregão (10h–17h)."},
    pm:{t:"Preço Médio (PM)",b:"Média ponderada dos preços de compra. Exemplo: 10 ações a R$30 + 10 a R$40 = PM R$35.<br/><br/><strong>Resultado = (Preço atual − PM) × Quantidade</strong>"},
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
              ?<span style={{color:"var(--gold)"}}>📅 Último fechamento B3 — atualizando...</span>
              :apiStatus==="idle"||loading
              ?<span style={{color:"var(--muted)"}}>⏳ Conectando à B3...</span>
              :<span style={{color:"var(--red)"}}>⚠ Erro na API</span>
            }
          </div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button className="btn bghost bsm" onClick={fetchPrices} disabled={mktLoading}>{mktLoading?<span className="spinner"/>:"🔄"}</button>
          <div className="card" style={{padding:"8px 15px"}}><div style={{fontSize:10,color:"var(--muted)"}}>Saldo</div><div className="syne" style={{fontWeight:800,color:"var(--g)",fontSize:15}}>{fmt(cash)}</div></div>
          <div className="card" style={{padding:"8px 15px"}}><div style={{fontSize:10,color:"var(--muted)"}}>Em carteira</div><div className="syne" style={{fontWeight:800,fontSize:15}}>{fmt(totalPort)}</div></div>
        </div>
      </div>

      <div style={{padding:"10px 15px",background:"rgba(77,158,255,.06)",border:"1px solid rgba(77,158,255,.2)",borderRadius:10,marginBottom:20,display:"flex",gap:11,alignItems:"center",fontSize:13}}>
        <span>ℹ️</span>
        <div style={{flex:1,color:"var(--muted)"}}>
          {apiStatus==="ok"
            ?"✅ Cotações em tempo real via Brapi.dev (B3 com ~15min delay). Auto-atualização a cada 5 min."
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
        <div className="g2">
          <div className="card" style={{padding:0,overflow:"hidden"}}>
            <div style={{display:"flex",padding:"10px 16px",borderBottom:"1px solid var(--b)",gap:10}}>
              {[["72px","Ativo"],["1fr","Empresa"],["100px","Preço"],["80px","Var.%"],["76px",""]].map(([w,h])=>(
                <div key={h} style={{width:w,flexShrink:0,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:"var(--muted)",flex:h==="Empresa"?"1":"none"}}>{h}</div>
              ))}
            </div>
            {stocks.map(s=>(
              <div key={s.ticker} className="stk-row" style={{background:sel?.ticker===s.ticker?"rgba(0,214,143,.04)":""}}>
                <div style={{width:64,flexShrink:0,cursor:"pointer"}} onClick={()=>{setSel(s);setQty(1);}}>
                  <span className="syne" style={{fontWeight:700,color:"var(--g)",fontSize:12}}>{s.ticker}</span>
                </div>
                <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>{setSel(s);setQty(1);}}>
                  <div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
                  <div style={{fontSize:11,color:"var(--muted)"}}>{s.sector}</div>
                </div>
                <div style={{width:96,flexShrink:0}}>
                  <span style={{fontWeight:700,fontSize:13}}>R${s.price.toFixed(2)}</span>
                </div>
                <div style={{width:78,flexShrink:0}}>
                  <span className={"badge "+(s.change>=0?"bg":"br")}>{s.change>=0?"▲":"▼"}{Math.abs(s.change).toFixed(2)}%</span>
                </div>
                <div style={{width:68,flexShrink:0}}>
                  <button className="btn bghost bxs" onClick={()=>{setSel(s);setQty(1);}}>Operar</button>
                </div>
              </div>
            ))}
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
            {Object.entries(portfolio).map(([t,pos])=>{
              const s=stocks.find(s=>s.ticker===t);
              const ret=s?(s.price-pos.avgPrice)/pos.avgPrice*100:0;
              return(
                <div key={t} className="card" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 120px",alignItems:"center",padding:"16px 20px"}}>
                  <div><div className="syne" style={{fontWeight:700,color:"var(--g)"}}>{t}</div><div style={{fontSize:11,color:"var(--muted)"}}>{s?.name}</div></div>
                  <div><div style={{fontSize:10,color:"var(--muted)"}}>Qtd</div><div style={{fontWeight:600}}>{pos.qty}</div></div>
                  <div>
                    <div style={{fontSize:10,color:"var(--muted)",display:"flex",gap:4,alignItems:"center"}}>PM <button onClick={()=>setInfo("pm")} style={{background:"rgba(77,158,255,.15)",border:"none",color:"var(--blue)",fontSize:9,fontWeight:700,cursor:"pointer",borderRadius:99,padding:"1px 5px"}}>i</button></div>
                    <div style={{fontWeight:600}}>{fmt(pos.avgPrice)}</div>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:"var(--muted)"}}>Resultado</div>
                    <div style={{fontWeight:700,color:ret>=0?"var(--g)":"var(--red)"}}>{fmtP(ret)}</div>
                    <div style={{fontSize:11,color:"var(--muted)"}}>{s?fmt(s.price*pos.qty):"—"}</div>
                  </div>
                  <button className="btn bred bsm" onClick={()=>sellStock(t,pos.qty)}>Vender tudo</button>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

// ─── ACADEMY ─────────────────────────────────────────────────────
function AcademyPage({courses,progress,completeModule}){
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

// ─── CALCULADORAS ─────────────────────────────────────────────────
function CalcPage({macro}){
  const[tab,setTab]=useState("j");
  const[j,setJ]=useState({i:10000,m:500,t:0.8,p:60});
  const calcData=()=>{
    let v=j.i;const d=[];
    for(let i=0;i<=j.p;i+=6){d.push({mes:i===0?"Hoje":i+"m",value:Math.round(v)});for(let k=0;k<6&&i+k<j.p;k++) v=v*(1+j.t/100)+j.m;}
    return{d,final:v,juros:v-j.i-(j.m*j.p)};
  };
  const{d,final,juros}=calcData();
  return(
    <div className="page">
      <div className="topbar">
        <div><div className="ptitle syne">Calculadoras</div><div className="psub">Simule seus investimentos</div></div>
        <div style={{display:"flex",gap:8,fontSize:12}}>
          {macro?.selic&&<span style={{background:"var(--bg2)",border:"1px solid var(--b)",borderRadius:99,padding:"4px 12px"}}>SELIC <span style={{color:"var(--g)",fontWeight:700}}>{macro.selic}% a.a.</span></span>}
          {macro?.cdi&&<span style={{background:"var(--bg2)",border:"1px solid var(--b)",borderRadius:99,padding:"4px 12px"}}>CDI <span style={{color:"var(--gold)",fontWeight:700}}>{macro.cdi}% a.a.</span></span>}
          {macro?.ipca&&<span style={{background:"var(--bg2)",border:"1px solid var(--b)",borderRadius:99,padding:"4px 12px"}}>IPCA <span style={{color:"var(--muted)",fontWeight:700}}>{macro.ipca}%</span></span>}
        </div>
      </div>
      <div className="tabs" style={{marginBottom:26,width:"fit-content"}}>
        {[["j","📈 Juros Compostos"],["a","🏖️ Aposentadoria"],["d","💰 Dividendos"]].map(([k,l])=>(
          <button key={k} className={`tab${tab===k?" act":""}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>
      {tab==="j"&&(
        <div className="g2">
          <div className="card">
            {[["Valor inicial (R$)","i",1000],["Aporte mensal (R$)","m",100],["Taxa mensal (%)","t",0.1],["Período (meses)","p",12]].map(([l,k,st])=>(
              <div key={k} className="fg"><label className="ilabel">{l}</label><input className="inp" type="number" step={st} value={j[k]} onChange={e=>setJ(p=>({...p,[k]:parseFloat(e.target.value)||0}))}/></div>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{background:"var(--bg1)",border:"1px solid var(--b)",borderRadius:12,padding:22,textAlign:"center"}}>
              <div style={{fontSize:12,color:"var(--muted)",marginBottom:6}}>Valor final estimado</div>
              <div className="syne" style={{fontSize:32,fontWeight:800,color:"var(--g)"}}>{fmt(final)}</div>
              <div style={{marginTop:6,fontSize:12,color:"var(--muted)"}}>Juros ganhos: <span style={{color:"var(--g)",fontWeight:700}}>{fmt(juros)}</span></div>
            </div>
            <div className="card">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={d}>
                  <defs><linearGradient id="jg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00d68f" stopOpacity={.2}/><stop offset="95%" stopColor="#00d68f" stopOpacity={0}/></linearGradient></defs>
                  <XAxis dataKey="mes" tick={{fill:"var(--muted)",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"var(--muted)",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Area type="monotone" dataKey="value" stroke="#00d68f" strokeWidth={2} fill="url(#jg)" name="Valor"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      {tab==="a"&&<ApoCalc macro={macro}/>}
      {tab==="d"&&<DivCalc/>}
    </div>
  );
}
function ApoCalc({macro}){
  const[s,setS]=useState({i:30,a:65,r:5000});
  const anos=s.a-s.i;const fv=s.r*300;
  // Usa SELIC mensal real como taxa de referência (simplificado)
  const taxa=(macro?.selic||13.75)/100/12;
  const m=anos*12;
  const aporte=m>0?Math.round(fv/((Math.pow(1+taxa,m)-1)/taxa)):0;
  return(
    <div className="g2">
      <div className="card">{[["Idade atual","i",1],["Aposentar com (anos)","a",1],["Renda mensal desejada (R$)","r",500]].map(([l,k,st])=>(
        <div key={k} className="fg"><label className="ilabel">{l}</label><input className="inp" type="number" step={st} value={s[k]} onChange={e=>setS(p=>({...p,[k]:parseFloat(e.target.value)||0}))}/></div>
      ))}</div>
      <div style={{background:"var(--bg1)",border:"1px solid var(--b)",borderRadius:12,padding:28,display:"flex",flexDirection:"column",justifyContent:"center"}}>
        <div style={{fontSize:12,color:"var(--muted)",marginBottom:6}}>Aporte mensal necessário</div>
        <div className="syne" style={{fontSize:30,fontWeight:800,color:"var(--g)"}}>{fmt(aporte)}/mês</div>
        <div style={{marginTop:12,color:"var(--muted)",fontSize:13,lineHeight:1.6}}>Com {anos} anos e SELIC {(macro?.selic||13.75).toFixed(2)}% a.a. ({(taxa*100).toFixed(2)}%/mês), precisará acumular <span style={{color:"var(--g)",fontWeight:700}}>{fmt(fv)}</span> para gerar a renda desejada.</div>
      </div>
    </div>
  );
}
function DivCalc(){
  const[inv,setInv]=useState(50000);const[dy,setDy]=useState(8);
  const mensal=(inv*(dy/100))/12;
  return(
    <div className="g2">
      <div className="card">
        <div className="fg"><label className="ilabel">Valor investido (R$)</label><input className="inp" type="number" step={5000} value={inv} onChange={e=>setInv(+e.target.value||0)}/></div>
        <div className="fg"><label className="ilabel">Dividend Yield anual (%)</label><input className="inp" type="number" step={0.5} value={dy} onChange={e=>setDy(+e.target.value||0)}/></div>
      </div>
      <div style={{background:"var(--bg1)",border:"1px solid var(--b)",borderRadius:12,padding:28,display:"flex",flexDirection:"column",justifyContent:"center"}}>
        <div style={{fontSize:12,color:"var(--muted)",marginBottom:6}}>Renda mensal estimada</div>
        <div className="syne" style={{fontSize:30,fontWeight:800,color:"var(--g)"}}>{fmt(mensal)}</div>
        <div style={{marginTop:6,fontSize:12,color:"var(--muted)"}}>Anual: <span style={{color:"var(--g)",fontWeight:700}}>{fmt(mensal*12)}</span></div>
      </div>
    </div>
  );
}

// ─── NEWS / WATCHLIST ─────────────────────────────────────────────
function NewsPage({stocks,apiStatus}){
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

// ─── DUEL MODE ────────────────────────────────────────────────────
function DuelPage({user,totalWealth,earnXp,showToast}){
  const[phase,setPhase]=useState("lobby");
  const[opp,setOpp]=useState(null);
  const[myVal,setMyVal]=useState(totalWealth);
  const[oppVal,setOppVal]=useState(100000);
  const[round,setRound]=useState(0);
  const[hist,setHist]=useState([]);
  const[animating,setAnimating]=useState(false);
  const ROUNDS=5;

  function startDuel(o){setOpp(o);setMyVal(totalWealth);setOppVal(100000);setRound(0);setHist([]);setPhase("duel");}

  function playRound(choice){
    if(animating) return;
    setAnimating(true);
    setTimeout(()=>{
      const myMult=choice==="bull"?1:choice==="bear"?-1:0;
      const myΔ=myMult*(Math.random()*.07+.01);
      const oppΔ=(Math.random()>.45?1:-1)*(Math.random()*.06+.01);
      const nMy=+(myVal*(1+myΔ)).toFixed(2);
      const nOpp=+(oppVal*(1+oppΔ)).toFixed(2);
      setMyVal(nMy);setOppVal(nOpp);
      const entry={r:round+1,choice,myΔ,oppΔ,myVal:nMy,oppVal:nOpp};
      setHist(h=>[...h,entry]);
      setRound(r=>r+1);
      setAnimating(false);
      if(round+1>=ROUNDS) setTimeout(()=>setPhase("result"),700);
    },1200);
  }

  const chartData=hist.map(r=>({r:"R"+r.r,Você:r.myVal,Oponente:r.oppVal}));
  const won=myVal>oppVal;

  // Premia o XP UMA vez quando o duelo termina em vitória — antes era chamado
  // durante o render, premiando a cada re-render e nunca de forma confiável.
  const awarded=useRef(false);
  useEffect(()=>{
    if(phase==="result" && won && !awarded.current){ awarded.current=true; earnXp(500); showToast("+500 XP pela vitória!"); }
    if(phase!=="result") awarded.current=false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[phase]);

  if(phase==="result"){
    return(
      <div className="page">
        <div style={{textAlign:"center",padding:"20px 0 36px"}}>
          <div style={{fontSize:60,marginBottom:14}}>{won?"🏆":"😤"}</div>
          <div className="syne" style={{fontSize:38,fontWeight:800,color:won?"var(--gold)":"var(--muted)",marginBottom:6}}>{won?"Vitória!":"Derrota"}</div>
          <div style={{fontSize:15,color:"var(--muted)",marginBottom:5}}>{won?"Você venceu "+opp.name+" com "+fmt(myVal)+"!":opp.name+" venceu com "+fmt(oppVal)+"."}</div>
          {won&&<div style={{color:"var(--gold)",fontWeight:700,fontSize:15}}>+500 XP conquistados! 🎉</div>}
        </div>
        {chartData.length>0&&(
          <div className="card" style={{marginBottom:22}}>
            <div className="clabel" style={{marginBottom:12}}>Evolução das carteiras</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <XAxis dataKey="r" tick={{fill:"var(--muted)",fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"var(--muted)",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                <Tooltip content={<ChartTip/>}/>
                <Line type="monotone" dataKey="Você" stroke="#00d68f" strokeWidth={2.5} dot={{r:4}} name="Você"/>
                <Line type="monotone" dataKey="Oponente" stroke="#4d9eff" strokeWidth={2} dot={{r:4}} strokeDasharray="4 3" name="Oponente"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div style={{display:"flex",gap:11,justifyContent:"center"}}>
          <button className="btn bprimary" onClick={()=>setPhase("lobby")}>🔄 Novo duelo</button>
          <button className="btn boutline" onClick={()=>setPhase("lobby")}>← Lobby</button>
        </div>
      </div>
    );
  }

  if(phase==="duel") return(
    <div className="page">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <div className="ptitle syne">Rodada {round+1} de {ROUNDS}</div>
        <div style={{display:"flex",gap:5}}>
          {Array.from({length:ROUNDS}).map((_,i)=>(
            <div key={i} style={{width:28,height:5,borderRadius:99,background:i<round?"var(--g)":i===round?"var(--gold)":"var(--b)"}}/>
          ))}
        </div>
      </div>
      <div className="duel-vs" style={{marginBottom:22}}>
        <div className="duel-side">
          <div style={{width:64,height:64,borderRadius:"50%",background:"linear-gradient(135deg,var(--g),#00a86b)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:20,margin:"0 auto 9px",color:"#000"}}>{user?.name?.slice(0,2).toUpperCase()}</div>
          <div style={{fontWeight:700}}>{user?.name||"Você"}</div>
          <div className="syne" style={{fontSize:20,fontWeight:800,color:"var(--g)",marginTop:5}}>{fmt(myVal)}</div>
          <div style={{fontSize:12,color:myVal>=totalWealth?"var(--g)":"var(--red)",marginTop:2}}>{fmtP((myVal-totalWealth)/totalWealth*100)}</div>
        </div>
        <div className="syne" style={{fontSize:24,fontWeight:800,color:"var(--gold)",padding:"0 8px"}}>VS</div>
        <div className="duel-side">
          <div style={{width:64,height:64,borderRadius:"50%",background:"linear-gradient(135deg,#7c6aff,#4d9eff)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:20,margin:"0 auto 9px"}}>{opp.avatar}</div>
          <div style={{fontWeight:700}}>{opp.name}</div>
          <div className="syne" style={{fontSize:20,fontWeight:800,color:"var(--blue)",marginTop:5}}>{fmt(oppVal)}</div>
          <div style={{fontSize:12,color:oppVal>=100000?"var(--g)":"var(--red)",marginTop:2}}>{fmtP((oppVal-100000)/100000*100)}</div>
        </div>
      </div>

      <div className="card" style={{textAlign:"center",marginBottom:18}}>
        {animating?(
          <div>
            <div className="spinner" style={{margin:"0 auto 12px",width:32,height:32,borderWidth:3}}/>
            <div style={{fontSize:15,fontWeight:600}}>Processando rodada...</div>
          </div>
        ):(
          <>
            <div className="syne" style={{fontSize:17,fontWeight:700,marginBottom:5}}>Sua aposta para rodada {round+1}</div>
            <div style={{fontSize:13,color:"var(--muted)",marginBottom:18}}>O que você acredita que vai acontecer com o mercado?</div>
            <div style={{display:"flex",gap:11,justifyContent:"center"}}>
              <button className="btn bprimary" style={{fontSize:15,padding:"12px 26px"}} onClick={()=>playRound("bull")}>📈 Alta</button>
              <button className="btn boutline" style={{fontSize:15,padding:"12px 26px"}} onClick={()=>playRound("neutral")}>➡️ Neutro</button>
              <button className="btn bred" style={{fontSize:15,padding:"12px 26px"}} onClick={()=>playRound("bear")}>📉 Baixa</button>
            </div>
          </>
        )}
      </div>

      {hist.length>0&&(
        <div className="card">
          <div className="clabel" style={{marginBottom:11}}>Histórico</div>
          {hist.slice().reverse().map(r=>(
            <div key={r.r} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 11px",background:"var(--bg2)",borderRadius:7,marginBottom:6,fontSize:13}}>
              <span style={{color:"var(--muted)"}}>R{r.r}</span>
              <span>Aposta: <strong>{r.choice==="bull"?"📈 Alta":r.choice==="bear"?"📉 Baixa":"➡️ Neutro"}</strong></span>
              <span style={{color:r.myΔ>=0?"var(--g)":"var(--red)"}}>{fmtP(r.myΔ*100)}</span>
              <span style={{color:r.oppΔ>=0?"var(--blue)":"var(--red)"}}>{opp.name.split(" ")[0]}: {fmtP(r.oppΔ*100)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Lobby
  return(
    <div className="page">
      <div className="topbar"><div><div className="ptitle syne">⚔️ Duelo de Carteiras</div><div className="psub">Compita em {ROUNDS} rodadas — quem ganhar mais vence!</div></div></div>
      <div style={{padding:"14px 18px",background:"rgba(245,200,66,.06)",border:"1px solid rgba(245,200,66,.2)",borderRadius:10,marginBottom:26,fontSize:13,color:"var(--muted)"}}>
        <strong style={{color:"var(--gold)"}}>Como funciona: </strong>
        Em cada rodada, você aposta em <strong style={{color:"var(--g)"}}>Alta</strong>, <strong style={{color:"var(--red)"}}>Baixa</strong> ou <strong>Neutro</strong>. Sua carteira cresce ou encolhe conforme o resultado. Quem terminar com mais patrimônio ganha <strong style={{color:"var(--gold)"}}>+500 XP</strong>!
      </div>
      <div className="g2">
        {OPPONENTS.map(o=>(
          <div key={o.id} className="card" style={{display:"flex",gap:14,alignItems:"center"}}>
            <div style={{width:50,height:50,borderRadius:"50%",background:"linear-gradient(135deg,#ff9f43,#ff6b6b)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:17,flexShrink:0}}>{o.avatar}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:15}}>{o.name}</div>
              <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{o.style}</div>
              <div style={{display:"flex",gap:11,marginTop:6,fontSize:12}}>
                <span>🏆 <strong>{o.wins}</strong>V/{o.losses}D</span>
                <span className="badge bg">{Math.round(o.wins/(o.wins+o.losses)*100)}% win</span>
              </div>
            </div>
            <button className="btn bprimary bsm" onClick={()=>startDuel(o)}>Desafiar</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── RANKING ──────────────────────────────────────────────────────
function RankPage({totalWealth,user}){
  const[list,setList]=useState([]);
  const[loading,setLoading]=useState(true);
  const LVL_NAMES=["","Iniciante","Investidor","Estrategista","Trader","Mestre"];
  function lvlName(xp){return xp<500?LVL_NAMES[1]:xp<1500?LVL_NAMES[2]:xp<3000?LVL_NAMES[3]:xp<5000?LVL_NAMES[4]:LVL_NAMES[5];}

  function fetchRank(){
    setLoading(true);
    supabase.from("profiles").select("id,name,xp,cash,total_wealth").order("total_wealth",{ascending:false}).limit(50)
      .then(({data})=>{ if(data) setList(data); setLoading(false); });
  }
  useEffect(()=>{fetchRank();},[]);

  // reordena no frontend usando o valor em tempo real do usuário logado
  const sortedList=list.map(r=>({
    ...r,
    _wealth: r.id===user?.id ? totalWealth : (r.total_wealth??r.cash??100000)
  })).sort((a,b)=>b._wealth-a._wealth);

  const myRankIdx=sortedList.findIndex(r=>r.id===user?.id);
  const myPos=myRankIdx===-1?null:myRankIdx+1;

  return(
    <div className="page">
      <div className="topbar">
        <div><div className="ptitle syne">Ranking Global</div><div className="psub">Patrimônio total (saldo + carteira)</div></div>
        <button className="btn bghost bsm" onClick={fetchRank}>↻</button>
      </div>

      {/* Card do usuário logado */}
      <div className="card" style={{marginBottom:18,borderColor:"rgba(0,214,143,.2)",background:"rgba(0,214,143,.04)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:11}}>
          <div className="syne" style={{fontSize:24,fontWeight:800,color:"var(--g)",width:40,textAlign:"center"}}>{myPos?`#${myPos}`:"—"}</div>
          <div className="avatar" style={{width:36,height:36,fontSize:12}}>{user?.name?.slice(0,2).toUpperCase()}</div>
          <div><div style={{fontWeight:700}}>Você — {user?.name}</div><div style={{fontSize:11,color:"var(--muted)"}}>Patrimônio total</div></div>
        </div>
        <div className="syne" style={{fontSize:20,fontWeight:800,color:"var(--g)"}}>{fmt(totalWealth)}</div>
      </div>

      <div className="card" style={{padding:0,overflow:"hidden"}}>
        {loading&&<div style={{padding:24,textAlign:"center",color:"var(--muted)",fontSize:13}}>Carregando ranking...</div>}
        {!loading&&list.length===0&&<div style={{padding:24,textAlign:"center",color:"var(--muted)",fontSize:13}}>Nenhum usuário no ranking ainda.</div>}
        {sortedList.map((r,i)=>{
          const isMe=r.id===user?.id;
          const wealth=isMe?totalWealth:(r.total_wealth??r.cash??100000);
          const pnl=wealth-100000;
          const notInvested=!isMe&&wealth===100000&&r.cash===100000;
          return(
            <div key={r.id} style={{display:"flex",alignItems:"center",gap:11,padding:"13px 18px",borderBottom:i<list.length-1?"1px solid var(--b)":"none",background:isMe?"rgba(0,214,143,.05)":""}}>
              <div className="syne" style={{width:30,fontSize:16,fontWeight:800,color:i===0?"var(--gold)":i===1?"#C0C0C0":i===2?"#CD7F32":"var(--muted)",textAlign:"center"}}>
                {i<3?["🥇","🥈","🥉"][i]:`#${i+1}`}
              </div>
              <div className="avatar" style={{width:36,height:36,fontSize:11,background:isMe?"linear-gradient(135deg,#00d68f,#4d9eff)":""}}>
                {(r.name||"?").slice(0,2).toUpperCase()}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
                  {r.name}
                  {isMe&&<span style={{fontSize:10,color:"var(--g)"}}>← você</span>}
                  {notInvested&&<span style={{fontSize:10,color:"var(--muted)",background:"var(--sf)",padding:"1px 6px",borderRadius:4}}>não investiu</span>}
                </div>
                <div style={{fontSize:11,color:"var(--muted)"}}>{lvlName(r.xp)} · {r.xp} XP</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div className="syne" style={{fontWeight:800,fontSize:17}}>{fmt(wealth)}</div>
                {!notInvested&&<div style={{fontSize:11,color:pnl>=0?"var(--g)":"var(--red)",marginTop:2}}>{pnl>=0?"+":""}{fmt(pnl)}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── AI TUTOR (real Anthropic API call) ───────────────────────────
function AIPage(){
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
        system:`Você é a Finny, assistente financeira inteligente do FinQuest — plataforma brasileira de educação financeira gamificada.

Personalidade: direta, acolhedora e encorajadora. Faz o usuário se sentir capaz, não intimidado. Sem jargão de guru.

Especialidades: renda fixa (Tesouro Direto, CDB, LCI, LCA, poupança), ações (B3), FIIs, ETFs, CDI, SELIC, IPCA, dividendos, carteiras diversificadas, juros compostos.

Regras:
- Responda sempre em português brasileiro
- Use exemplos com valores em R$
- Formate com **negrito** para termos importantes e conceitos-chave
- Seja concisa — prefira respostas diretas e objetivas
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

// ─── PROFILE ──────────────────────────────────────────────────────
function ProfilePage({user,xp,xpPct,level,LVL_NAMES,totalWealth,pnl,courses,progress,trades,onLogout,updateProfile}){
  const doneMod=Object.values(progress).reduce((s,set)=>s+set.size,0);
  const[editing,setEditing]=useState(false);
  const[nameVal,setNameVal]=useState(user?.name||"");

  function saveProfile(){
    const n=nameVal.trim();
    if(!n) return;
    updateProfile({name:n});
    setEditing(false);
  }

  return(
    <div className="page">
      <div className="topbar"><div className="ptitle syne">Meu Perfil</div></div>
      <div className="g2" style={{marginBottom:18}}>
        <div className="card" style={{display:"flex",gap:16,alignItems:"center"}}>
          <div className="avatar" style={{width:64,height:64,fontSize:20}}>{user?.name?.slice(0,2).toUpperCase()}</div>
          <div style={{flex:1,minWidth:0}}>
            {editing?(
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
                <input
                  className="inp"
                  value={nameVal}
                  onChange={e=>setNameVal(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter")saveProfile();if(e.key==="Escape")setEditing(false);}}
                  style={{flex:1,fontSize:16,fontWeight:700}}
                  autoFocus
                />
                <button className="btn bprimary" style={{padding:"6px 14px",fontSize:13}} onClick={saveProfile}>Salvar</button>
                <button className="btn boutline" style={{padding:"6px 10px",fontSize:13}} onClick={()=>{setEditing(false);setNameVal(user?.name||"");}}>✕</button>
              </div>
            ):(
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                <div className="syne" style={{fontSize:22,fontWeight:800}}>{user?.name}</div>
                <button className="btn boutline" style={{padding:"3px 10px",fontSize:11,opacity:0.7}} onClick={()=>{setNameVal(user?.name||"");setEditing(true);}}>Editar</button>
              </div>
            )}
            <div style={{fontSize:13,color:"var(--muted)",marginBottom:8}}>{user?.email}</div>
            <div className="lvlbadge">⭐ Nível {level} — {LVL_NAMES[level]}</div>
          </div>
        </div>
        <div className="card">
          <div className="clabel" style={{marginBottom:11}}>Experiência</div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span className="syne" style={{fontSize:24,fontWeight:800,color:"var(--gold)"}}>{xp} XP</span>
            <span style={{fontSize:12,color:"var(--muted)"}}>Nível {level}→{level+1}</span>
          </div>
          <div className="xpw" style={{height:9}}><div className="xpf" style={{width:`${xpPct}%`}}/></div>
          <div style={{fontSize:11,color:"var(--muted)",marginTop:5}}>{Math.round(xpPct)}% para o próximo nível</div>
        </div>
      </div>
      <div className="g4" style={{marginBottom:20}}>
        {[["💰",fmt(totalWealth),"Patrimônio",null],
          [pnl>=0?"📈":"📉",fmtP((pnl/100000)*100),"Resultado",pnl>=0?"var(--g)":"var(--red)"],
          ["🎓",String(doneMod),"Módulos",null],
          ["⚡",trades.length.toString(),"Operações",null],
        ].map(([icon,val,label,col])=>(
          <div key={label} className="card" style={{textAlign:"center"}}>
            <div style={{fontSize:24,marginBottom:7}}>{icon}</div>
            <div className="syne" style={{fontSize:19,fontWeight:800,color:col||"var(--text)"}}>{val}</div>
            <div style={{fontSize:11,color:"var(--muted)",marginTop:3}}>{label}</div>
          </div>
        ))}
      </div>
      <button className="btn boutline" onClick={onLogout}>← Sair da conta</button>
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────
function AdminPanel({courses,setCourses,events,setEvents,onExit}){
  const[page,setPage]=useState("overview");
  const[toast,setToast]=useState(null);
  return(
    <><style>{css}</style><div className="mesh"/>
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
          <div className="fg"><label className="ilabel">URL YouTube</label><input className="inp" value={d.url} onChange={e=>setD(p=>({...p,url:e.target.value}))} placeholder="https://youtube.com/watch?v=..."/><div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>URL normal — convertida automaticamente para embed.</div></div>
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
      <div className="card" style={{padding:0,overflow:"hidden"}}>
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
            <div style={{fontSize:12,color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email||"—"}</div>
            <div style={{fontSize:12,color:"var(--muted)"}}>{new Date(u.created_at).toLocaleDateString("pt-BR")}</div>
            <div style={{fontWeight:600,color:"var(--gold)",fontSize:13}}>{u.xp}</div>
            <span className={`badge ${lvlBadge(u.xp)}`} style={{fontSize:11}}>{lvlName(u.xp)}</span>
            <button className="btn boutline" style={{padding:"3px 8px",fontSize:11,opacity:.7}}
              onClick={()=>{setEditId(u.id);setEditName(u.name||"");}}>✏</button>
          </div>
        ))}
      </div>
    </div>
  );
}
