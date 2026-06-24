// Tooltip customizado dos gráficos do Recharts.
import { fmt } from "../lib/format";

export const ChartTip=({active,payload,label})=>{
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
