// Metadados das ações e preços de fallback (último fechamento da B3).

export const TICKERS = ["PETR4","VALE3","ITUB4","BBDC4","WEGE3","MGLU3","BBAS3","ABEV3","SUZB3","JBSS3"];

export const STOCK_META = {
  PETR4:{name:"Petrobras",  sector:"Energia"},    VALE3:{name:"Vale",           sector:"Mineração"},
  ITUB4:{name:"Itaú",       sector:"Bancos"},     BBDC4:{name:"Bradesco",       sector:"Bancos"},
  WEGE3:{name:"WEG",        sector:"Industrial"}, MGLU3:{name:"Magalu",         sector:"Varejo"},
  BBAS3:{name:"Banco do Brasil",sector:"Bancos"}, ABEV3:{name:"Ambev",          sector:"Consumo"},
  SUZB3:{name:"Suzano",     sector:"Papel"},      JBSS3:{name:"JBS",            sector:"Alimentos"},
};

// Preços do último fechamento B3, fallback quando o Yahoo Finance está indisponível
// Atualizado em: 06/03/2026. O Yahoo Finance substitui estes valores automaticamente.
export const FALLBACK = {
  PETR4: 40.64, // Petrobras, fechamento 05/03 (Investing.com)
  VALE3: 81.29, // Vale, fechamento 05/03 (Investing.com, confirmado)
  ITUB4: 43.51, // Itaú, fechamento 05/03 (Investing.com)
  BBDC4: 20.49, // Bradesco, fechamento 05/03 (Investing.com)
  WEGE3: 46.71, // WEG, fechamento 05/03 (Investing.com)
  MGLU3:  9.64, // Magalu, fechamento 05/03 (aprox., hoje ~9,94)
  BBAS3: 25.00, // BB, fechamento 05/03 (Investing.com)
  ABEV3: 15.10, // Ambev, fechamento 05/03 (aprox., hoje ~15,29)
  SUZB3: 55.90, // Suzano, fechamento 05/03 (aprox., hoje ~56,50)
  JBSS3: 39.03, // JBS, fechamento 05/03 (Investidor10)
};

// Variação do último pregão (05/03 vs 04/03), fonte: Investing.com
export const FALLBACK_CHANGE = {
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
