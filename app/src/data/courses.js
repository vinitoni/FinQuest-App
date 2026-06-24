// Conteúdo inicial da Academy: cursos, módulos e blocos.

export const COURSES = [
  {id:"c1",title:"Introdução ao Mercado",icon:"🎓",color:"#00d68f",level:"Iniciante",duration:"2h",
   modules:[
    {id:"m1",title:"O que é investir?",blocks:[
      {id:"b1",type:"text",content:"<h2>O que é investir?</h2><p>Investir significa aplicar dinheiro em ativos para fazê-lo crescer. Quando parado, a <strong>inflação corrói</strong> seu poder de compra.</p><ul><li><strong>Renda fixa:</strong> retorno previsível, menor risco</li><li><strong>Renda variável:</strong> maior potencial, mais risco</li><li><strong>Diversificação:</strong> combinar tipos reduz o risco geral</li></ul>"},
      {id:"b2",type:"quiz",questions:[
        {id:"q1",question:"Por que guardar dinheiro parado pode ser prejudicial?",options:["O banco pode confiscá-lo","A inflação corrói o poder de compra","As notas perdem valor físico","O governo tributa dinheiro parado"],correct:1,explanation:"A inflação faz os preços subirem, diminuindo o poder de compra do dinheiro parado."},
        {id:"q2",question:"O que é renda variável?",options:["Retorno garantido pelo governo","Poupança com rendimento fixo","Investimento cujo retorno depende do mercado","Título do Banco Central"],correct:2,explanation:"Renda variável tem retorno que varia com o mercado: mais risco, maior potencial de retorno."}
      ]}
    ]},
    {id:"m2",title:"Juros compostos",blocks:[
      {id:"b3",type:"text",content:"<h2>Juros Compostos</h2><p>São <em>juros sobre juros</em>, o maior aliado do investidor. O crescimento é <strong>exponencial</strong> com o tempo.</p><blockquote>Retorno Real ≈ Retorno Nominal − Inflação</blockquote><p>Se rende 8%/ano e a inflação é 5%, seu ganho real é de apenas 3%.</p>"},
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
      {id:"b8",type:"text",content:"<h2>CDB</h2><p>Emitido por bancos. Coberto pelo <strong>FGC</strong> até R$250.000.</p><h2>LCI e LCA</h2><p>Isentas de IR para pessoas físicas, o que eleva o retorno líquido.</p>"},
      {id:"b9",type:"quiz",questions:[
        {id:"q1",question:"LCI e LCA têm qual vantagem tributária?",options:["IR reduzido a 5%","Isenção total de IR","Isenção de IOF","Desconto de 50% no IR"],correct:1,explanation:"LCI e LCA são isentas de IR para pessoas físicas, aumentando o retorno líquido."}
      ]}
    ]}
  ]},
  {id:"c3",title:"Fundos Imobiliários",icon:"🏗️",color:"#7c6aff",level:"Intermediário",duration:"4h",
   modules:[{id:"m5",title:"O que são FIIs?",blocks:[
    {id:"b10",type:"text",content:"<h2>FIIs</h2><p>Permitem investir em imóveis de forma fracionada. Receba <strong>dividendos mensais</strong>.</p><p><strong>DY</strong> = Dividendos / Preço × 100</p>"},
    {id:"b11",type:"quiz",questions:[{id:"q1",question:"O que é Dividend Yield?",options:["Preço da cota","Dividendo÷Preço","Taxa de vacância","Valor patrimonial"],correct:1,explanation:"DY = Dividendos ÷ Preço da cota, que indica o rendimento percentual em dividendos."}]}
  ]}]},
  {id:"c4",title:"ETFs",icon:"🌍",color:"#ff9f43",level:"Intermediário",duration:"3h",
   modules:[{id:"m6",title:"O que são ETFs?",blocks:[
    {id:"b12",type:"text",content:"<h2>Exchange Traded Funds</h2><p>ETFs replicam índices. <strong>BOVA11</strong> replica o Ibovespa. <strong>IVVB11</strong> replica o S&P 500.</p>"},
    {id:"b13",type:"quiz",questions:[{id:"q1",question:"O IVVB11 replica qual índice?",options:["Ibovespa","S&P 500","Nasdaq 100","Dow Jones"],correct:1,explanation:"O IVVB11 replica o S&P 500, as maiores empresas americanas via B3."}]}
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
