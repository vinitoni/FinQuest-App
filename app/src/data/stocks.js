// Metadados das ações e preços de fallback (último fechamento da B3).

// JBS concluiu a reincorporação para JBS N.V. em 01/07/2026: a ação deixou de ser
// negociada como JBSS3 e passou a JBSS32 na B3 (listagem principal foi para a NYSE).
export const TICKERS = ["PETR4","VALE3","ITUB4","BBDC4","WEGE3","MGLU3","BBAS3","ABEV3","SUZB3","JBSS32"];

export const STOCK_META = {
  PETR4:{name:"Petrobras",  sector:"Energia"},    VALE3:{name:"Vale",           sector:"Mineração"},
  ITUB4:{name:"Itaú",       sector:"Bancos"},     BBDC4:{name:"Bradesco",       sector:"Bancos"},
  WEGE3:{name:"WEG",        sector:"Industrial"}, MGLU3:{name:"Magalu",         sector:"Varejo"},
  BBAS3:{name:"Banco do Brasil",sector:"Bancos"}, ABEV3:{name:"Ambev",          sector:"Consumo"},
  SUZB3:{name:"Suzano",     sector:"Papel"},      JBSS32:{name:"JBS N.V.",      sector:"Alimentos"},
};

// Preços do último fechamento B3, fallback quando Yahoo Finance e brapi.dev estão
// indisponíveis (última camada da cadeia). Atualizado em: 02/07/2026, fonte Yahoo Finance.
export const FALLBACK = {
  PETR4: 37.83,
  VALE3: 77.97,
  ITUB4: 42.44,
  BBDC4: 18.12,
  WEGE3: 46.26,
  MGLU3:  4.43,
  BBAS3: 19.73,
  ABEV3: 16.20,
  SUZB3: 40.59,
  JBSS32: 62.55,
};

// Variação do último pregão, fonte Yahoo Finance, atualizado em: 02/07/2026.
export const FALLBACK_CHANGE = {
  PETR4: -1.20,
  VALE3: +0.31,
  ITUB4: +3.59,
  BBDC4: +2.66,
  WEGE3: -0.75,
  MGLU3: +1.61,
  BBAS3:  0.00,
  ABEV3: -1.10,
  SUZB3: -3.82,
  JBSS32: -1.48,
};
