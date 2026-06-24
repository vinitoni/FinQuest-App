// Cotações da B3: usa a API (Yahoo Finance) quando disponível, senão o último fechamento.
import { useState, useEffect, useCallback } from "react";
import { TICKERS, STOCK_META, FALLBACK, FALLBACK_CHANGE } from "../data/stocks";

export function useMarket(){
  // Constrói lista de ações: usa dados reais da API se disponíveis, senão o último fechamento B3
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
      console.warn("Cotações falharam:", e.message, "usando último fechamento B3");
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
