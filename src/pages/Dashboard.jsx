import { useState, useEffect, useRef } from "react";
import { supabase } from '../lib/supabase'
import {
  getCompanies, getCandidates, getMissions, getReminders,
  updateCandidateStage, updateCandidateScores,
  addCandidateInteraction, addCompanyInteraction,
  createCandidate, createCompany, createMission,
  updateCandidateInfo, updateCandidateCvSummary,
  createClientAccess, revokeClientAccess,
  assignMissionToCandidate, unassignMissionFromCandidate,
  sendMessageToClient, getCompanyMessages,
  STAGE_TO_DB, COMPANY_STATUS_TO_DB, MISSION_STATUS_TO_DB,
} from '../lib/api'

/* ═══════════════════════════════════════════════
   SAME JOB V1 — Headhunter Management Platform
   ═══════════════════════════════════════════════ */

// ── MARKDOWN RENDERER ────────────────────────
const MdCV=({text,colors})=>{
  if(!text)return null;
  const C2=colors||{};
  const lines=text.split('\n');
  const els=[];
  let key=0;
  for(let i=0;i<lines.length;i++){
    const l=lines[i];
    const trimmed=l.trim();
    if(!trimmed){els.push(<div key={key++} style={{height:6}}/>);continue;}
    if(trimmed.startsWith('## ')){
      els.push(<div key={key++} style={{fontSize:13,fontWeight:700,color:C2.acc2||'#a29bfe',textTransform:'uppercase',letterSpacing:.8,marginTop:16,marginBottom:6,paddingBottom:4,borderBottom:`1px solid ${C2.border||'#282d42'}`}}>{trimmed.slice(3)}</div>);
    } else if(trimmed.startsWith('**')&&trimmed.endsWith('**')&&trimmed.split('**').length===3){
      els.push(<div key={key++} style={{fontSize:13,fontWeight:700,color:C2.t1||'#e2e5ef',marginTop:10,marginBottom:2}}>{trimmed.slice(2,-2)}</div>);
    } else if(/^\*\*.*\*\*/.test(trimmed)){
      const html=trimmed.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
      els.push(<div key={key++} style={{fontSize:13,color:C2.t1||'#e2e5ef',lineHeight:1.7,marginTop:8}} dangerouslySetInnerHTML={{__html:html}}/>);
    } else if(trimmed.startsWith('- ')||trimmed.startsWith('• ')||trimmed.startsWith('* ')){
      els.push(<div key={key++} style={{display:'flex',gap:8,fontSize:12.5,color:C2.t2||'#8890a6',lineHeight:1.6,marginLeft:8,marginTop:2}}><span style={{color:C2.acc3||'#00cec9',flexShrink:0,marginTop:2}}>›</span><span>{trimmed.slice(2)}</span></div>);
    } else {
      els.push(<div key={key++} style={{fontSize:13,color:C2.t2||'#8890a6',lineHeight:1.7,marginTop:2}}>{trimmed}</div>);
    }
  }
  return <div>{els}</div>;
};

// ── THEME ────────────────────────────────────
const C = {
  bg:"#0A0E1A",bg2:"#111827",card:"#1A2030",card2:"#212838",
  border:"#2E3650",borderH:"#3D4A66",
  acc:"#0EA5E9",acc2:"#38BDF8",acc3:"#22C55E",
  ok:"#22C55E",warn:"#F59E0B",err:"#EF4444",
  t1:"#F1F5F9",t2:"#94A3B8",t3:"#475569",wh:"#fff",
  shadow:"0 1px 3px rgba(0,0,0,.3)",shadowM:"0 8px 24px rgba(0,0,0,.4)",
};
const STAGES=["Sourcing","Entretien interne","Shortlist","Entretien client","Offre","Placé"];
const SC=[C.t3,C.warn,C.acc2,C.acc,C.acc,C.ok];
const DIMS=["Technique","Soft Skills","Motivation","Fit culturel","Disponibilité"];
const TEAM=[{id:1,n:"Vous",i:"SJ",c:C.acc},{id:2,n:"Alice Martin",i:"AM",c:C.pink},{id:3,n:"Marc Durand",i:"MD",c:C.acc3}];

// ── SVG ICONS ────────────────────────────────
const P={sun:"M12 17a5 5 0 100-10 5 5 0 000 10z M12 1v2m0 18v2m-7.78-16.36l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42m12.72-12.72l1.42-1.42",company:"M3 21h18M3 7v14m18-14v14M9 3h6v4H9zM9 10h1v1H9zm5 0h1v1h-1zM9 14h1v1H9zm5 0h1v1h-1z",users:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",briefcase:"M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16",chart:"M18 20V10M12 20V4M6 20v-6",search:"M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35",plus:"M12 5v14M5 12h14",bell:"M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",x:"M18 6L6 18M6 6l12 12",check:"M20 6L9 17l-5-5",phone:"M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.8 19.8 0 012.12 4.11 2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z",mail:"M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",file:"M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8m8 4H8m2-8H8",edit:"M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z",alert:"M12 22a10 10 0 100-20 10 10 0 000 20zM12 8v4m0 4h.01",zap:"M13 2L3 14h9l-1 8 10-12h-9z",star:"M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z",target:"M12 22a10 10 0 100-20 10 10 0 000 20zM12 18a6 6 0 100-12 6 6 0 000 12z",clock:"M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2",chevR:"M9 18l6-6-6-6",chevD:"M6 9l6 6 6-6",mappin:"M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z",userplus:"M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6",copy:"M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1",spark:"M13 2L3 14h9l-1 8 10-12h-9z",shield:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",msg:"M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",key:"M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.78 7.78 5.5 5.5 0 017.78-7.78z",upload:"M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",download:"M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",send:"M22 2L11 13M22 2l-7 20-4-9-9-4z",link:"M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",logout:"M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"};
const Ic=({n,s=18,c:cl})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={cl||"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{(P[n]||"").split("M").filter(Boolean).map((d,i)=><path key={i} d={"M"+d}/>)}</svg>;

// ── HELPERS ──────────────────────────────────
const gid=()=>Date.now()+Math.floor(Math.random()*9999);
const today=()=>new Date().toISOString().slice(0,10);
const dAgo=d=>{const v=Math.floor((Date.now()-new Date(d).getTime())/864e5);return v<0?0:v;};
const dUntil=d=>Math.max(0,Math.ceil((new Date(d).getTime()-Date.now())/864e5));
const avgS=sc=>sc&&sc.length?Math.round(sc.reduce((a,b)=>a+b,0)/sc.length*10):0;

// ── PRIMITIVES ───────────────────────────────
const Bx=({children,style:s,...p})=><div style={{background:C.card,borderRadius:14,border:`1px solid ${C.border}`,...s}} {...p}>{children}</div>;
const Badge=({c:cl=C.acc,children,onClick:oc})=><span onClick={oc} style={{background:cl+"18",color:cl,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,whiteSpace:"nowrap",cursor:oc?"pointer":"default",letterSpacing:.2}}>{children}</span>;
const Av=({i,s:sz=36,c:cl=C.acc})=><div style={{width:sz,height:sz,borderRadius:"50%",background:cl+"28",color:cl,display:"flex",alignItems:"center",justifyContent:"center",fontSize:sz*.34,fontWeight:700,flexShrink:0}}>{i}</div>;
const Btn=({children,pr,sm,onClick:oc,dis,style:s})=><button onClick={oc} disabled={dis} style={{background:pr?C.acc:"transparent",color:pr?C.wh:C.t2,border:pr?"none":`1px solid ${C.border}`,borderRadius:8,padding:sm?"4px 10px":"8px 16px",fontSize:sm?11:13,fontWeight:600,cursor:dis?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:5,opacity:dis?.45:1,transition:"all .15s",...s}}>{children}</button>;
const Tabs=({tabs,active:a,onChange:oc})=><div style={{display:"flex",gap:3,background:C.bg2,borderRadius:10,padding:3,flexShrink:0}}>{tabs.map(t=><button key={t} onClick={()=>oc(t)} style={{background:a===t?C.acc:"transparent",color:a===t?C.wh:C.t3,border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .15s"}}>{t}</button>)}</div>;
const Inp=({label:l,style:s,...p})=><div style={{display:"flex",flexDirection:"column",gap:3,...s}}>{l&&<label style={{fontSize:10,color:C.t3,textTransform:"uppercase",letterSpacing:.6}}>{l}</label>}<input {...p} style={{width:"100%",background:C.card2,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.t1,fontSize:13,outline:"none",boxSizing:"border-box",...(p.style||{})}}/></div>;
const Txt=({label:l,style:s,...p})=><div style={{display:"flex",flexDirection:"column",gap:3,...s}}>{l&&<label style={{fontSize:10,color:C.t3,textTransform:"uppercase",letterSpacing:.6}}>{l}</label>}<textarea {...p} style={{width:"100%",background:C.card2,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.t1,fontSize:13,outline:"none",boxSizing:"border-box",resize:"vertical",fontFamily:"inherit",...(p.style||{})}}/></div>;
const Sel=({label:l,children,style:s,...p})=><div style={{display:"flex",flexDirection:"column",gap:3,...s}}>{l&&<label style={{fontSize:10,color:C.t3,textTransform:"uppercase",letterSpacing:.6}}>{l}</label>}<select {...p} style={{width:"100%",background:C.card2,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.t1,fontSize:13,outline:"none",boxSizing:"border-box",appearance:"auto",...(p.style||{})}}>{children}</select></div>;
const SearchBar=({v,onChange:oc,ph})=><div style={{position:"relative",flex:1,maxWidth:360}}><div style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:C.t3}}><Ic n="search" s={15}/></div><input value={v} onChange={e=>oc(e.target.value)} placeholder={ph} style={{width:"100%",background:C.card2,border:`1px solid ${C.border}`,borderRadius:10,padding:"8px 12px 8px 34px",color:C.t1,fontSize:13,outline:"none",boxSizing:"border-box"}}/></div>;
const Stat=({label:l,value:v,sub:s,color:cl=C.acc,icon:ic})=><Bx style={{padding:"16px 18px",flex:1,minWidth:140}}><div style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}>{ic&&<Ic n={ic} s={13} c={cl}/>}<span style={{fontSize:11,color:C.t2}}>{l}</span></div><div style={{fontSize:24,fontWeight:700,color:cl}}>{v}</div>{s&&<div style={{fontSize:10,color:C.t3,marginTop:2}}>{s}</div>}</Bx>;

// ── MODAL ────────────────────────────────────
const Modal=({open:o,onClose:oc,title:t,children,wide:w})=>{
  if(!o) return null;
  return <div onClick={oc} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16,backdropFilter:"blur(4px)"}}>
    <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:20,border:`1px solid ${C.border}`,width:w?740:520,maxWidth:"96vw",maxHeight:"88vh",overflow:"auto",padding:26,boxShadow:"0 24px 48px rgba(0,0,0,.4)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <h2 style={{margin:0,fontSize:18,color:C.t1,fontWeight:700}}>{t}</h2>
        <button onClick={oc} style={{background:C.card2,border:"none",borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:C.t3}}><Ic n="x" s={16}/></button>
      </div>
      {children}
    </div>
  </div>;
};

// ── TOAST ─────────────────────────────────────
const Toast=({msg,type:tp})=>{
  if(!msg) return null;
  const cl=tp==="ok"?C.ok:tp==="err"?C.err:C.acc;
  return <div style={{position:"fixed",bottom:24,right:24,background:C.card,border:`1px solid ${cl}44`,borderRadius:12,padding:"12px 20px",color:cl,fontSize:13,fontWeight:600,zIndex:2000,boxShadow:`0 8px 24px ${cl}22`,display:"flex",alignItems:"center",gap:8,animation:"fadeIn .2s ease"}}><Ic n={tp==="ok"?"check":"alert"} s={16} c={cl}/>{msg}<style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style></div>;
};

// ── RADAR ─────────────────────────────────────
const Radar=({scores:sc,size:sz=150})=>{
  const cx=sz/2,r=sz/2-22,n=5;
  const ang=i=>(Math.PI*2*i/n)-Math.PI/2;
  const pt=(i,v)=>[cx+r*(v/10)*Math.cos(ang(i)),cx+r*(v/10)*Math.sin(ang(i))];
  return <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
    {[2,4,6,8,10].map(lv=><polygon key={lv} points={Array.from({length:n},(_,i)=>pt(i,lv).join(",")).join(" ")} fill="none" stroke={C.border} strokeWidth={.8}/>)}
    {Array.from({length:n},(_,i)=><line key={i} x1={cx} y1={cx} x2={pt(i,10)[0]} y2={pt(i,10)[1]} stroke={C.border} strokeWidth={.5}/>)}
    <polygon points={sc.map((_,i)=>pt(i,sc[i]).join(",")).join(" ")} fill={C.acc+"30"} stroke={C.acc} strokeWidth={2}/>
    {sc.map((v,i)=>{const[x,y]=pt(i,v);return <circle key={i} cx={x} cy={y} r={3.5} fill={C.acc} stroke={C.card} strokeWidth={2}/>;} )}
    {sc.map((_,i)=>{const[x,y]=pt(i,11.5);const lb=["Tech","Soft","Motiv","Fit","Dispo"];return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill={C.t3} fontSize={8} fontWeight={600}>{lb[i]}</text>;})}
  </svg>;
};

// ── INTERACTION TYPE HELPERS ──────────────────
const TI={call:"phone",mail:"mail",meeting:"users",doc:"file",interview:"briefcase",source:"search",check:"check",note:"edit"};
const TC={call:C.acc,mail:C.acc2,meeting:C.warn,doc:C.pink,interview:C.acc3,source:C.t3,check:C.ok,note:C.t2};

// ── MA JOURNÉE ───────────────────────────────
const MyDay=({S,goTo})=>{
  const urgents=[];
  S.candidates.forEach(c=>{
    if(c.stage==="Placé") return;
    const last=c.history?.[0];
    const d=last?dAgo(last.date):999;
    if(d>=3) urgents.push({t:"stale",pri:d>=5?"high":"med",text:`${c.name} — aucun contact depuis ${d}j`,sub:`${c.stage} · ${c.missions[0]||"Vivier"} ${c.company?("@ "+c.company):""}`,ic:"alert",cl:d>=5?C.err:C.warn,id:c.id,kind:"candidate"});
  });
  S.missions.forEach(m=>{
    if(m.status==="Placé") return;
    const dl=dUntil(m.deadline);
    if(dl<=30) urgents.push({t:"deadline",pri:dl<=14?"high":"med",text:`Deadline ${m.title} dans ${dl}j`,sub:m.company,ic:"clock",cl:dl<=14?C.err:C.warn,id:m.id,kind:"mission"});
    if(S.candidates.filter(c=>c.missions.includes(m.title)&&c.stage!=="Placé").length===0) urgents.push({t:"empty",pri:"high",text:`${m.title} — 0 candidat dans le pipeline`,sub:m.company,ic:"alert",cl:C.err,id:m.id,kind:"mission"});
  });
  urgents.sort((a,b)=>a.pri==="high"?-1:1);
  const interviews=S.candidates.filter(c=>c.stage==="Entretien client"||c.stage==="Entretien interne");
  const offers=S.candidates.filter(c=>c.stage==="Offre");
  const shortlists=S.candidates.filter(c=>c.stage==="Shortlist");

  return <div>
    <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:22}}>
      <Stat label="À relancer" value={urgents.filter(u=>u.t==="stale").length} icon="alert" color={C.err} sub="Sans contact"/>
      <Stat label="Entretiens" value={interviews.length} icon="briefcase" color={C.acc} sub="En process"/>
      <Stat label="Shortlists" value={shortlists.length} icon="mail" color={C.warn} sub="À présenter"/>
      <Stat label="Offres" value={offers.length} icon="star" color={C.ok} sub="En négo"/>
    </div>

    {urgents.length>0&&<div style={{marginBottom:22}}>
      <h3 style={{color:C.t1,fontSize:15,marginBottom:10,display:"flex",alignItems:"center",gap:6}}><Ic n="zap" s={15} c={C.err}/> Actions prioritaires</h3>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {urgents.slice(0,6).map((u,i)=><Bx key={i} onClick={()=>goTo(u.kind,u.id)} style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",borderColor:u.pri==="high"?u.cl+"44":C.border}}>
          <div style={{width:34,height:34,borderRadius:10,background:u.cl+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic n={u.ic} s={16} c={u.cl}/></div>
          <div style={{flex:1}}><div style={{fontSize:13,color:C.t1,fontWeight:600}}>{u.text}</div><div style={{fontSize:11,color:C.t3,marginTop:1}}>{u.sub}</div></div>
          <Badge c={u.pri==="high"?C.err:C.warn}>{u.pri==="high"?"Urgent":"À traiter"}</Badge>
        </Bx>)}
      </div>
    </div>}

    <div style={{display:"flex",gap:18,flexWrap:"wrap"}}>
      <div style={{flex:1,minWidth:280}}>
        <h3 style={{color:C.t1,fontSize:15,marginBottom:10}}>Candidats en mouvement</h3>
        {[...interviews,...offers].map(c=>{const si=STAGES.indexOf(c.stage);return <Bx key={c.id} onClick={()=>goTo("candidate",c.id)} style={{padding:"12px 16px",marginBottom:6,display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
          <Av i={c.avatar} s={34} c={SC[si]}/>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.t1}}>{c.name}</div><div style={{fontSize:11,color:C.t2}}>{c.missions[0]} @ {c.company}</div></div>
          <Badge c={SC[si]}>{c.stage}</Badge>
          <span style={{fontSize:17,fontWeight:700,color:avgS(c.scores)>=85?C.ok:C.acc2}}>{avgS(c.scores)}</span>
        </Bx>;})}
        {interviews.length+offers.length===0&&<Bx style={{padding:24,textAlign:"center",color:C.t3,fontSize:13}}>Aucun candidat en phase active</Bx>}
      </div>
      <div style={{flex:1,minWidth:280}}>
        <h3 style={{color:C.t1,fontSize:15,marginBottom:10}}>Charge par consultant</h3>
        {TEAM.map(ct=>{const mis=S.missions.filter(m=>m.consultant===ct.n&&m.status!=="Placé");const cds=S.candidates.filter(c=>c.consultant===ct.n&&c.stage!=="Placé");const overload=mis.length>4;return <Bx key={ct.id} style={{padding:"12px 16px",marginBottom:6,borderColor:overload?C.warn+"55":C.border}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <Av i={ct.i} s={30} c={ct.c}/>
            <div style={{flex:1,fontSize:13,fontWeight:600,color:C.t1}}>{ct.n}</div>
            {overload&&<Badge c={C.warn}>Surcharge</Badge>}
            <span style={{fontSize:11,color:C.t2}}>{mis.length} mis. · {cds.length} cand.</span>
          </div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{mis.map(m=><Badge key={m.id} c={ct.c}>{m.title}</Badge>)}</div>
        </Bx>;})}

        <h3 style={{color:C.t1,fontSize:15,marginTop:16,marginBottom:10,display:"flex",alignItems:"center",gap:6}}><Ic n="bell" s={14} c={C.warn}/> Rappels</h3>
        {S.reminders.filter(r=>!r.done).map(r=><Bx key={r.id} style={{padding:"10px 14px",marginBottom:6}}>
          <div style={{fontSize:12,color:C.t1}}>{r.text}</div>
          <div style={{fontSize:10,color:C.t3,marginTop:3}}>{r.date} · {r.linked}</div>
        </Bx>)}
      </div>
    </div>
  </div>;
};

// ── CRM LIST ─────────────────────────────────
const CrmList=({S,onSel})=>{
  const [q,setQ]=useState("");
  const [f,setF]=useState("Tous");
  const fl=S.companies.filter(c=>(c.name.toLowerCase().includes(q.toLowerCase())||c.sector.toLowerCase().includes(q.toLowerCase()))&&(f==="Tous"||c.status===f));
  return <div>
    <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
      <SearchBar v={q} onChange={setQ} ph="Rechercher une entreprise..."/>
      <Tabs tabs={["Tous","Actif","Prospect","Inactif"]} active={f} onChange={setF}/>
    </div>
    {fl.map(c=>{const mis=S.missions.filter(m=>m.company===c.name);return <Bx key={c.id} onClick={()=>onSel(c.id)} style={{padding:"14px 18px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",flexWrap:"wrap",gap:8,transition:"border-color .15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.borderH} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <Av i={c.name.slice(0,2).toUpperCase()} s={40} c={c.status==="Actif"?C.acc:c.status==="Prospect"?C.warn:C.t3}/>
        <div><div style={{fontWeight:600,color:C.t1,fontSize:14}}>{c.name}</div><div style={{fontSize:11,color:C.t2}}>{c.sector} · {c.contacts[0]?.name} ({c.contacts[0]?.role})</div></div>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <Badge c={c.mandatStage==="Mission active"?C.ok:c.mandatStage==="Proposition envoyée"?C.warn:C.t3}>{c.mandatStage}</Badge>
        <Badge c={c.status==="Actif"?C.ok:c.status==="Prospect"?C.warn:C.t3}>{c.status}</Badge>
        <div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:700,color:C.t1}}>{mis.length} mission{mis.length>1?"s":""}</div>{c.revenue>0&&<div style={{fontSize:11,color:C.ok}}>{(c.revenue/1000).toFixed(0)}K€</div>}</div>
        <Ic n="chevR" s={14} c={C.t3}/>
      </div>
    </Bx>;})}
    {fl.length===0&&<Bx style={{padding:40,textAlign:"center"}}><div style={{color:C.t3,fontSize:14}}>Aucune entreprise trouvée</div></Bx>}
  </div>;
};

// ── CRM DETAIL ───────────────────────────────
const CrmDetail=({company:co,S,onBack,onAddHist,onMsg,onToast})=>{
  const [tab,setTab]=useState("Messages");
  const [showAdd,setShowAdd]=useState(false);
  const [hType,setHType]=useState("call");
  const [hText,setHText]=useState("");
  const [msgText,setMsgText]=useState("");
  const [msgs,setMsgs]=useState([]);
  const msgEndRef=useRef(null);
  const unread=msgs.filter(m=>m.isFromClient).length;
  useEffect(()=>{getCompanyMessages(co.id).then(setMsgs);},[co.id]);
  useEffect(()=>{
    const ch=supabase.channel(`crm-msgs-${co.id}`)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'company_messages',filter:`company_id=eq.${co.id}`},
        (payload)=>{
          const m=payload.new;
          if(m.is_from_client){
            setMsgs(prev=>[...prev,{id:m.id,text:m.text,isFromClient:true,date:(m.created_at||'').slice(0,10),by:'Client',context:null}]);
          }
        })
      .subscribe();
    return()=>supabase.removeChannel(ch);
  },[co.id]);
  const [portalEmail,setPortalEmail]=useState(co.contacts?.[0]?.email||"");
  const [portalCreating,setPortalCreating]=useState(false);
  const [portalCreds,setPortalCreds]=useState(null);
  const [hasAccess,setHasAccess]=useState(!!co.portal_user_id);
  const mis=S.missions.filter(m=>m.company===co.name);
  const mStages=["Premier contact","Brief","Proposition envoyée","Mandat signé","Mission active"];
  const msi=mStages.indexOf(co.mandatStage);
  const addH=()=>{if(!hText.trim())return;onAddHist(co.id,{date:today(),type:hType,text:hText,by:"Vous"});setHText("");setShowAdd(false);};

  const doCreateAccess=async()=>{
    if(!portalEmail.trim())return;
    setPortalCreating(true);
    try{
      const creds=await createClientAccess(co.id,portalEmail);
      setPortalCreds(creds);
      setHasAccess(true);
      onToast&&onToast("Accès client créé !");
    }catch(e){
      onToast&&onToast(e.message||"Erreur création accès","err");
    }
    setPortalCreating(false);
  };

  const doRevoke=async()=>{
    await revokeClientAccess(co.id);
    setHasAccess(false);
    setPortalCreds(null);
    onToast&&onToast("Accès révoqué");
  };

  return <div>
    <Btn onClick={onBack} style={{marginBottom:14}}>← Retour</Btn>
    <Bx style={{padding:24,marginBottom:18}}>
      <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:14,marginBottom:18}}>
        <div><h2 style={{margin:0,fontSize:20,color:C.t1}}>{co.name}</h2><div style={{color:C.t2,marginTop:3,fontSize:13}}>{co.sector}</div></div>
        <div style={{display:"flex",gap:6}}><Badge c={co.status==="Actif"?C.ok:co.status==="Prospect"?C.warn:C.t3}>{co.status}</Badge></div>
      </div>
      <div style={{display:"flex",gap:4,marginBottom:18}}>{mStages.map((s,i)=><div key={s} style={{flex:1,textAlign:"center",padding:"6px 2px",borderRadius:7,background:i<=msi?C.acc+"20":C.card2,color:i<=msi?C.acc:C.t3,fontSize:10,fontWeight:600}}>{s}</div>)}</div>
      <h4 style={{color:C.t1,fontSize:13,margin:"0 0 8px"}}>Contacts ({co.contacts.length})</h4>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:18}}>
        {co.contacts.map((ct,i)=><div key={i} style={{background:C.card2,borderRadius:10,padding:12,minWidth:190,flex:1}}>
          <div style={{fontSize:13,fontWeight:600,color:C.t1}}>{ct.name}</div>
          <div style={{fontSize:11,color:C.acc2,marginTop:1}}>{ct.role}</div>
          <div style={{fontSize:11,color:C.t3,marginTop:3}}>{ct.email}<br/>{ct.phone}</div>
        </div>)}
      </div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:18}}>
        <Btn sm onClick={()=>onMsg("proposal",{company:co.name,mission:mis[0]?.title||"poste à définir"})} style={{background:C.acc+"15",color:C.acc,border:`1px solid ${C.acc}33`}}><Ic n="file" s={12} c={C.acc}/> Proposition commerciale</Btn>
        {mis.filter(m=>m.status==="En cours").map(m=><Btn key={m.id} sm onClick={()=>onMsg("feedback",{company:co.name,mission:m.title})} style={{background:C.warn+"15",color:C.warn,border:`1px solid ${C.warn}33`}}><Ic n="msg" s={12} c={C.warn}/> Feedback {m.title}</Btn>)}
      </div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14}}>
        <div style={{background:C.card2,borderRadius:10,padding:12,flex:1}}><div style={{fontSize:10,color:C.t3,marginBottom:3}}>REVENUE</div><div style={{fontSize:22,fontWeight:700,color:C.ok}}>{(co.revenue/1000).toFixed(0)}K€</div></div>
        <div style={{background:C.card2,borderRadius:10,padding:12,flex:1}}><div style={{fontSize:10,color:C.t3,marginBottom:3}}>MISSIONS</div><div style={{fontSize:22,fontWeight:700,color:C.acc}}>{mis.length}</div></div>
        <div style={{background:C.card2,borderRadius:10,padding:12,flex:2}}><div style={{fontSize:10,color:C.t3,marginBottom:3}}>NOTES</div><div style={{fontSize:12,color:C.t2,lineHeight:1.5}}>{co.notes}</div></div>
      </div>
      {/* ── PORTAIL CLIENT ── */}
      <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginTop:4}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <Ic n="key" s={14} c={C.acc}/>
          <span style={{fontSize:13,fontWeight:600,color:C.t1}}>Accès portail client</span>
          {hasAccess&&<span style={{background:C.ok+"18",color:C.ok,fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:10}}>Actif</span>}
        </div>

        {!hasAccess&&!portalCreds&&<div style={{display:"flex",gap:8,alignItems:"flex-end",flexWrap:"wrap"}}>
          <Inp label="Email du contact client" value={portalEmail} onChange={e=>setPortalEmail(e.target.value)} placeholder="contact@entreprise.com" style={{flex:1,minWidth:220}}/>
          <Btn pr sm onClick={doCreateAccess} dis={portalCreating||!portalEmail.trim()} style={{marginBottom:1}}>
            <Ic n="userplus" s={13} c={C.wh}/> {portalCreating?"Création...":"Créer l'accès"}
          </Btn>
        </div>}

        {portalCreds&&<div style={{background:C.ok+"0d",border:`1px solid ${C.ok}33`,borderRadius:10,padding:14}}>
          <div style={{fontSize:12,fontWeight:600,color:C.ok,marginBottom:8,display:"flex",alignItems:"center",gap:6}}><Ic n="check" s={13} c={C.ok}/> Accès créé — à envoyer au client</div>
          <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"4px 10px",fontSize:12,marginBottom:10}}>
            <span style={{color:C.t3}}>URL</span><span style={{color:C.t1,fontWeight:600}}>samejob-client.vercel.app</span>
            <span style={{color:C.t3}}>Email</span><span style={{color:C.t1}}>{portalCreds.email}</span>
            <span style={{color:C.t3}}>Mot de passe</span><span style={{color:C.t1,fontWeight:700,letterSpacing:1}}>{portalCreds.password}</span>
          </div>
          <Btn sm onClick={()=>{navigator.clipboard.writeText(`Portail Same Job\nURL : https://samejob-client.vercel.app\nEmail : ${portalCreds.email}\nMot de passe : ${portalCreds.password}`);onToast&&onToast("Copié !");}}>
            <Ic n="copy" s={12}/> Copier les identifiants
          </Btn>
        </div>}

        {hasAccess&&!portalCreds&&<div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:12,color:C.t2}}>Portail actif pour {portalEmail||co.contacts?.[0]?.email||"ce client"}</span>
          <Btn sm onClick={doRevoke} style={{color:C.err,border:`1px solid ${C.err}33`}}>Révoquer</Btn>
        </div>}
      </div>

      <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginTop:16}}>
        <div style={{display:"flex",gap:4}}>
          {["Messages","Historique","Missions"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"6px 14px",borderRadius:8,border:"none",background:tab===t?C.acc+"18":"transparent",color:tab===t?C.acc:C.t3,fontWeight:tab===t?700:400,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
            {t}{t==="Messages"&&unread>0&&<span style={{background:C.hot,color:C.wh,fontSize:9,fontWeight:700,borderRadius:10,padding:"1px 6px"}}>{unread}</span>}
          </button>)}
        </div>
      </div>
    </Bx>

    {tab==="Messages"&&<Bx style={{padding:20,display:"flex",flexDirection:"column",minHeight:300}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:8,marginBottom:12,maxHeight:360,overflowY:"auto"}}>
        {msgs.length===0&&<div style={{textAlign:"center",color:C.t3,fontSize:12,padding:32}}>Aucun message — le client peut vous écrire depuis son portail</div>}
        {msgs.map((m,i)=>{const isMe=!m.isFromClient;return<div key={i} style={{display:"flex",justifyContent:isMe?"flex-end":"flex-start"}}>
          <div style={{maxWidth:"78%",background:isMe?C.acc+"12":C.card2,borderRadius:12,borderBottomRightRadius:isMe?3:12,borderBottomLeftRadius:isMe?12:3,padding:"10px 14px"}}>
            {m.context&&<div style={{fontSize:9,color:C.acc,fontWeight:600,marginBottom:2}}>📌 {m.context}</div>}
            <div style={{fontSize:10,color:C.t3,marginBottom:3}}>{isMe?"Same Job":co.name} · {m.date}</div>
            <div style={{fontSize:13,color:C.t1,lineHeight:1.6}}>{m.text}</div>
          </div>
        </div>;})}
        <div ref={msgEndRef}/>
      </div>
      <div style={{display:"flex",gap:8}}>
        <input value={msgText} onChange={e=>setMsgText(e.target.value)} placeholder={`Répondre à ${co.name}...`}
          onKeyDown={async e=>{if(e.key==="Enter"&&msgText.trim()){const t=msgText;setMsgText("");setMsgs(p=>[...p,{text:t,isFromClient:false,date:new Date().toISOString().slice(0,10),by:"Vous",context:null}]);await sendMessageToClient(co.id,t).catch(console.error);onToast&&onToast("Message envoyé");msgEndRef.current?.scrollIntoView();}}}
          style={{flex:1,background:C.card2,border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 13px",color:C.t1,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
        <Btn pr sm dis={!msgText.trim()} onClick={async()=>{const t=msgText;setMsgText("");setMsgs(p=>[...p,{text:t,isFromClient:false,date:new Date().toISOString().slice(0,10),by:"Vous",context:null}]);await sendMessageToClient(co.id,t).catch(console.error);onToast&&onToast("Message envoyé");}}><Ic n="send" s={14} c={C.wh}/></Btn>
      </div>
    </Bx>}

    {tab==="Historique"&&<Bx style={{padding:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <h3 style={{margin:0,fontSize:14,color:C.t1}}>Historique</h3>
        <Btn sm pr onClick={()=>setShowAdd(!showAdd)}><Ic n="plus" s={13} c={C.wh}/> Ajouter</Btn>
      </div>
      {showAdd&&<div style={{background:C.card2,borderRadius:10,padding:14,marginBottom:14,display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
        <Sel label="Type" value={hType} onChange={e=>setHType(e.target.value)} style={{width:130}}><option value="call">Appel</option><option value="mail">Email</option><option value="meeting">Réunion</option><option value="doc">Document</option><option value="note">Note</option></Sel>
        <Inp label="Description" value={hText} onChange={e=>setHText(e.target.value)} placeholder="Décrivez l'interaction..." style={{flex:1,minWidth:200}}/>
        <Btn pr sm onClick={addH} dis={!hText.trim()}>Ajouter</Btn>
      </div>}
      {(co.history||[]).filter(h=>!h.isFromClient&&h.type!=="message").map((h,i,arr)=><div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:14,paddingBottom:14,borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none"}}>
        <div style={{width:32,height:32,borderRadius:8,background:(TC[h.type]||C.t3)+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic n={TI[h.type]||"file"} s={14} c={TC[h.type]||C.t3}/></div>
        <div style={{flex:1}}><div style={{fontSize:12,color:C.t1,lineHeight:1.5}}>{h.text}</div><div style={{fontSize:10,color:C.t3,marginTop:2}}>{h.date} · {h.by}</div></div>
      </div>)}
    </Bx>}

    {tab==="Missions"&&<div>{mis.map(m=>{const dl=dUntil(m.deadline);const cn=S.candidates.filter(c=>c.missions.includes(m.title));return <Bx key={m.id} style={{padding:16,marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:cn.length?10:0}}>
        <div><div style={{fontSize:14,fontWeight:600,color:C.t1}}>{m.title}</div><div style={{fontSize:11,color:C.t2,marginTop:1}}>{m.salary} · Fee {m.fee} · {m.consultant}</div></div>
        <div style={{display:"flex",gap:6}}><Badge c={m.status==="Placé"?C.ok:m.status==="Nouveau"?C.acc3:C.acc}>{m.status}</Badge>{m.status!=="Placé"&&<Badge c={dl<30?C.err:C.t3}>{dl}j</Badge>}</div>
      </div>
      {cn.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{cn.map(c=>{const si=STAGES.indexOf(c.stage);return <div key={c.id} style={{background:C.card2,borderRadius:8,padding:"4px 10px",display:"flex",alignItems:"center",gap:6}}><Av i={c.avatar} s={20} c={SC[si]}/><span style={{fontSize:11,color:C.t1}}>{c.name}</span><Badge c={SC[si]}>{c.stage}</Badge></div>;})}</div>}
    </Bx>;})}
    </div>}
  </div>;
};

// ── PIPELINE ─────────────────────────────────
const PipelineList=({S,onSel,onStage})=>{
  const [q,setQ]=useState("");
  const [v,setV]=useState("Kanban");
  const fl=S.candidates.filter(c=>c.name.toLowerCase().includes(q.toLowerCase())||c.role.toLowerCase().includes(q.toLowerCase())||c.skills.some(s=>s.toLowerCase().includes(q.toLowerCase())));
  return <div>
    <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
      <SearchBar v={q} onChange={setQ} ph="Nom, compétence, rôle..."/>
      <Tabs tabs={["Kanban","Liste","Vivier"]} active={v} onChange={setV}/>
    </div>
    {v==="Kanban"&&<div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:6}}>
      {STAGES.map((s,si)=>{const cards=fl.filter(c=>c.stage===s);return <div key={s} style={{minWidth:195,flex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,padding:"0 2px"}}><div style={{width:9,height:9,borderRadius:"50%",background:SC[si]}}/><span style={{fontSize:12,fontWeight:600,color:C.t1}}>{s}</span><span style={{fontSize:11,color:C.t3,marginLeft:"auto"}}>{cards.length}</span></div>
        {cards.map(c=>{const sc=avgS(c.scores);const last=c.history?.[0];const d=last?dAgo(last.date):null;return <Bx key={c.id} onClick={()=>onSel(c.id)} style={{padding:"11px 13px",marginBottom:6,cursor:"pointer",borderColor:d&&d>=5?C.err+"44":C.border,transition:"border-color .15s"}} onMouseEnter={e=>{if(!(d&&d>=5))e.currentTarget.style.borderColor=SC[si]}} onMouseLeave={e=>{if(!(d&&d>=5))e.currentTarget.style.borderColor=d&&d>=5?C.err+"44":C.border}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
            <Av i={c.avatar} s={28} c={SC[si]}/>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div><div style={{fontSize:10,color:C.t2}}>{c.role}</div></div>
            <span style={{fontSize:14,fontWeight:700,color:sc>=85?C.ok:sc>=70?C.acc2:C.warn}}>{sc}</span>
          </div>
          <div style={{fontSize:10,color:C.t3,marginBottom:4}}>{c.company?(`${c.company} · `):(c.missions.length===0?"Vivier · ":"")}{c.missions[0]||""}</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",gap:3}}>{c.skills.slice(0,2).map(sk=><span key={sk} style={{fontSize:9,background:C.card2,color:C.t2,padding:"1px 6px",borderRadius:5}}>{sk}</span>)}</div>
            {d!==null&&<span style={{fontSize:9,color:d>=5?C.err:d>=3?C.warn:C.t3,fontWeight:600}}>{d===0?"Auj.":d+"j"}</span>}
          </div>
        </Bx>;})}
      </div>;})}
    </div>}

    {v==="Liste"&&<div style={{display:"flex",flexDirection:"column",gap:6}}>
      {fl.map(c=>{const si=STAGES.indexOf(c.stage);const sc=avgS(c.scores);const last=c.history?.[0];const d=last?dAgo(last.date):null;return <Bx key={c.id} onClick={()=>onSel(c.id)} style={{padding:"11px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.borderH} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
        <Av i={c.avatar} s={34} c={SC[si]}/>
        <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,color:C.t1,fontSize:13}}>{c.name} <span style={{fontWeight:400,color:C.t2,fontSize:11}}>· {c.role}</span></div><div style={{fontSize:11,color:C.t3}}>{c.company?(`${c.company} · `):""}{c.missions[0]||"Vivier"} · {c.consultant}</div></div>
        {d!==null&&<span style={{fontSize:10,color:d>=5?C.err:d>=3?C.warn:C.t3,fontWeight:600,minWidth:24}}>{d}j</span>}
        <Badge c={SC[si]}>{c.stage}</Badge>
        <span style={{fontSize:17,fontWeight:700,color:sc>=85?C.ok:sc>=70?C.acc2:C.warn,minWidth:28,textAlign:"right"}}>{sc}</span>
      </Bx>;})}
    </div>}

    {v==="Vivier"&&<div style={{display:"flex",flexDirection:"column",gap:6}}>
      {fl.filter(c=>c.missions.length===0).map(c=>{const si=STAGES.indexOf(c.stage);const sc=avgS(c.scores);return <Bx key={c.id} onClick={()=>onSel(c.id)} style={{padding:"11px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.borderH} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
        <Av i={c.avatar} s={34} c={C.acc3}/>
        <div style={{flex:1}}><div style={{fontWeight:600,color:C.t1,fontSize:13}}>{c.name} <span style={{fontWeight:400,color:C.t2,fontSize:11}}>· {c.role}</span></div><div style={{fontSize:11,color:C.t3}}>{c.skills.slice(0,3).join(", ")} · {c.salary}</div></div>
        <span style={{fontSize:17,fontWeight:700,color:sc>=85?C.ok:C.acc2}}>{sc}</span>
      </Bx>;})}
      {fl.filter(c=>c.missions.length===0).length===0&&<Bx style={{padding:30,textAlign:"center",color:C.t3,fontSize:13}}>Aucun candidat dans le vivier</Bx>}
    </div>}
  </div>;
};

// ── CANDIDATE DETAIL ─────────────────────────
const CandDetail=({cand:c,S,onBack,onUpdate,onAddHist,onAssign,toast})=>{
  const [tab,setTab]=useState("Résumé IA");
  const [showAdd,setShowAdd]=useState(false);
  const [hType,setHType]=useState("call");
  const [hText,setHText]=useState("");
  const [noteText,setNoteText]=useState("");
  const [noteSaving,setNoteSaving]=useState(false);
  const [editScore,setEditScore]=useState(null);
  const [msgType,setMsgType]=useState(null);
  const [editing,setEditing]=useState(false);
  const [editForm,setEditForm]=useState({});
  const [cvText,setCvText]=useState(c.cvText||"");
  const [aiSummary,setAiSummary]=useState(c.aiSummary||"");
  const [aiLoading,setAiLoading]=useState(false);
  const [cvStep,setCvStep]=useState(c.aiSummary?"preview":"edit");
  const [cvPublished,setCvPublished]=useState(!!c.aiSummary);
  const si=STAGES.indexOf(c.stage);
  const sc=avgS(c.scores);
  const notes=(c.history||[]).filter(h=>h.type==="note");

  const startEdit=()=>{
    setEditForm({name:c.name,role:c.role,email:c.email,phone:c.phone,salary:c.salary,available:c.available,skills:(c.skills||[]).join(", ")});
    setEditing(true);
  };
  const saveEdit=()=>{
    const skills=editForm.skills.split(",").map(s=>s.trim()).filter(Boolean);
    const initials=n=>(n||'??').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase();
    const updated={...editForm,skills,available:editForm.available,avatar:initials(editForm.name)};
    onUpdate(c.id,updated);
    updateCandidateInfo(c.id,updated).catch(console.error);
    setEditing(false);
  };

  const addH=()=>{if(!hText.trim())return;onAddHist(c.id,{date:today(),type:hType,text:hText});setHText("");setShowAdd(false);};
  const saveNote=()=>{
    if(!noteText.trim())return;
    setNoteSaving(true);
    onAddHist(c.id,{date:today(),type:"note",text:noteText});
    setNoteText("");
    setTimeout(()=>setNoteSaving(false),600);
  };
  const setScore=(idx,val)=>{const ns=[...c.scores];ns[idx]=Math.min(10,Math.max(0,parseInt(val)||0));onUpdate(c.id,{scores:ns});};

  const generateSummary=async()=>{
    if(!cvText.trim()){toast("Collez d'abord le contenu du CV","err");return;}
    setAiLoading(true);
    try{
      const prompt=`Tu es un assistant RH expert. À partir du CV brut ci-dessous, produis un document structuré en français.\n\nRÈGLES STRICTES :\n1. Supprime TOUTE donnée personnelle identifiante : nom, prénom, email, téléphone, adresse postale, liens LinkedIn/GitHub/réseaux.\n2. Remplace le nom de l'entreprise ACTUELLE (la plus récente dans le CV) par une description générique du type "Société de gestion indépendante, filiale d'un grand groupe public", "Scale-up SaaS B2B, 200 employés", etc.\n3. Remplace chaque mention directe de la personne par "le/la candidat(e)".\n4. CONSERVE absolument TOUTES les expériences professionnelles sans en omettre aucune.\n\nFORMAT DE SORTIE — respecte EXACTEMENT cette structure markdown :\n\n## Résumé\n[Exactement 5 lignes décrivant : années d'expérience totales, secteurs d'activité, expertises clés, type de postes occupés, valeur ajoutée principale]\n\n## Expériences professionnelles\n[Pour chaque expérience, ce format exact — une par une, dans l'ordre chronologique inverse :]\n**[Intitulé du poste]** | [Description anonyme de l'entreprise] | [Dates]\n- [Responsabilité ou mission principale]\n- [Réalisation concrète ou résultat chiffré]\n\n## Formation\n[Pour chaque diplôme :]\n**[Intitulé du diplôme]** | [Nom ou type de l'établissement] | [Année]\n\n## Compétences\n- [Compétence technique ou outil]\n\n## Langues\n- [Langue — niveau]\n\nCV brut :\n${cvText}`;
      const res=await fetch("https://gbgbtbzrcsqmyckrcehe.supabase.co/functions/v1/ai-chat",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({prompt})
      });
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||"Erreur API");
      const summary=data.result||"";
      if(!summary)throw new Error("Réponse vide");
      setAiSummary(summary);
      setCvStep("preview");
      setCvPublished(false);
      toast("CV anonymisé généré — vérifiez et publiez","ok");
    }catch(e){toast("Erreur : "+e.message,"err");}
    setAiLoading(false);
  };

  const publishToClient=async()=>{
    try{
      await updateCandidateCvSummary(c.id,{cvText,aiSummary});
      onUpdate(c.id,{cvText,aiSummary});
      setCvPublished(true);
      toast("CV publié sur le profil client","ok");
    }catch(e){toast("Erreur publication : "+e.message,"err");}
  };

  const msgCtx={name:c.name,role:c.role,skills:c.skills,mission:c.missions[0]||"",company:c.company||"",score:sc};
  const msgOptions=[];
  if(c.stage==="Sourcing") msgOptions.push({type:"approach",label:"Approche candidat",ic:"mail",cl:C.acc});
  if(c.stage==="Shortlist"||c.stage==="Entretien client") msgOptions.push({type:"present",label:"Présenter au client",ic:"file",cl:C.ok});
  if(c.stage==="Entretien client") msgOptions.push({type:"feedback",label:"Demander feedback client",ic:"msg",cl:C.warn});
  msgOptions.push({type:"confirm",label:"Confirmer un RDV",ic:"check",cl:C.acc3});

  return <div>
    {msgType&&<GenMsgModal open={true} onClose={()=>setMsgType(null)} type={msgType} context={msgCtx}/>}
    <Btn onClick={onBack} style={{marginBottom:14}}>← Retour</Btn>
    <Bx style={{padding:24,marginBottom:18}}>
      <div style={{display:"flex",gap:18,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:260}}>
          <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14}}>
            <Av i={c.avatar} s={52} c={sc>=85?C.ok:C.acc}/>
            <div style={{flex:1}}>
              {editing
                ? <Inp value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} style={{marginBottom:4}}/>
                : <h2 style={{margin:0,fontSize:20,color:C.t1}}>{c.name}</h2>}
              {editing
                ? <div style={{display:"flex",gap:6,marginTop:4}}><Inp value={editForm.role} onChange={e=>setEditForm(f=>({...f,role:e.target.value}))} placeholder="Poste actuel" style={{flex:1}}/><Inp value={editForm.salary} onChange={e=>setEditForm(f=>({...f,salary:e.target.value}))} placeholder="Salaire" style={{width:110}}/></div>
                : <div style={{color:C.t2,fontSize:13,marginTop:1}}>{c.role} · {c.salary}</div>}
              {editing
                ? <div style={{display:"flex",gap:6,marginTop:4}}><Inp value={editForm.email} onChange={e=>setEditForm(f=>({...f,email:e.target.value}))} placeholder="Email" style={{flex:1}}/><Inp value={editForm.phone} onChange={e=>setEditForm(f=>({...f,phone:e.target.value}))} placeholder="Téléphone" style={{width:130}}/></div>
                : <div style={{color:C.t3,fontSize:11,marginTop:1}}>{c.email} · {c.phone}</div>}
            </div>
            {!editing
              ? <Btn sm onClick={startEdit} style={{alignSelf:"flex-start"}}><Ic n="edit" s={13}/></Btn>
              : <div style={{display:"flex",gap:5,alignSelf:"flex-start"}}><Btn sm pr onClick={saveEdit}><Ic n="check" s={13} c={C.wh}/> Sauver</Btn><Btn sm onClick={()=>setEditing(false)}>Annuler</Btn></div>}
          </div>
          {editing&&<Inp label="Compétences (séparées par des virgules)" value={editForm.skills} onChange={e=>setEditForm(f=>({...f,skills:e.target.value}))} placeholder="React, Node.js, SQL..." style={{marginBottom:10}}/>}
          {editing&&<div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
            <span style={{fontSize:12,color:C.t2}}>Disponibilité :</span>
            <Btn sm onClick={()=>setEditForm(f=>({...f,available:true}))} style={{background:editForm.available?C.ok+"20":"transparent",color:editForm.available?C.ok:C.t3,border:`1px solid ${editForm.available?C.ok+"44":C.border}`}}>Disponible</Btn>
            <Btn sm onClick={()=>setEditForm(f=>({...f,available:false}))} style={{background:!editForm.available?C.err+"20":"transparent",color:!editForm.available?C.err:C.t3,border:`1px solid ${!editForm.available?C.err+"44":C.border}`}}>En poste</Btn>
          </div>}
          {!editing&&<><div style={{display:"flex",gap:4,marginBottom:12}}>{STAGES.map((s,i)=><div key={s} onClick={()=>onUpdate(c.id,{stage:s})} style={{flex:1,textAlign:"center",padding:"5px 2px",borderRadius:7,background:i<=si?SC[si]+"20":C.card2,color:i<=si?SC[si]:C.t3,fontSize:9,fontWeight:600,cursor:"pointer",border:s===c.stage?`2px solid ${SC[si]}`:"2px solid transparent",transition:"all .2s"}}>{s}</div>)}</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>{c.skills.map(s=><Badge key={s} c={C.acc2}>{s}</Badge>)}</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",fontSize:11}}>
            <Badge c={c.available?C.ok:C.err}>{c.available?"Disponible":"En poste"}</Badge>
            <Badge c={C.t3}>Consultant: {c.consultant}</Badge>
            {c.missions.map(m=><Badge key={m} c={C.acc}>{m}</Badge>)}
            {c.missions.length===0&&<Badge c={C.acc3}>Vivier</Badge>}
          </div>
          {msgOptions.length>0&&<div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:10}}>
            {msgOptions.map(o=><Btn key={o.type} sm onClick={()=>setMsgType(o.type)} style={{background:o.cl+"15",color:o.cl,border:`1px solid ${o.cl}33`}}><Ic n={o.ic} s={12} c={o.cl}/> {o.label}</Btn>)}
          </div>}</>}
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
          <Radar scores={c.scores} size={155}/>
          <div style={{fontSize:26,fontWeight:800,color:sc>=85?C.ok:sc>=70?C.acc2:C.warn}}>{sc}<span style={{fontSize:13,fontWeight:400,color:C.t3}}>/100</span></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,width:"100%"}}>
            {DIMS.map((d,i)=><div key={d} onClick={()=>setEditScore(editScore===i?null:i)} style={{background:C.card2,borderRadius:6,padding:"5px 8px",textAlign:"center",cursor:"pointer",border:editScore===i?`1px solid ${C.acc}`:`1px solid transparent`}}>
              <div style={{fontSize:9,color:C.t3}}>{d}</div>
              {editScore===i?<input type="number" min={0} max={10} value={c.scores[i]} onChange={e=>setScore(i,e.target.value)} style={{width:36,background:"transparent",border:"none",color:C.acc,fontSize:15,fontWeight:700,textAlign:"center",outline:"none"}} autoFocus/>:<div style={{fontSize:15,fontWeight:700,color:c.scores[i]>=8?C.ok:c.scores[i]>=6?C.acc2:C.warn}}>{c.scores[i]}</div>}
            </div>)}
          </div>
        </div>
      </div>
    </Bx>

    <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
      <Tabs tabs={["Résumé IA","Notes","Historique","Documents","Matching"]} active={tab} onChange={setTab}/>
    </div>

    {tab==="Résumé IA"&&<div style={{display:"flex",flexDirection:"column",gap:14}}>

      {/* ── ÉTAPE 1 : saisie CV ── */}
      {cvStep==="edit"&&<Bx style={{padding:18}}>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:14,fontWeight:700,color:C.t1}}>CV brut du candidat</div>
          <div style={{fontSize:11,color:C.t3,marginTop:2}}>Collez le texte complet (copié depuis PDF ou Word) — l'IA va l'anonymiser</div>
        </div>
        <textarea
          value={cvText}
          onChange={e=>setCvText(e.target.value)}
          placeholder={"Jean Dupont\nCTO chez TechCorp (2020-2024)\n• Architecture microservices, 50 dev\n• Stack : React, Node.js, AWS\n..."}
          style={{width:"100%",minHeight:200,background:C.card2,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",color:C.t1,fontSize:12,outline:"none",boxSizing:"border-box",resize:"vertical",fontFamily:"inherit",lineHeight:1.6}}
        />
        {aiLoading&&<div style={{display:"flex",alignItems:"center",gap:10,color:C.acc2,marginTop:12}}>
          <div style={{width:14,height:14,border:`2px solid ${C.acc2}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
          <span style={{fontSize:13}}>Anonymisation en cours...</span>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>}
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:12}}>
          {aiSummary&&<Btn sm onClick={()=>setCvStep("preview")}><Ic n="file" s={13}/> Voir le CV anonymisé</Btn>}
          <Btn sm pr onClick={generateSummary} dis={aiLoading||!cvText.trim()} style={{background:C.acc}}>
            <Ic n="spark" s={13} c={C.wh}/> {aiLoading?"Analyse...":"Analyser et anonymiser avec l'IA"}
          </Btn>
        </div>
      </Bx>}

      {/* ── ÉTAPE 2 : preview + publication ── */}
      {cvStep==="preview"&&aiSummary&&<div>
        <div style={{background:cvPublished?C.ok+"10":C.acc+"0a",border:`1px solid ${cvPublished?C.ok+"44":C.acc+"33"}`,borderRadius:12,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <Ic n={cvPublished?"check":"spark"} s={16} c={cvPublished?C.ok:C.acc}/>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:cvPublished?C.ok:C.t1}}>{cvPublished?"CV publié sur le profil client":"CV anonymisé prêt à publier"}</div>
            <div style={{fontSize:11,color:C.t3,marginTop:1}}>{cvPublished?"Visible par le client dans la fiche profil":"Vérifiez le contenu avant de le rendre visible au client"}</div>
          </div>
          <div style={{display:"flex",gap:6,flexShrink:0}}>
            <Btn sm onClick={()=>setCvStep("edit")}><Ic n="edit" s={12}/> Modifier</Btn>
            <Btn sm onClick={()=>{navigator.clipboard.writeText(aiSummary);toast("Copié !","ok");}}><Ic n="copy" s={12}/> Copier</Btn>
            <Btn sm onClick={()=>{
              const blob=new Blob([`# CV Anonymisé — ${c.name}\n\n${aiSummary}`],{type:"text/markdown"});
              const url=URL.createObjectURL(blob);const a=document.createElement("a");
              a.href=url;a.download=`CV_${c.name.replace(/\s+/g,"_")}.md`;a.click();URL.revokeObjectURL(url);
              toast("Téléchargé","ok");
            }}><Ic n="download" s={12}/> Télécharger</Btn>
            <Btn sm pr onClick={publishToClient} style={{background:cvPublished?C.ok:C.acc}}>
              <Ic n="send" s={12} c={C.wh}/> {cvPublished?"Republier":"Publier sur le profil client"}
            </Btn>
          </div>
        </div>
        <div style={{background:C.wh,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
          <div style={{background:C.acc,padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontSize:15,fontWeight:700,color:C.wh}}>Candidat — Profil confidentiel</div><div style={{fontSize:11,color:"rgba(255,255,255,.7)",marginTop:1}}>Mission : {c.missions[0]||"—"} · {c.company||"—"}</div></div>
            {cvPublished&&<div style={{background:C.ok,color:C.wh,fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20}}>Visible client</div>}
          </div>
          <div style={{padding:"20px 24px",maxHeight:500,overflow:"auto"}}><MdCV text={aiSummary} colors={C}/></div>
          <div style={{background:C.card2,padding:"8px 20px",display:"flex",justifyContent:"space-between"}}>
            <div style={{fontSize:10,color:C.t3}}>Document confidentiel — Same Job</div>
            <div style={{fontSize:10,color:C.t3}}>{c.name}</div>
          </div>
        </div>
      </div>}

    </div>}

    {tab==="Notes"&&<Bx style={{padding:18}}>
      <div style={{marginBottom:14}}>
        <textarea
          value={noteText}
          onChange={e=>setNoteText(e.target.value)}
          placeholder="Écrivez une note sur ce candidat..."
          onKeyDown={e=>{if((e.metaKey||e.ctrlKey)&&e.key==="Enter")saveNote();}}
          style={{width:"100%",minHeight:100,background:C.card2,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",color:C.t1,fontSize:13,outline:"none",boxSizing:"border-box",resize:"vertical",fontFamily:"inherit",lineHeight:1.6}}
        />
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}>
          <Btn pr onClick={saveNote} dis={!noteText.trim()||noteSaving}>
            <Ic n="check" s={13} c={C.wh}/> {noteSaving?"Enregistré !":"Enregistrer"}
          </Btn>
        </div>
      </div>
      {notes.length>0&&<>
        <div style={{fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:.6,marginBottom:10}}>Notes précédentes</div>
        {notes.map((h,i)=><div key={i} style={{background:C.card2,borderRadius:10,padding:"12px 14px",marginBottom:8,borderLeft:`3px solid ${C.acc}`}}>
          <div style={{fontSize:13,color:C.t1,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{h.text}</div>
          <div style={{fontSize:10,color:C.t3,marginTop:6}}>{h.date} · {h.by}</div>
        </div>)}
      </>}
      {notes.length===0&&<div style={{textAlign:"center",color:C.t3,fontSize:12,padding:"12px 0"}}>Aucune note pour ce candidat</div>}
    </Bx>}

    {tab==="Historique"&&<Bx style={{padding:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <span style={{fontSize:13,fontWeight:600,color:C.t1}}>Interactions</span>
        <Btn sm pr onClick={()=>setShowAdd(!showAdd)}><Ic n="plus" s={12} c={C.wh}/> Ajouter</Btn>
      </div>
      {showAdd&&<div style={{background:C.card2,borderRadius:10,padding:12,marginBottom:12,display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end"}}>
        <Sel label="Type" value={hType} onChange={e=>setHType(e.target.value)} style={{width:120}}><option value="call">Appel</option><option value="mail">Email</option><option value="interview">Entretien</option><option value="note">Note</option><option value="source">Sourcing</option></Sel>
        <Inp label="Description" value={hText} onChange={e=>setHText(e.target.value)} placeholder="Décrivez..." style={{flex:1,minWidth:180}}/>
        <Btn pr sm onClick={addH} dis={!hText.trim()}>Ajouter</Btn>
      </div>}
      {(c.history||[]).map((h,i)=><div key={i} style={{display:"flex",gap:11,alignItems:"flex-start",marginBottom:12,paddingBottom:12,borderBottom:i<c.history.length-1?`1px solid ${C.border}`:"none"}}>
        <div style={{width:30,height:30,borderRadius:7,background:(TC[h.type]||C.t3)+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic n={TI[h.type]||"file"} s={13} c={TC[h.type]||C.t3}/></div>
        <div style={{flex:1}}><div style={{fontSize:12,color:C.t1,lineHeight:1.5}}>{h.text}</div><div style={{fontSize:10,color:C.t3,marginTop:2}}>{h.date}</div></div>
      </div>)}
      {(!c.history||c.history.length===0)&&<div style={{color:C.t3,textAlign:"center",padding:16,fontSize:12}}>Aucune interaction</div>}
    </Bx>}

    {tab==="Documents"&&<Bx style={{padding:18}}>
      {(c.docs||[]).map((d,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.card2,borderRadius:8,marginBottom:6}}>
        <Ic n="file" s={16} c={C.acc2}/><div style={{flex:1,fontSize:13,color:C.t1}}>{d}</div>
      </div>)}
      {(!c.docs||c.docs.length===0)&&<div style={{color:C.t3,textAlign:"center",padding:16,fontSize:12}}>Aucun document</div>}
    </Bx>}

    {tab==="Matching"&&<div>
      {S.missions.filter(m=>m.status!=="Placé").length===0&&<Bx style={{padding:28,textAlign:"center",color:C.t3,fontSize:12}}>Aucune mission active</Bx>}
      {S.missions.filter(m=>m.status!=="Placé").map(m=>{
        const assigned=c.missions.includes(m.title);
        const common=m.skills?.filter(s=>c.skills.includes(s))||[];
        const pct=m.skills?.length?Math.round(common.length/m.skills.length*100):0;
        return <Bx key={m.id} style={{padding:"14px 18px",marginBottom:8,borderColor:assigned?C.ok+"55":C.border}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,gap:8,flexWrap:"wrap"}}>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:C.t1}}>{m.title}</div>
              <div style={{fontSize:11,color:C.t2}}>{m.company} · {m.salary}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{fontSize:20,fontWeight:800,color:pct>=70?C.ok:pct>=40?C.warn:C.err}}>{pct}%</div>
              {assigned
                ? <Btn sm onClick={()=>onAssign(c.id,m.id,m.title,false)} style={{background:C.err+"15",color:C.err,border:`1px solid ${C.err}33`}}><Ic n="x" s={11} c={C.err}/> Retirer</Btn>
                : <Btn sm pr onClick={()=>onAssign(c.id,m.id,m.title,true)}><Ic n="plus" s={11} c={C.wh}/> Assigner</Btn>
              }
            </div>
          </div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{m.skills?.map(s=><Badge key={s} c={c.skills.includes(s)?C.ok:C.t3}>{s}</Badge>)}</div>
        </Bx>;
      })}
    </div>}
  </div>;
};

// ── MISSIONS LIST ────────────────────────────
const MissionsList=({S,onSel})=>{
  const [q,setQ]=useState("");
  const [f,setF]=useState("Tous");
  const fl=S.missions.filter(m=>(f==="Tous"||m.status===f)&&(m.title.toLowerCase().includes(q.toLowerCase())||m.company.toLowerCase().includes(q.toLowerCase())));
  return <div>
    <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
      <SearchBar v={q} onChange={setQ} ph="Rechercher une mission..."/>
      <Tabs tabs={["Tous","Nouveau","En cours","Placé"]} active={f} onChange={setF}/>
    </div>
    {fl.map(m=>{const dl=dUntil(m.deadline);const cn=S.candidates.filter(c=>c.missions.includes(m.title));const empty=cn.filter(c=>c.stage!=="Placé").length===0&&m.status!=="Placé";return <Bx key={m.id} onClick={()=>onSel(m.id)} style={{padding:"16px 18px",marginBottom:8,cursor:"pointer",borderColor:empty?C.err+"44":C.border}} onMouseEnter={e=>{if(!empty)e.currentTarget.style.borderColor=C.borderH}} onMouseLeave={e=>e.currentTarget.style.borderColor=empty?C.err+"44":C.border}>
      <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:cn.length?10:0}}>
        <div><div style={{fontSize:15,fontWeight:700,color:C.t1}}>{m.title}</div><div style={{fontSize:12,color:C.t2,marginTop:1}}>{m.company} · {m.salary} · Fee {m.fee} · {m.location}</div><div style={{fontSize:11,color:C.t3,marginTop:1}}>Consultant: {m.consultant} · {m.remote}</div></div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}><Badge c={m.status==="Placé"?C.ok:m.status==="Nouveau"?C.acc3:C.acc}>{m.status}</Badge>{m.status!=="Placé"&&<Badge c={dl<30?C.err:C.t3}>{dl}j</Badge>}<span style={{fontSize:12,fontWeight:700,color:C.t1}}>{cn.length} cand.</span></div>
      </div>
      {cn.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{cn.map(c=>{const si=STAGES.indexOf(c.stage);return <div key={c.id} style={{background:C.card2,borderRadius:7,padding:"4px 9px",display:"flex",alignItems:"center",gap:6}}><Av i={c.avatar} s={20} c={SC[si]}/><span style={{fontSize:11,color:C.t1}}>{c.name}</span><Badge c={SC[si]}>{c.stage}</Badge></div>;})}</div>}
      {empty&&<div style={{fontSize:11,color:C.err,marginTop:4}}>⚠ Aucun candidat dans le pipeline</div>}
    </Bx>;})}
  </div>;
};

// ── MISSION DETAIL ───────────────────────────
const MissionDetail=({mission:m,S,onBack,onUpdateCand})=>{
  const [tab,setTab]=useState("Fiche");
  const cn=S.candidates.filter(c=>c.missions.includes(m.title));
  const dl=dUntil(m.deadline);
  const sNum=parseInt(m.salary);const fNum=parseInt(m.fee);const feeAmt=sNum&&fNum?Math.round(sNum*fNum/100):null;
  const matching=S.candidates.filter(c=>c.stage!=="Placé"&&!c.missions.includes(m.title)&&m.skills?.some(s=>c.skills.includes(s)));

  return <div>
    <Btn onClick={onBack} style={{marginBottom:14}}>← Retour</Btn>
    <Bx style={{padding:24,marginBottom:18}}>
      <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:14,marginBottom:18}}>
        <div><h2 style={{margin:0,fontSize:20,color:C.t1}}>{m.title}</h2><div style={{color:C.t2,marginTop:3,fontSize:13}}>{m.company} · {m.consultant}</div></div>
        <div style={{display:"flex",gap:6}}><Badge c={m.status==="Placé"?C.ok:m.status==="Nouveau"?C.acc3:C.acc}>{m.status}</Badge>{m.status!=="Placé"&&<Badge c={dl<30?C.err:C.warn}>{dl}j</Badge>}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8,marginBottom:18}}>
        {[{l:"Salaire",v:m.salary,c:C.ok},{l:"Fee",v:`${m.fee}${feeAmt?` (${feeAmt}K€)`:""}`,c:C.warn},{l:"Lieu",v:m.location,c:C.acc2},{l:"Contrat",v:m.contract,c:C.acc},{l:"Expérience",v:m.experience,c:C.pink},{l:"Remote",v:m.remote,c:C.acc3}].map(x=><div key={x.l} style={{background:C.card2,borderRadius:9,padding:"10px 12px"}}><div style={{fontSize:9,color:C.t3,textTransform:"uppercase",marginBottom:3}}>{x.l}</div><div style={{fontSize:13,fontWeight:600,color:C.t1}}>{x.v||"—"}</div></div>)}
      </div>
      <Tabs tabs={["Fiche","Candidats","Matching"]} active={tab} onChange={setTab}/>
    </Bx>

    {tab==="Fiche"&&<div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
      <Bx style={{flex:2,minWidth:280,padding:18}}>
        <h3 style={{color:C.t1,fontSize:14,margin:"0 0 10px"}}>Description</h3>
        <p style={{color:C.t2,fontSize:13,lineHeight:1.7,margin:0}}>{m.description}</p>
        {m.requirements?.length>0&&<><h3 style={{color:C.t1,fontSize:14,margin:"16px 0 10px"}}>Exigences</h3>{m.requirements.map((r,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:C.card2,borderRadius:7,marginBottom:5}}><div style={{width:5,height:5,borderRadius:"50%",background:C.warn}}/><span style={{fontSize:12,color:C.t2}}>{r}</span></div>)}</>}
      </Bx>
      <Bx style={{flex:1,minWidth:220,padding:18}}>
        <h3 style={{color:C.t1,fontSize:14,margin:"0 0 10px"}}>Compétences</h3>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{(m.skills||[]).map(s=><Badge key={s} c={C.acc2}>{s}</Badge>)}</div>
      </Bx>
    </div>}

    {tab==="Candidats"&&<div>
      {cn.length===0&&<Bx style={{padding:30,textAlign:"center",color:C.t3,fontSize:13}}>Aucun candidat assigné</Bx>}
      {cn.map(c=>{const si=STAGES.indexOf(c.stage);const sc=avgS(c.scores);return <Bx key={c.id} style={{padding:"14px 18px",marginBottom:8}}>
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <Av i={c.avatar} s={40} c={SC[si]}/>
          <div style={{flex:1}}><div style={{fontWeight:600,color:C.t1,fontSize:14}}>{c.name}</div><div style={{fontSize:11,color:C.t2}}>{c.role} · {c.consultant}</div></div>
          <div style={{display:"flex",gap:3}}>{STAGES.map((s,i)=><div key={s} onClick={()=>onUpdateCand(c.id,{stage:s})} style={{width:7,height:22,borderRadius:3,background:i<=si?SC[si]:C.card2,cursor:"pointer"}} title={s}/>)}</div>
          <Badge c={SC[si]}>{c.stage}</Badge>
          <span style={{fontSize:20,fontWeight:700,color:sc>=85?C.ok:sc>=70?C.acc2:C.warn}}>{sc}</span>
        </div>
      </Bx>;})}
    </div>}

    {tab==="Matching"&&<div>
      {matching.length===0&&<Bx style={{padding:28,textAlign:"center",color:C.t3,fontSize:12}}>Aucun candidat compatible dans le vivier</Bx>}
      {matching.sort((a,b)=>{const pa=m.skills?.filter(s=>a.skills.includes(s)).length||0;const pb=m.skills?.filter(s=>b.skills.includes(s)).length||0;return pb-pa;}).map(c=>{const common=m.skills?.filter(s=>c.skills.includes(s))||[];const pct=m.skills?.length?Math.round(common.length/m.skills.length*100):0;const sc=avgS(c.scores);return <Bx key={c.id} style={{padding:"12px 16px",marginBottom:6,display:"flex",alignItems:"center",gap:12}}>
        <Av i={c.avatar} s={36} c={pct>=70?C.ok:C.warn}/>
        <div style={{flex:1}}><div style={{fontWeight:600,color:C.t1,fontSize:13}}>{c.name} <span style={{fontWeight:400,color:C.t2,fontSize:11}}>· {c.role}</span></div><div style={{display:"flex",gap:3,marginTop:3,flexWrap:"wrap"}}>{m.skills?.map(s=><Badge key={s} c={c.skills.includes(s)?C.ok:C.t3}>{s}</Badge>)}</div></div>
        <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:pct>=70?C.ok:pct>=40?C.warn:C.err}}>{pct}%</div><div style={{fontSize:9,color:C.t3}}>match</div></div>
        <div style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:700,color:sc>=85?C.ok:C.acc2}}>{sc}</div><div style={{fontSize:9,color:C.t3}}>score</div></div>
      </Bx>;})}
    </div>}
  </div>;
};

// ── REPORTING ────────────────────────────────
const Reporting=({S})=>{
  const tr=S.companies.reduce((s,c)=>s+c.revenue,0);
  const p=S.candidates.filter(c=>c.stage==="Placé").length;
  const cr=S.candidates.length?Math.round((p/S.candidates.length)*100):0;
  return <div>
    <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:22}}>
      <Stat label="CA total" value={`${(tr/1000).toFixed(0)}K€`} color={C.ok} icon="chart"/>
      <Stat label="Conversion" value={`${cr}%`} sub={`${p}/${S.candidates.length}`} color={C.acc} icon="target"/>
      <Stat label="Missions actives" value={S.missions.filter(m=>m.status==="En cours").length} color={C.acc2} icon="briefcase"/>
      <Stat label="Pipeline actif" value={S.candidates.filter(c=>c.stage!=="Placé"&&c.stage!=="Sourcing").length} color={C.warn} icon="users"/>
    </div>
    <div style={{display:"flex",gap:18,flexWrap:"wrap"}}>
      <div style={{flex:1,minWidth:280}}>
        <h3 style={{color:C.t1,fontSize:15,marginBottom:12}}>Revenue par client</h3>
        {S.companies.filter(c=>c.revenue>0).sort((a,b)=>b.revenue-a.revenue).map(c=><div key={c.id} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
          <div style={{width:90,fontSize:12,color:C.t2}}>{c.name}</div>
          <div style={{flex:1,background:C.card,borderRadius:5,height:26,overflow:"hidden"}}><div style={{width:`${(c.revenue/Math.max(...S.companies.map(x=>x.revenue)))*100}%`,height:"100%",background:C.ok+"35",borderRadius:5,display:"flex",alignItems:"center",paddingLeft:8}}><span style={{fontSize:11,fontWeight:700,color:C.ok}}>{(c.revenue/1000).toFixed(0)}K€</span></div></div>
        </div>)}
      </div>
      <div style={{flex:1,minWidth:280}}>
        <h3 style={{color:C.t1,fontSize:15,marginBottom:12}}>Performance consultants</h3>
        {TEAM.map(ct=>{const cds=S.candidates.filter(c=>c.consultant===ct.n);const pl=cds.filter(c=>c.stage==="Placé").length;const ac=cds.filter(c=>c.stage!=="Placé").length;return <Bx key={ct.id} style={{padding:"12px 16px",marginBottom:6,display:"flex",alignItems:"center",gap:12}}>
          <Av i={ct.i} s={32} c={ct.c}/>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.t1}}>{ct.n}</div><div style={{fontSize:11,color:C.t2}}>{S.missions.filter(m=>m.consultant===ct.n).length} missions</div></div>
          <div style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:700,color:C.ok}}>{pl}</div><div style={{fontSize:9,color:C.t3}}>placés</div></div>
          <div style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:700,color:C.acc}}>{ac}</div><div style={{fontSize:9,color:C.t3}}>actifs</div></div>
        </Bx>;})}
      </div>
    </div>
  </div>;
};

// ── ADD CANDIDATE MODAL ──────────────────────
const AddCandModal=({open,onClose,onAdd,missions})=>{
  const [f,setF]=useState({name:"",email:"",phone:"",role:"",skills:"",salary:"",mission:"",consultant:"Vous",notes:"",scores:[5,5,5,5,5]});
  const reset=()=>setF({name:"",email:"",phone:"",role:"",skills:"",salary:"",mission:"",consultant:"Vous",notes:"",scores:[5,5,5,5,5]});
  const save=()=>{
    if(!f.name||!f.email) return;
    const ini=f.name.split(" ").map(w=>w[0]||"").join("").slice(0,2).toUpperCase();
    const mis=missions.find(m=>m.id===f.mission||m.title===f.mission);
    onAdd({id:gid(),name:f.name,email:f.email,phone:f.phone,role:f.role,skills:f.skills.split(",").map(s=>s.trim()).filter(Boolean),scores:f.scores,missions:mis?[mis.title]:[],missionId:mis?mis.id:null,company:mis?mis.company:"",avatar:ini,available:true,salary:f.salary,consultant:f.consultant,stage:"Sourcing",history:[{date:today(),type:"source",text:"Ajouté à la plateforme"}],docs:[]});
    reset();onClose();
  };
  return <Modal open={open} onClose={()=>{reset();onClose();}} title="Ajouter un candidat" wide>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <Inp label="Nom complet *" value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Prénom Nom" style={{gridColumn:"1/-1"}}/>
      <Inp label="Email *" value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="email@exemple.com" type="email"/>
      <Inp label="Téléphone" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})} placeholder="+33 6..."/>
      <Inp label="Poste / Titre" value={f.role} onChange={e=>setF({...f,role:e.target.value})} placeholder="CTO, VP Sales..."/>
      <Inp label="Prétentions salariales" value={f.salary} onChange={e=>setF({...f,salary:e.target.value})} placeholder="120-140K€"/>
      <Inp label="Compétences (virgules)" value={f.skills} onChange={e=>setF({...f,skills:e.target.value})} placeholder="Python, Management..." style={{gridColumn:"1/-1"}}/>
      <Sel label="Mission" value={f.mission} onChange={e=>setF({...f,mission:e.target.value})}><option value="">— Vivier (pas de mission) —</option>{missions.filter(m=>m.status!=="Placé").map(m=><option key={m.id} value={m.id}>{m.title} — {m.company}</option>)}</Sel>
      <Sel label="Consultant" value={f.consultant} onChange={e=>setF({...f,consultant:e.target.value})}>{TEAM.map(t=><option key={t.id} value={t.n}>{t.n}</option>)}</Sel>
      <div style={{gridColumn:"1/-1"}}>
        <label style={{fontSize:10,color:C.t3,textTransform:"uppercase",letterSpacing:.6,display:"block",marginBottom:4}}>Scoring initial</label>
        <div style={{display:"flex",gap:8,marginTop:4}}>{DIMS.map((d,i)=><div key={d} style={{flex:1,background:C.card2,borderRadius:8,padding:"8px 6px",textAlign:"center"}}>
          <div style={{fontSize:9,color:C.t3,marginBottom:3}}>{d}</div>
          <input type="number" min={0} max={10} value={f.scores[i]} onChange={e=>{const ns=[...f.scores];ns[i]=parseInt(e.target.value)||0;setF({...f,scores:ns});}} style={{width:32,background:"transparent",border:`1px solid ${C.border}`,borderRadius:4,color:C.t1,fontSize:14,fontWeight:700,textAlign:"center",padding:2,outline:"none"}}/>
        </div>)}</div>
      </div>
      <Txt label="Notes" value={f.notes} onChange={e=>setF({...f,notes:e.target.value})} placeholder="Notes..." style={{gridColumn:"1/-1",height:50}}/>
    </div>
    <div style={{display:"flex",gap:8,marginTop:18,justifyContent:"flex-end"}}>
      <Btn onClick={()=>{reset();onClose();}}>Annuler</Btn>
      <Btn pr dis={!f.name||!f.email} onClick={save}><Ic n="userplus" s={14} c={C.wh}/> Ajouter</Btn>
    </div>
  </Modal>;
};

// ── ADD COMPANY MODAL ────────────────────────
const AddCompModal=({open,onClose,onAdd})=>{
  const [f,setF]=useState({name:"",sector:"",contact:"",role:"",email:"",phone:"",status:"Prospect",notes:""});
  const reset=()=>setF({name:"",sector:"",contact:"",role:"",email:"",phone:"",status:"Prospect",notes:""});
  const save=()=>{
    if(!f.name||!f.email) return;
    onAdd({id:gid(),name:f.name,sector:f.sector,status:f.status,mandatStage:"Premier contact",notes:f.notes,revenue:0,contacts:[{name:f.contact,role:f.role,email:f.email,phone:f.phone}],history:[{date:today(),type:"note",text:"Entreprise ajoutée à la plateforme",by:"Vous"}]});
    reset();onClose();
  };
  return <Modal open={open} onClose={()=>{reset();onClose();}} title="Ajouter une entreprise">
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <Inp label="Nom *" value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="TechCorp" style={{gridColumn:"1/-1"}}/>
      <Inp label="Secteur" value={f.sector} onChange={e=>setF({...f,sector:e.target.value})} placeholder="SaaS, Fintech..."/>
      <Sel label="Statut" value={f.status} onChange={e=>setF({...f,status:e.target.value})}><option>Prospect</option><option>Actif</option></Sel>
      <Inp label="Contact principal" value={f.contact} onChange={e=>setF({...f,contact:e.target.value})} placeholder="Prénom Nom"/>
      <Inp label="Rôle" value={f.role} onChange={e=>setF({...f,role:e.target.value})} placeholder="DRH, CEO..."/>
      <Inp label="Email *" value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="contact@entreprise.com" style={{gridColumn:"1/-1"}}/>
      <Inp label="Téléphone" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})} placeholder="+33 6..." style={{gridColumn:"1/-1"}}/>
      <Txt label="Notes" value={f.notes} onChange={e=>setF({...f,notes:e.target.value})} placeholder="Notes..." style={{gridColumn:"1/-1",height:50}}/>
    </div>
    <div style={{display:"flex",gap:8,marginTop:18,justifyContent:"flex-end"}}>
      <Btn onClick={()=>{reset();onClose();}}>Annuler</Btn>
      <Btn pr dis={!f.name||!f.email} onClick={save}><Ic n="plus" s={14} c={C.wh}/> Ajouter</Btn>
    </div>
  </Modal>;
};

// ── ADD MISSION MODAL ────────────────────────
const AddMisModal=({open,onClose,onAdd,companies})=>{
  const [step,setStep]=useState("choose");
  const [jt,setJt]=useState("");
  const [parsing,setParsing]=useState(false);
  const [f,setF]=useState({title:"",company:"",salary:"",fee:"18%",location:"",contract:"CDI",experience:"",skills:[],description:"",requirements:[],remote:"",deadline:""});
  const reset=()=>{setStep("choose");setJt("");setF({title:"",company:"",salary:"",fee:"18%",location:"",contract:"CDI",experience:"",skills:[],description:"",requirements:[],remote:"",deadline:""});};

  const parse=async()=>{
    if(!jt.trim())return;setParsing(true);
    try{
      const prompt=`Analyse cette fiche de poste. Réponds UNIQUEMENT en JSON valide sans backticks: {"title":"","company":"","salary":"XXK€","fee":"18%","location":"","contract":"CDI/CDD/Freelance","experience":"","skills":[""],"description":"","requirements":[""],"remote":""}\n\nFiche:\n${jt}`;
      const res=await fetch("https://gbgbtbzrcsqmyckrcehe.supabase.co/functions/v1/ai-chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt})});
      const data=await res.json();const raw=(data.result||"");
      const r=JSON.parse(raw.replace(/```json|```/g,"").trim());
      setF({title:r.title||"",company:r.company||"",salary:r.salary||"",fee:r.fee||"18%",location:r.location||"",contract:r.contract||"CDI",experience:r.experience||"",skills:r.skills||[],description:r.description||"",requirements:r.requirements||[],remote:r.remote||"",deadline:new Date(Date.now()+90*864e5).toISOString().slice(0,10)});
      setStep("review");
    }catch(e){setStep("manual");}
    setParsing(false);
  };

  const save=()=>{
    if(!f.title)return;
    onAdd({id:gid(),title:f.title,company:f.company,salary:f.salary,fee:f.fee,status:"Nouveau",startDate:today(),deadline:f.deadline||new Date(Date.now()+90*864e5).toISOString().slice(0,10),location:f.location,contract:f.contract,experience:f.experience,skills:f.skills,description:f.description,requirements:f.requirements,remote:f.remote,consultant:"Vous"});
    reset();onClose();
  };

  return <Modal open={open} onClose={()=>{reset();onClose();}} title="Nouvelle mission" wide>
    {step==="choose"&&<div style={{display:"flex",gap:14}}>
      {[{k:"paste",ic:"spark",cl:C.acc,t:"Coller une fiche de poste",d:"L'IA extrait automatiquement les infos"},{k:"manual",ic:"edit",cl:C.acc3,t:"Saisie manuelle",d:"Remplissez les champs vous-même"}].map(o=><div key={o.k} onClick={()=>setStep(o.k)} style={{flex:1,background:C.card2,borderRadius:14,border:`2px solid ${C.border}`,padding:24,cursor:"pointer",textAlign:"center",transition:"border-color .2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=o.cl} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
        <div style={{width:48,height:48,borderRadius:14,background:o.cl+"20",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}><Ic n={o.ic} s={24} c={o.cl}/></div>
        <div style={{fontSize:15,fontWeight:700,color:C.t1,marginBottom:6}}>{o.t}</div>
        <div style={{fontSize:12,color:C.t2}}>{o.d}</div>
      </div>)}
    </div>}

    {step==="paste"&&<div>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12,padding:"10px 14px",background:C.acc+"12",borderRadius:9}}><Ic n="spark" s={15} c={C.acc}/><span style={{fontSize:12,color:C.acc2}}>Collez la fiche complète, l'IA fera le reste.</span></div>
      <textarea value={jt} onChange={e=>setJt(e.target.value)} placeholder="Collez ici le texte de la fiche de poste..." style={{width:"100%",background:C.card2,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.t1,fontSize:13,outline:"none",boxSizing:"border-box",height:200,lineHeight:1.6,fontFamily:"inherit",resize:"vertical"}}/>
      <div style={{display:"flex",gap:8,marginTop:14,justifyContent:"flex-end"}}>
        <Btn onClick={()=>setStep("choose")}>← Retour</Btn>
        <Btn pr dis={!jt.trim()||parsing} onClick={parse}>{parsing?<><span style={{display:"inline-block",width:13,height:13,border:`2px solid ${C.wh}44`,borderTopColor:C.wh,borderRadius:"50%",animation:"sp .8s linear infinite"}}/> Analyse...</>:<><Ic n="spark" s={14} c={C.wh}/> Analyser</>}</Btn>
      </div>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
    </div>}

    {(step==="review"||step==="manual")&&<div>
      {step==="review"&&<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:14,padding:"10px 14px",background:C.ok+"12",borderRadius:9}}><Ic n="check" s={15} c={C.ok}/><span style={{fontSize:12,color:C.ok}}>Fiche analysée ! Vérifiez les informations.</span></div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Inp label="Titre *" value={f.title} onChange={e=>setF({...f,title:e.target.value})} placeholder="CTO, VP Sales..." style={{gridColumn:"1/-1"}}/>
        <Sel label="Entreprise" value={f.company} onChange={e=>setF({...f,company:e.target.value})}><option value="">— Sélectionner —</option>{companies.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</Sel>
        <Inp label="Salaire" value={f.salary} onChange={e=>setF({...f,salary:e.target.value})} placeholder="120K€"/>
        <Inp label="Fee" value={f.fee} onChange={e=>setF({...f,fee:e.target.value})}/>
        <Inp label="Lieu" value={f.location} onChange={e=>setF({...f,location:e.target.value})}/>
        <Sel label="Contrat" value={f.contract} onChange={e=>setF({...f,contract:e.target.value})}><option>CDI</option><option>CDD</option><option>Freelance</option></Sel>
        <Inp label="Expérience" value={f.experience} onChange={e=>setF({...f,experience:e.target.value})}/>
        <Inp label="Remote" value={f.remote} onChange={e=>setF({...f,remote:e.target.value})}/>
        <Inp label="Deadline" type="date" value={f.deadline} onChange={e=>setF({...f,deadline:e.target.value})}/>
        <Inp label="Compétences (virgules)" value={(f.skills||[]).join(", ")} onChange={e=>setF({...f,skills:e.target.value.split(",").map(s=>s.trim()).filter(Boolean)})} style={{gridColumn:"1/-1"}}/>
        <Txt label="Description" value={f.description} onChange={e=>setF({...f,description:e.target.value})} style={{gridColumn:"1/-1",height:60}}/>
        <Inp label="Exigences (virgules)" value={(f.requirements||[]).join(", ")} onChange={e=>setF({...f,requirements:e.target.value.split(",").map(s=>s.trim()).filter(Boolean)})} style={{gridColumn:"1/-1"}}/>
      </div>
      <div style={{display:"flex",gap:8,marginTop:18,justifyContent:"flex-end"}}>
        <Btn onClick={()=>step==="review"?setStep("paste"):setStep("choose")}>← Retour</Btn>
        <Btn pr dis={!f.title} onClick={save}><Ic n="plus" s={14} c={C.wh}/> Créer</Btn>
      </div>
    </div>}
  </Modal>;
};

// ── GENERATE MESSAGE MODAL ───────────────────
const GenMsgModal=({open,onClose,type:tp,context:ctx})=>{
  const [msg,setMsg]=useState("");
  const [loading,setLoading]=useState(false);
  const [copied,setCopied]=useState(false);

  const generate=async()=>{
    setLoading(true);setMsg("");
    const prompts={
      approach:`Rédige un message d'approche candidat personnalisé et humain en français pour recruter ${ctx.name} (${ctx.role}). Compétences: ${ctx.skills?.join(", ")}. Mission: ${ctx.mission}. Ton: accrocheur, personnel, pas corporate. Max 150 mots.`,
      present:`Rédige un email de présentation candidat anonymisé à envoyer au client pour la mission ${ctx.mission} chez ${ctx.company}. Profil: ${ctx.role}, compétences ${ctx.skills?.join(", ")}, score ${ctx.score}/100. Ton: professionnel, valorisant. N'utilise PAS le nom du candidat. Max 200 mots.`,
      feedback:`Rédige un email de demande de feedback post-entretien au client ${ctx.company} pour la mission ${ctx.mission}. Le candidat était présenté sous un profil anonyme. Ton: relance bienveillante orientée action. Max 100 mots.`,
      proposal:`Rédige une proposition commerciale en français pour ${ctx.company}. Besoin: ${ctx.mission}. Conditions: fee au succès. Ton: professionnel, orienté valeur ajoutée. Max 200 mots.`,
      confirm:`Rédige un email de confirmation de RDV entretien en français pour ${ctx.name}. Mission: ${ctx.mission}. Ton: cordial et factuel. Max 80 mots.`
    };
    try{
      const res=await fetch("https://gbgbtbzrcsqmyckrcehe.supabase.co/functions/v1/ai-chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:prompts[tp]||prompts.approach})});
      const data=await res.json();setMsg(data.result||"");
    }catch(e){setMsg("Erreur lors de la génération.");}
    setLoading(false);
  };

  useEffect(()=>{if(open){generate();}},[open]);
  const copy=()=>{try{navigator.clipboard.writeText(msg);}catch(e){}setCopied(true);setTimeout(()=>setCopied(false),2000);};

  return <Modal open={open} onClose={()=>{setMsg("");onClose();}} title="Message généré par l'IA" wide>
    {loading?<div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:40,gap:10,color:C.acc}}>
      <span style={{display:"inline-block",width:18,height:18,border:`2px solid ${C.acc}44`,borderTopColor:C.acc,borderRadius:"50%",animation:"sp .8s linear infinite"}}/> Génération en cours...
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
    </div>:<>
      <textarea value={msg} onChange={e=>setMsg(e.target.value)} style={{width:"100%",background:C.card2,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.t1,fontSize:13,outline:"none",boxSizing:"border-box",height:240,lineHeight:1.7,fontFamily:"inherit",resize:"vertical"}}/>
      <div style={{display:"flex",gap:8,marginTop:14,justifyContent:"flex-end"}}>
        <Btn onClick={generate}><Ic n="spark" s={14}/> Regénérer</Btn>
        <Btn pr onClick={copy}><Ic n={copied?"check":"copy"} s={14} c={C.wh}/> {copied?"Copié !":"Copier"}</Btn>
      </div>
    </>}
  </Modal>;
};

// ── MESSAGES HUB ─────────────────────────────
const MessagesHub=({S,onSelectCompany,allMsgs})=>{
  const companies=S.companies||[];
  // Group messages by company_id
  const byCompany={};
  (allMsgs||[]).forEach(m=>{if(!byCompany[m.company_id])byCompany[m.company_id]=[];byCompany[m.company_id].push(m);});
  const withMsgs=companies.filter(c=>byCompany[c.id]?.length>0);
  const clientMsgs=(allMsgs||[]).filter(m=>m.is_from_client).length;
  if(withMsgs.length===0)return(
    <Bx style={{padding:32,textAlign:"center"}}>
      <Ic n="msg" s={32} c={C.t3}/>
      <div style={{color:C.t2,fontSize:14,marginTop:12,fontWeight:600}}>Aucune conversation</div>
      <div style={{color:C.t3,fontSize:12,marginTop:4}}>Les messages envoyés depuis le portail client apparaîtront ici</div>
    </Bx>
  );
  return(
    <div>
      {clientMsgs>0&&<div style={{background:C.acc+"12",border:`1px solid ${C.acc}33`,borderRadius:10,padding:"10px 16px",marginBottom:16,fontSize:13,color:C.acc,fontWeight:600,display:"flex",alignItems:"center",gap:8}}>
        <Ic n="bell" s={15} c={C.acc}/>{clientMsgs} message{clientMsgs>1?"s":""} client{clientMsgs>1?"s":""} reçu{clientMsgs>1?"s":""}
      </div>}
      {withMsgs.map(co=>{
        const msgs=byCompany[co.id]||[];
        const last=msgs[msgs.length-1];
        const clientCount=msgs.filter(m=>m.is_from_client).length;
        return(
          <Bx key={co.id} onClick={()=>onSelectCompany(co.id)} style={{padding:"14px 16px",marginBottom:8,cursor:"pointer",borderLeft:clientCount>0?`3px solid ${C.acc}`:`3px solid transparent`}} onMouseEnter={e=>e.currentTarget.style.background=C.card2} onMouseLeave={e=>e.currentTarget.style.background=C.card}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:38,height:38,borderRadius:10,background:C.acc+"18",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:C.acc,flexShrink:0}}>{(co.name||"?").slice(0,2).toUpperCase()}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"space-between"}}>
                  <span style={{fontSize:14,fontWeight:600,color:C.t1}}>{co.name}</span>
                  {clientCount>0&&<span style={{background:C.acc,color:C.wh,fontSize:9,fontWeight:700,borderRadius:10,padding:"2px 7px",flexShrink:0}}>{clientCount}</span>}
                </div>
                {last&&<div style={{fontSize:12,color:C.t2,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><span style={{color:last.is_from_client?C.acc:C.t3,fontWeight:600}}>{last.is_from_client?"Client":"Vous"} · </span>{last.text}</div>}
              </div>
              <Ic n="chevR" s={14} c={C.t3}/>
            </div>
          </Bx>
        );
      })}
    </div>
  );
};

// ── NAV ──────────────────────────────────────
const NAV=[{k:"myday",l:"Ma journée",i:"sun"},{k:"crm",l:"Entreprises",i:"company"},{k:"pipeline",l:"Candidats",i:"users"},{k:"missions",l:"Missions",i:"briefcase"},{k:"messages",l:"Messagerie",i:"msg"},{k:"reporting",l:"Reporting",i:"chart"}];

// ── LOADING SCREEN ───────────────────────────
const LoadingScreen=()=><div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",background:C.bg,gap:16}}>
  <div style={{width:42,height:42,borderRadius:12,background:C.acc,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16,color:C.wh}}>SJ</div>
  <div style={{display:"flex",alignItems:"center",gap:10,color:C.t2,fontSize:14}}>
    <span style={{display:"inline-block",width:18,height:18,border:`2px solid ${C.border}`,borderTopColor:C.acc,borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
    Chargement des données...
  </div>
  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
</div>;

// ── MAIN DASHBOARD ───────────────────────────
export default function Dashboard({ session }) {
  const [page,setPage]=useState("myday");
  const [side,setSide]=useState(true);
  const [companies,setCompanies]=useState([]);
  const [candidates,setCandidates]=useState([]);
  const [missions,setMissions]=useState([]);
  const [reminders,setReminders]=useState([]);
  const [loading,setLoading]=useState(true);
  const [toast,setToast]=useState(null);

  const [selCand,setSelCand]=useState(null);
  const [selComp,setSelComp]=useState(null);
  const [selMis,setSelMis]=useState(null);

  const [showAddCand,setShowAddCand]=useState(false);
  const [showAddComp,setShowAddComp]=useState(false);
  const [showAddMis,setShowAddMis]=useState(false);
  const [msgModal,setMsgModal]=useState(null);
  const [globalSearch,setGlobalSearch]=useState("");
  const [showSearch,setShowSearch]=useState(false);
  const [showNotifs,setShowNotifs]=useState(false);
  const [allMsgs,setAllMsgs]=useState([]);
  const [unreadMsgs,setUnreadMsgs]=useState(0);

  const userId = session?.user?.id;
  const userEmail = session?.user?.email || 'Vous';

  // ── LOAD DATA FROM SUPABASE ───────────────
  useEffect(()=>{
    loadData();
  },[]);

  // ── REALTIME SUBSCRIPTIONS ────────────────
  useEffect(()=>{
    const channel=supabase.channel('dashboard-realtime')
      .on('postgres_changes',{event:'*',schema:'public',table:'candidate_missions'},
        ()=>getCandidates(userId).then(c=>setCandidates(c||[])).catch(console.error))
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'company_messages'},
        (payload)=>{
          const m=payload.new;
          setAllMsgs(prev=>[...prev,m]);
          if(m.is_from_client){
            setUnreadMsgs(prev=>prev+1);
            showToast('Nouveau message client reçu','ok');
          }
        })
      .subscribe();
    return()=>supabase.removeChannel(channel);
  },[]);

  async function loadData() {
    setLoading(true);
    try {
      const [comps, cands, mis, rems] = await Promise.all([
        getCompanies(userId).catch(()=>null),
        getCandidates(userId).catch(()=>null),
        getMissions(userId).catch(()=>null),
        getReminders().catch(()=>[]),
      ]);
      setCompanies(comps || []);
      setCandidates(cands || []);
      setMissions(mis || []);
      setReminders(rems);
    } catch(e) {
      console.error("Erreur chargement données:", e);
    }
    try {
      const { data: msgsData } = await supabase
        .from('company_messages')
        .select('*')
        .order('created_at', { ascending: true });
      setAllMsgs(msgsData || []);
    } catch(e) {
      console.error("Erreur chargement messages:", e);
    }
    setLoading(false);
  }

  const S={companies,candidates,missions,reminders};

  // ── SEARCH ───────────────────────────────
  const searchResults=globalSearch.trim().length>=2?{
    candidates:candidates.filter(c=>c.name.toLowerCase().includes(globalSearch.toLowerCase())||c.role.toLowerCase().includes(globalSearch.toLowerCase())||c.skills.some(s=>s.toLowerCase().includes(globalSearch.toLowerCase()))),
    companies:companies.filter(c=>c.name.toLowerCase().includes(globalSearch.toLowerCase())||c.sector.toLowerCase().includes(globalSearch.toLowerCase())),
    missions:missions.filter(m=>m.title.toLowerCase().includes(globalSearch.toLowerCase())||m.company.toLowerCase().includes(globalSearch.toLowerCase()))
  }:null;

  // ── NOTIFICATIONS ────────────────────────
  const notifs=[];
  candidates.forEach(c=>{if(c.stage==="Placé")return;const last=c.history?.[0];const d=last?dAgo(last.date):999;if(d>=5)notifs.push({text:`${c.name} sans contact depuis ${d}j`,cl:C.err,ic:"alert",kind:"candidate",id:c.id});});
  missions.forEach(m=>{if(m.status==="Placé")return;const dl=dUntil(m.deadline);if(dl<=14)notifs.push({text:`Deadline ${m.title} dans ${dl}j`,cl:C.err,ic:"clock",kind:"mission",id:m.id});if(dl>14&&dl<=30)notifs.push({text:`${m.title} — deadline dans ${dl}j`,cl:C.warn,ic:"clock",kind:"mission",id:m.id});});

  // ── KEYBOARD ─────────────────────────────
  useEffect(()=>{
    const handler=e=>{
      if((e.metaKey||e.ctrlKey)&&e.key==="k"){e.preventDefault();setShowSearch(true);}
      if(e.key==="Escape"){setShowSearch(false);setGlobalSearch("");}
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[]);

  const showToast=(m,tp="ok")=>{setToast({m,tp});setTimeout(()=>setToast(null),3000);};

  // ── MUTATIONS ────────────────────────────
  const updateCand=async(id,data)=>{
    setCandidates(p=>p.map(c=>c.id===id?{...c,...data}:c));
    if(data.stage) updateCandidateStage(id,data.stage).catch(console.error);
    if(data.scores) updateCandidateScores(id,data.scores).catch(console.error);
    showToast("Candidat mis à jour");
  };

  const addCandHist=async(id,h)=>{
    setCandidates(p=>p.map(c=>c.id===id?{...c,history:[h,...(c.history||[])]}:c));
    addCandidateInteraction(id,h).catch(console.error);
    showToast("Interaction ajoutée");
  };

  const assignCandMission=async(candidateId,missionId,missionTitle,assign)=>{
    setCandidates(p=>p.map(c=>{
      if(c.id!==candidateId) return c;
      const missions=assign?[...c.missions,missionTitle]:c.missions.filter(t=>t!==missionTitle);
      return {...c,missions};
    }));
    try {
      if(assign) await assignMissionToCandidate(candidateId,missionId);
      else await unassignMissionFromCandidate(candidateId,missionId);
      showToast(assign?"Mission assignée":"Mission retirée");
    } catch(e) {
      showToast("Erreur lors de l'assignation","err");
    }
  };

  const addCompHist=async(id,h)=>{
    setCompanies(p=>p.map(c=>c.id===id?{...c,history:[h,...(c.history||[])]}:c));
    addCompanyInteraction(id,h).catch(console.error);
    showToast("Interaction ajoutée");
  };

  const addCandidate=async(c)=>{
    try{
      const saved=await createCandidate(c);
      const ini=c.name.split(" ").map(w=>w[0]||"").join("").slice(0,2).toUpperCase();
      setCandidates(p=>[{...c,id:saved.id,avatar:ini},  ...p]);
      if(c.missionId){
        await assignMissionToCandidate(saved.id,c.missionId).catch(console.error);
      }
      showToast("Candidat ajouté");
    }catch(e){
      showToast("Erreur : "+e.message,"err");
    }
  };

  const addCompany=async(c)=>{
    setCompanies(p=>[c,...p]);
    createCompany(c).catch(console.error);
    showToast("Entreprise ajoutée");
  };

  const addMission=async(m)=>{
    setMissions(p=>[m,...p]);
    const comp=companies.find(c=>c.name===m.company);
    if(comp) createMission(m,comp.id).catch(console.error);
    showToast("Mission créée");
  };

  // ── NAVIGATION ───────────────────────────
  const goTo=(kind,id)=>{
    if(kind==="candidate"){setPage("pipeline");setSelCand(id);setSelComp(null);setSelMis(null);}
    if(kind==="mission"){setPage("missions");setSelMis(id);setSelCand(null);setSelComp(null);}
    if(kind==="company"){setPage("crm");setSelComp(id);setSelCand(null);setSelMis(null);}
  };

  const navTo=k=>{setPage(k);setSelCand(null);setSelComp(null);setSelMis(null);if(k==="messages")setUnreadMsgs(0);};

  // ── RENDER ────────────────────────────────
  const render=()=>{
    if(page==="pipeline"&&selCand){const c=candidates.find(x=>x.id===selCand);if(c)return <CandDetail cand={c} S={S} onBack={()=>setSelCand(null)} onUpdate={updateCand} onAddHist={addCandHist} onAssign={assignCandMission} toast={showToast}/>;}
    if(page==="crm"&&selComp){const c=companies.find(x=>x.id===selComp);if(c)return <CrmDetail company={c} S={S} onBack={()=>setSelComp(null)} onAddHist={addCompHist} onMsg={(tp,ctx)=>setMsgModal({type:tp,ctx})} onToast={showToast}/>;}
    if(page==="missions"&&selMis){const m=missions.find(x=>x.id===selMis);if(m)return <MissionDetail mission={m} S={S} onBack={()=>setSelMis(null)} onUpdateCand={updateCand}/>;}
    switch(page){
      case "myday":return <MyDay S={S} goTo={goTo}/>;
      case "crm":return <CrmList S={S} onSel={setSelComp}/>;
      case "pipeline":return <PipelineList S={S} onSel={setSelCand} onStage={(id,s)=>updateCand(id,{stage:s})}/>;
      case "missions":return <MissionsList S={S} onSel={setSelMis}/>;
      case "messages":return <MessagesHub S={S} allMsgs={allMsgs} onSelectCompany={id=>{setSelComp(id);setPage("crm");}}/>;
      case "reporting":return <Reporting S={S}/>;
      default:return null;
    }
  };

  const getBtnCfg=()=>{
    if(selCand||selComp||selMis) return null;
    switch(page){
      case "pipeline":return {l:"Ajouter candidat",a:()=>setShowAddCand(true),i:"userplus"};
      case "crm":return {l:"Ajouter entreprise",a:()=>setShowAddComp(true),i:"plus"};
      case "missions":return {l:"Nouvelle mission",a:()=>setShowAddMis(true),i:"briefcase"};
      default:return null;
    }
  };
  const btn=getBtnCfg();
  const title=selCand?"Fiche candidat":selComp?"Fiche entreprise":selMis?"Détail mission":NAV.find(n=>n.k===page)?.l;

  if(loading) return <LoadingScreen/>;

  return <div style={{display:"flex",height:"100vh",background:C.bg,fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif",color:C.t1,overflow:"hidden"}}>
    {/* Sidebar */}
    <div style={{width:side?215:60,background:C.bg2,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",transition:"width .2s",flexShrink:0,overflow:"hidden"}}>
      <div style={{padding:side?"18px 16px 20px":"18px 10px 20px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setSide(!side)}>
        <div style={{width:34,height:34,borderRadius:10,background:C.acc,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:C.wh,flexShrink:0}}>SJ</div>
        {side&&<div><div style={{fontWeight:700,fontSize:15,color:C.t1,lineHeight:1.1}}>Same Job</div><div style={{fontSize:10,color:C.t3}}>Headhunting</div></div>}
      </div>
      <nav style={{flex:1,padding:side?"0 8px":"0 6px"}}>
        {NAV.map(n=>{
          const badge=n.k==="messages"&&unreadMsgs>0;
          return <button key={n.k} onClick={()=>navTo(n.k)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:side?"9px 12px":"9px 0",background:page===n.k?C.acc+"18":"transparent",color:page===n.k?C.acc:C.t3,border:"none",borderRadius:9,cursor:"pointer",fontSize:13,fontWeight:page===n.k?600:400,marginBottom:3,justifyContent:side?"flex-start":"center",transition:"all .15s",position:"relative"}}>
            <div style={{position:"relative",flexShrink:0}}>
              <Ic n={n.i} s={17} c={page===n.k?C.acc:C.t3}/>
              {badge&&!side&&<span style={{position:"absolute",top:-4,right:-4,background:C.err,width:8,height:8,borderRadius:"50%",display:"block"}}/>}
            </div>
            {side&&n.l}
            {side&&badge&&<span style={{marginLeft:"auto",background:C.err,color:C.wh,fontSize:9,fontWeight:700,borderRadius:10,padding:"2px 7px"}}>{unreadMsgs}</span>}
          </button>;
        })}
      </nav>
      {side&&<div style={{padding:"14px 16px",borderTop:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <Av i={userEmail.slice(0,2).toUpperCase()} s={28} c={C.acc3}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:11,fontWeight:600,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{userEmail}</div>
            <div style={{fontSize:10,color:C.t3}}>Manager</div>
          </div>
        </div>
        <button onClick={()=>supabase.auth.signOut()} style={{width:"100%",background:"transparent",border:`1px solid ${C.err}44`,borderRadius:7,color:C.err,fontSize:11,fontWeight:600,padding:"6px 10px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
          <Ic n="logout" s={12} c={C.err}/> Déconnexion
        </button>
      </div>}
    </div>

    {/* Main */}
    <div style={{flex:1,overflow:"auto",padding:"24px 28px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,gap:12}}>
        <h1 style={{margin:0,fontSize:22,fontWeight:700}}>{title}</h1>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {/* Refresh */}
          <Btn sm onClick={loadData} style={{gap:4}}><Ic n="zap" s={13} c={C.acc2}/></Btn>
          {/* Search */}
          <div style={{position:"relative"}}>
            <Btn sm onClick={()=>setShowSearch(!showSearch)} style={{gap:4}}><Ic n="search" s={14}/>{!showSearch&&<span style={{fontSize:10,color:C.t3,background:C.card2,padding:"1px 5px",borderRadius:4}}>⌘K</span>}</Btn>
            {showSearch&&<div style={{position:"absolute",right:0,top:"100%",marginTop:6,width:380,background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:14,zIndex:500,boxShadow:"0 12px 32px rgba(0,0,0,.4)"}}>
              <input value={globalSearch} onChange={e=>setGlobalSearch(e.target.value)} placeholder="Rechercher candidats, entreprises, missions..." autoFocus style={{width:"100%",background:C.card2,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.t1,fontSize:13,outline:"none",boxSizing:"border-box",marginBottom:8}}/>
              {searchResults&&<div style={{maxHeight:300,overflow:"auto"}}>
                {searchResults.candidates.length>0&&<><div style={{fontSize:10,color:C.t3,textTransform:"uppercase",padding:"4px 0",letterSpacing:.5}}>Candidats</div>{searchResults.candidates.slice(0,4).map(c=><div key={c.id} onClick={()=>{goTo("candidate",c.id);setShowSearch(false);setGlobalSearch("");}} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 8px",borderRadius:7,cursor:"pointer",marginBottom:2}} onMouseEnter={e=>e.currentTarget.style.background=C.card2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><Av i={c.avatar} s={24} c={C.acc}/><div style={{flex:1}}><div style={{fontSize:12,color:C.t1,fontWeight:500}}>{c.name}</div><div style={{fontSize:10,color:C.t3}}>{c.role}</div></div><Badge c={SC[STAGES.indexOf(c.stage)]}>{c.stage}</Badge></div>)}</>}
                {searchResults.companies.length>0&&<><div style={{fontSize:10,color:C.t3,textTransform:"uppercase",padding:"4px 0",letterSpacing:.5,marginTop:4}}>Entreprises</div>{searchResults.companies.slice(0,3).map(c=><div key={c.id} onClick={()=>{goTo("company",c.id);setShowSearch(false);setGlobalSearch("");}} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 8px",borderRadius:7,cursor:"pointer",marginBottom:2}} onMouseEnter={e=>e.currentTarget.style.background=C.card2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><Av i={c.name.slice(0,2).toUpperCase()} s={24} c={C.acc3}/><div style={{fontSize:12,color:C.t1,fontWeight:500}}>{c.name}</div><Badge c={c.status==="Actif"?C.ok:C.warn}>{c.status}</Badge></div>)}</>}
                {searchResults.missions.length>0&&<><div style={{fontSize:10,color:C.t3,textTransform:"uppercase",padding:"4px 0",letterSpacing:.5,marginTop:4}}>Missions</div>{searchResults.missions.slice(0,3).map(m=><div key={m.id} onClick={()=>{goTo("mission",m.id);setShowSearch(false);setGlobalSearch("");}} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 8px",borderRadius:7,cursor:"pointer",marginBottom:2}} onMouseEnter={e=>e.currentTarget.style.background=C.card2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><Ic n="briefcase" s={16} c={C.acc2}/><div style={{flex:1}}><div style={{fontSize:12,color:C.t1,fontWeight:500}}>{m.title}</div><div style={{fontSize:10,color:C.t3}}>{m.company}</div></div><Badge c={m.status==="Placé"?C.ok:C.acc}>{m.status}</Badge></div>)}</>}
                {searchResults.candidates.length===0&&searchResults.companies.length===0&&searchResults.missions.length===0&&<div style={{padding:16,textAlign:"center",color:C.t3,fontSize:12}}>Aucun résultat</div>}
              </div>}
              {!searchResults&&<div style={{padding:10,textAlign:"center",color:C.t3,fontSize:11}}>Tapez au moins 2 caractères...</div>}
            </div>}
          </div>
          {/* Notifications */}
          <div style={{position:"relative"}}>
            <button onClick={()=>setShowNotifs(!showNotifs)} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:8,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative"}}>
              <Ic n="bell" s={15} c={C.t2}/>
              {notifs.length>0&&<div style={{position:"absolute",top:-3,right:-3,width:16,height:16,borderRadius:"50%",background:C.err,color:C.wh,fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{notifs.length}</div>}
            </button>
            {showNotifs&&<div style={{position:"absolute",right:0,top:"100%",marginTop:6,width:340,background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:14,zIndex:500,boxShadow:"0 12px 32px rgba(0,0,0,.4)",maxHeight:360,overflow:"auto"}}>
              <div style={{fontSize:13,fontWeight:600,color:C.t1,marginBottom:10}}>Notifications ({notifs.length})</div>
              {notifs.length===0&&<div style={{padding:16,textAlign:"center",color:C.t3,fontSize:12}}>Aucune notification</div>}
              {notifs.map((n,i)=><div key={i} onClick={()=>{goTo(n.kind,n.id);setShowNotifs(false);}} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,cursor:"pointer",marginBottom:4}} onMouseEnter={e=>e.currentTarget.style.background=C.card2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{width:28,height:28,borderRadius:7,background:n.cl+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic n={n.ic} s={13} c={n.cl}/></div>
                <div style={{fontSize:12,color:C.t1,flex:1}}>{n.text}</div>
              </div>)}
            </div>}
          </div>
          {btn&&<Btn pr onClick={btn.a}><Ic n={btn.i} s={14} c={C.wh}/> {btn.l}</Btn>}
        </div>
      </div>
      {render()}
      {(showSearch||showNotifs)&&<div onClick={()=>{setShowSearch(false);setShowNotifs(false);setGlobalSearch("");}} style={{position:"fixed",inset:0,zIndex:400}}/>}
    </div>

    {/* Modals */}
    <AddCandModal open={showAddCand} onClose={()=>setShowAddCand(false)} onAdd={addCandidate} missions={missions}/>
    <AddCompModal open={showAddComp} onClose={()=>setShowAddComp(false)} onAdd={addCompany}/>
    <AddMisModal open={showAddMis} onClose={()=>setShowAddMis(false)} onAdd={addMission} companies={companies}/>
    {msgModal&&<GenMsgModal open={true} onClose={()=>setMsgModal(null)} type={msgModal.type} context={msgModal.ctx}/>}
    {toast&&<Toast msg={toast.m} type={toast.tp}/>}
  </div>;
}
