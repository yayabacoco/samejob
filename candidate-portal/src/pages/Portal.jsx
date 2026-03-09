import { useState, useEffect, useRef } from "react";
import { supabase } from '../lib/supabase'
import {
  getMyCandidate, getMyApplications,
  updateMyProfile, saveMyCv, confirmSlot, signOut,
} from '../lib/api'

/* ═══════════════════════════════════════════════
   SAME JOB — Candidate Portal V3
   ═══════════════════════════════════════════════ */

const C={bg:"#f7f8fc",bg2:"#ffffff",card:"#ffffff",card2:"#f0f2f8",border:"#e2e5ef",acc:"#6c5ce7",acc2:"#a29bfe",acc3:"#00cec9",ok:"#00b894",warn:"#f39c12",err:"#e74c3c",t1:"#1a1d2e",t2:"#555b74",t3:"#8890a6",wh:"#fff",shadow:"0 2px 8px rgba(108,92,231,.05)",shadowM:"0 6px 20px rgba(0,0,0,.07)"};

const P={briefcase:"M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16",user:"M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",upload:"M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",check:"M20 6L9 17l-5-5",clock:"M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2",calendar:"M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18",chevR:"M9 18l6-6-6-6",chevL:"M15 18l-6-6 6-6",file:"M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6",edit:"M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z",x:"M18 6L6 18M6 6l12 12",zap:"M13 2L3 14h9l-1 8 10-12h-9z",spark:"M13 2L3 14h9l-1 8 10-12h-9z",mappin:"M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z",link:"M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",eye:"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z",logout:"M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",star:"M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"};
const Ic=({n,s=18,c:cl})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={cl||"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{(P[n]||"").split("M").filter(Boolean).map((d,i)=><path key={i} d={"M"+d}/>)}</svg>;

const Badge=({c:cl=C.acc,children})=><span style={{background:cl+"14",color:cl,padding:"3px 11px",borderRadius:20,fontSize:11,fontWeight:600,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:4}}>{children}</span>;
const Btn=({children,pr,sm,onClick:oc,dis,outline,color:cl,style:st})=><button onClick={oc} disabled={dis} style={{background:pr?cl||C.acc:outline?"transparent":C.card2,color:pr?C.wh:cl||C.t2,border:outline?`1.5px solid ${cl||C.acc}`:pr?"none":`1px solid ${C.border}`,borderRadius:10,padding:sm?"6px 14px":"10px 20px",fontSize:sm?12:13,fontWeight:600,cursor:dis?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:6,opacity:dis?.45:1,transition:"all .15s",...st}}>{children}</button>;
const Card=({children,style:s,...p})=><div style={{background:C.card,borderRadius:16,border:`1px solid ${C.border}`,boxShadow:C.shadow,...s}} {...p}>{children}</div>;
const IS={width:"100%",background:C.card2,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.t1,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"};

const dAgo=d=>Math.floor((Date.now()-new Date(d).getTime())/864e5);

// ── CV PARSER (AI) ───────────────────────────
const parseCv=async(text,mission)=>{
  try{
    const apiKey=import.meta.env.VITE_ANTHROPIC_API_KEY;
    if(!apiKey)return null;
    const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:1500,messages:[{role:"user",content:`Tu es un expert en recrutement. Analyse ce CV et génère une version anonymisée et reformatée adaptée au poste de "${mission}". Met en avant les compétences et expériences pertinentes.\n\nRÈGLES : Remplace le nom par "Candidat", supprime email/téléphone/adresse, remplace noms d'entreprises par descriptions génériques ("Scale-up SaaS B2B, 200 employés"), garde intitulés de poste, durées, réalisations.\n\nRéponds UNIQUEMENT en JSON valide :\n{"summary":"résumé 3 lignes","experience":[{"title":"intitulé","company":"description anonyme","duration":"durée","highlights":["réalisation 1","réalisation 2"]}],"skills":["compétence1"],"education":[{"degree":"diplôme","school":"type d'école","year":"année"}],"languages":["Français natif"]}\n\nCV :\n${text}`}]})});
    const data=await res.json();
    const raw=data.content.map(i=>i.text||"").join("");
    return JSON.parse(raw.replace(/```json|```/g,"").trim());
  }catch(e){return null;}
};

// ── STEPPER ──────────────────────────────────
const Stepper=({steps})=>{
  const lastDone=steps.filter(s=>s.done).length-1;
  return <div style={{display:"flex",alignItems:"flex-start",gap:0,margin:"20px 0"}}>
    {steps.map((s,i)=>{
      const active=i===lastDone+1;const done=s.done;
      return <div key={s.key} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",position:"relative"}}>
        {i>0&&<div style={{position:"absolute",top:14,right:"50%",width:"100%",height:2,background:done?C.ok:active?C.acc+"44":C.border,zIndex:0}}/>}
        <div style={{width:28,height:28,borderRadius:"50%",background:done?C.ok:active?C.acc:C.card2,border:`2px solid ${done?C.ok:active?C.acc:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",zIndex:1,position:"relative"}}>
          {done?<Ic n="check" s={14} c={C.wh}/>:<div style={{width:8,height:8,borderRadius:"50%",background:active?C.wh:C.border}}/>}
        </div>
        <div style={{fontSize:10,fontWeight:done||active?600:400,color:done?C.ok:active?C.acc:C.t3,marginTop:6,textAlign:"center",lineHeight:1.3,maxWidth:80}}>{s.label}</div>
        {s.date&&<div style={{fontSize:9,color:C.t3,marginTop:2}}>{s.date}</div>}
      </div>;
    })}
  </div>;
};

// ── SLOT PICKER ──────────────────────────────
const SlotPicker=({slots,onConfirm,proposedDate})=>{
  const [selected,setSelected]=useState(null);
  const dayAgo=dAgo(proposedDate);
  const grouped={};
  slots.forEach(s=>{const[d,t]=s.split("_");if(!grouped[d])grouped[d]=[];grouped[d].push(t);});
  const days=Object.keys(grouped).sort();
  const isThisWeek=(d)=>{const now=new Date();const target=new Date(d);const diff=Math.ceil((target-now)/864e5);return diff<=7;};
  const dN={"1":"Lun","2":"Mar","3":"Mer","4":"Jeu","5":"Ven","6":"Sam","0":"Dim"};
  const mN=["jan","fév","mar","avr","mai","jun","jul","aoû","sep","oct","nov","déc"];
  const fmtDay=d=>{const dt=new Date(d);return `${dN[dt.getDay()]} ${dt.getDate()} ${mN[dt.getMonth()]}`;};
  return <Card style={{padding:22}}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
      <div style={{width:36,height:36,borderRadius:10,background:C.warn+"14",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="zap" s={18} c={C.warn}/></div>
      <div><div style={{fontSize:14,fontWeight:700,color:C.t1}}>Choisissez un créneau d'entretien</div><div style={{fontSize:12,color:C.warn,fontWeight:500}}>Le client souhaite avancer rapidement sur ce poste</div></div>
    </div>
    {dayAgo>=2&&<div style={{background:C.err+"08",border:`1px solid ${C.err}22`,borderRadius:8,padding:"8px 12px",marginBottom:14,fontSize:12,color:C.err}}>Créneaux proposés il y a {dayAgo}j — répondez pour sécuriser votre entretien</div>}
    <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:16}}>
      {days.map(d=>{const tw=isThisWeek(d);const dayColor=tw?C.ok:C.warn;return <div key={d} style={{minWidth:100}}>
        <div style={{fontSize:12,fontWeight:600,color:dayColor,marginBottom:6,display:"flex",alignItems:"center",gap:4}}><div style={{width:6,height:6,borderRadius:"50%",background:dayColor}}/>{fmtDay(d)}</div>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {grouped[d].map(t=>{const key=`${d}_${t}`;const sel=selected===key;const slotColor=tw?C.ok:C.warn;return <button key={key} onClick={()=>setSelected(key)} style={{background:sel?slotColor+"18":C.card2,border:`1.5px solid ${sel?slotColor:C.border}`,borderRadius:8,padding:"8px 14px",fontSize:13,fontWeight:sel?600:400,color:sel?slotColor:C.t1,cursor:"pointer",transition:"all .12s",textAlign:"center"}}>{t}</button>;})}
        </div>
      </div>;})}
    </div>
    <div style={{display:"flex",justifyContent:"flex-end"}}><Btn pr dis={!selected} onClick={()=>onConfirm(selected)} color={C.ok}><Ic n="check" s={14} c={C.wh}/> Confirmer ce créneau</Btn></div>
  </Card>;
};

// ── CV UPLOAD & FORMAT ───────────────────────
const CvUpload=({mission,candidate,onSaved})=>{
  const [step,setStep]=useState(candidate?.cv_text?"review":"upload");
  const [rawText,setRawText]=useState(candidate?.cv_text||"");
  const [parsed,setParsed]=useState(candidate?.ai_summary?tryParse(candidate.ai_summary):null);
  const [editing,setEditing]=useState(false);
  const [saving,setSaving]=useState(false);

  function tryParse(s){try{return JSON.parse(s);}catch{return {summary:s,experience:[],skills:[],education:[],languages:[]};}}

  const handlePaste=async()=>{
    if(!rawText.trim())return;
    setStep("parsing");
    const result=await parseCv(rawText,mission);
    if(result){setParsed(result);setStep("review");}
    else{
      // No API key or error — save raw text as summary
      const fallback={summary:rawText.slice(0,300)+"...",experience:[],skills:[],education:[],languages:[]};
      setParsed(fallback);setStep("review");
    }
  };

  const handleValidate=async()=>{
    setSaving(true);
    await saveMyCv(candidate.id,rawText,JSON.stringify(parsed)).catch(console.error);
    onSaved(rawText,parsed);
    setSaving(false);
  };

  return <Card style={{padding:22}}>
    <h3 style={{margin:"0 0 4px",fontSize:16,fontWeight:700,color:C.t1,display:"flex",alignItems:"center",gap:8}}><Ic n="file" s={18} c={C.acc}/> Mon CV</h3>
    <p style={{fontSize:12,color:C.t2,margin:"0 0 16px"}}>Collez votre CV — il sera formaté et envoyé à votre chasseur.</p>
    {step==="upload"&&<div>
      <textarea value={rawText} onChange={e=>setRawText(e.target.value)} placeholder={"Collez le contenu de votre CV ici...\n\nExemple :\nJulien Moreau — CTO\n12 ans d'expérience en tech...\n\nExpérience :\n• CTO chez XYZ (2021-2025)..."} style={{...IS,height:180,resize:"vertical",lineHeight:1.6}}/>
      <div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}>
        <Btn pr dis={!rawText.trim()} onClick={handlePaste}><Ic n="spark" s={14} c={C.wh}/> Formater avec l'IA</Btn>
      </div>
    </div>}
    {step==="parsing"&&<div style={{padding:40,textAlign:"center"}}>
      <div style={{display:"inline-block",width:24,height:24,border:`3px solid ${C.acc}33`,borderTopColor:C.acc,borderRadius:"50%",animation:"spin .8s linear infinite",marginBottom:12}}/>
      <div style={{fontSize:14,fontWeight:600,color:C.acc}}>Analyse en cours...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>}
    {step==="review"&&parsed&&<div>
      <div style={{background:C.ok+"08",border:`1px solid ${C.ok}22`,borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
        <Ic n="check" s={16} c={C.ok}/>
        <div><div style={{fontSize:13,fontWeight:600,color:C.ok}}>CV prêt</div><div style={{fontSize:11,color:C.t2,marginTop:1}}>Vérifiez et validez pour l'envoyer à votre chasseur</div></div>
      </div>
      <div style={{background:C.wh,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden",marginBottom:16,boxShadow:C.shadowM}}>
        <div style={{background:`linear-gradient(135deg,${C.acc},${C.acc3})`,padding:"18px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontSize:18,fontWeight:700,color:C.wh}}>Candidat — Profil confidentiel</div><div style={{fontSize:12,color:"rgba(255,255,255,.7)",marginTop:2}}>Adapté pour : {mission}</div></div>
          <Btn sm onClick={()=>setEditing(!editing)} style={{background:"rgba(255,255,255,.15)",border:"none",color:C.wh}}><Ic n="edit" s={12} c={C.wh}/> {editing?"Terminer":"Modifier"}</Btn>
        </div>
        <div style={{padding:"22px 24px"}}>
          <div style={{marginBottom:20,paddingBottom:18,borderBottom:`1px solid ${C.card2}`}}>
            <div style={{fontSize:11,fontWeight:700,color:C.acc,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Résumé professionnel</div>
            {editing?<textarea value={parsed.summary} onChange={e=>setParsed({...parsed,summary:e.target.value})} style={{...IS,height:60,resize:"vertical"}}/>:<p style={{fontSize:14,color:C.t1,lineHeight:1.8,margin:0}}>{parsed.summary}</p>}
          </div>
          {parsed.experience?.length>0&&<div style={{marginBottom:20,paddingBottom:18,borderBottom:`1px solid ${C.card2}`}}>
            <div style={{fontSize:11,fontWeight:700,color:C.acc,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Expérience</div>
            {parsed.experience.map((exp,i)=><div key={i} style={{marginBottom:16,paddingLeft:16,borderLeft:`3px solid ${C.acc}33`}}>
              <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:4}}><div style={{fontSize:15,fontWeight:600,color:C.t1}}>{exp.title}</div><div style={{fontSize:12,color:C.acc,fontWeight:600}}>{exp.duration}</div></div>
              <div style={{fontSize:13,color:C.acc2,marginTop:2,fontStyle:"italic"}}>{exp.company}</div>
              {exp.highlights?.map((h,j)=><div key={j} style={{fontSize:13,color:C.t2,marginTop:6,display:"flex",gap:8,alignItems:"flex-start"}}><div style={{width:4,height:4,borderRadius:"50%",background:C.acc,marginTop:6,flexShrink:0}}/>{h}</div>)}
            </div>)}
          </div>}
          <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
            {parsed.skills?.length>0&&<div style={{flex:2,minWidth:180}}>
              <div style={{fontSize:11,fontWeight:700,color:C.acc,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Compétences</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{parsed.skills.map(s=><span key={s} style={{background:C.acc+"12",color:C.acc,padding:"4px 12px",borderRadius:8,fontSize:12,fontWeight:600}}>{s}</span>)}</div>
            </div>}
            {parsed.education?.length>0&&<div style={{flex:1,minWidth:150}}>
              <div style={{fontSize:11,fontWeight:700,color:C.acc,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Formation</div>
              {parsed.education.map((e,i)=><div key={i} style={{fontSize:13,color:C.t2,marginBottom:6,lineHeight:1.4}}><strong style={{color:C.t1}}>{e.degree}</strong><br/>{e.school} ({e.year})</div>)}
            </div>}
            {parsed.languages?.length>0&&<div style={{minWidth:120}}>
              <div style={{fontSize:11,fontWeight:700,color:C.acc,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Langues</div>
              {parsed.languages.map((l,i)=><div key={i} style={{fontSize:13,color:C.t2,marginBottom:3}}>{l}</div>)}
            </div>}
          </div>
        </div>
        <div style={{background:C.card2,padding:"10px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:10,color:C.t3}}>Document confidentiel — Same Job</div>
          <div style={{fontSize:10,color:C.t3}}>Poste : {mission}</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <Btn sm onClick={()=>{setStep("upload");setParsed(null);setRawText("");}}>Recommencer</Btn>
        <Btn pr sm onClick={handleValidate} dis={saving} color={C.ok}><Ic n="check" s={14} c={C.wh}/> {saving?"Envoi...":"Valider et envoyer"}</Btn>
      </div>
    </div>}
  </Card>;
};

// ── MAIN APP ─────────────────────────────────
export default function Portal({session}){
  const [page,setPage]=useState("dashboard");
  const [candidate,setCandidate]=useState(null);
  const [applications,setApplications]=useState([]);
  const [selApp,setSelApp]=useState(null);
  const [loading,setLoading]=useState(true);
  const [editingProfile,setEditingProfile]=useState(false);
  const [profileForm,setProfileForm]=useState({});
  const [toast,setToast]=useState(null);
  const candRef=useRef(null);

  const showToast=(m,cl=C.ok)=>{setToast({m,cl});setTimeout(()=>setToast(null),3500);};

  useEffect(()=>{loadData();},[]);

  // Realtime — refresh on candidate_missions changes
  useEffect(()=>{
    if(!candRef.current)return;
    const channel=supabase.channel('candidate-realtime')
      .on('postgres_changes',{event:'*',schema:'public',table:'candidate_missions',filter:`candidate_id=eq.${candRef.current.id}`},
        ()=>getMyApplications(candRef.current.id).then(apps=>setApplications(apps)).catch(console.error))
      .subscribe();
    return()=>supabase.removeChannel(channel);
  },[candidate]);

  const loadData=async()=>{
    try{
      const cand=await getMyCandidate(session.user.id);
      candRef.current=cand;
      setCandidate(cand);
      setProfileForm({name:cand.full_name||'',email:cand.email||'',phone:cand.phone||'',role:cand.job_title||'',availability:cand.availability||'',salary:cand.salary_expectation||''});
      const apps=await getMyApplications(cand.id);
      setApplications(apps);
    }catch(e){console.error(e);}
    setLoading(false);
  };

  const handleConfirmSlot=async(appId,slot)=>{
    await confirmSlot(appId,slot).catch(console.error);
    const[date,time]=slot.split("_");
    setApplications(prev=>prev.map(a=>a.cmId===appId?{...a,pendingSlots:null,phase:"interview_scheduled",
      nextRdv:{date,time,duration:"1h",type:"Visio",with:"Responsable recrutement",link:null},
      steps:a.steps.map(s=>s.key==="interview_scheduled"?{...s,done:true,date}:s),
      lastUpdate:new Date().toISOString().slice(0,10)}:a));
    showToast("Créneau confirmé ! Votre entretien est planifié.");
  };

  const handleSaveProfile=async()=>{
    await updateMyProfile(candidate.id,profileForm).catch(console.error);
    setCandidate(c=>({...c,full_name:profileForm.name,phone:profileForm.phone,job_title:profileForm.role,availability:profileForm.availability,salary_expectation:profileForm.salary}));
    setEditingProfile(false);
    showToast("Profil mis à jour");
  };

  const handleCvSaved=(cvText,parsed)=>{
    setCandidate(c=>({...c,cv_text:cvText,ai_summary:JSON.stringify(parsed)}));
    showToast("CV envoyé à votre chasseur !");
  };

  const nav=[{k:"dashboard",l:"Mes candidatures",i:"briefcase"},{k:"cv",l:"Mon CV",i:"file"},{k:"profile",l:"Mon profil",i:"user"}];

  if(loading)return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:C.bg,fontFamily:"'Inter',-apple-system,sans-serif"}}><div style={{textAlign:"center",color:C.t2}}>Chargement...</div></div>;

  if(!candidate)return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:C.bg,fontFamily:"'Inter',-apple-system,sans-serif"}}>
    <div style={{textAlign:"center",color:C.t2,padding:40}}>
      <div style={{fontSize:16,fontWeight:600,marginBottom:8}}>Compte non reconnu</div>
      <div style={{fontSize:13,marginBottom:20}}>Ce compte n'est pas lié à un profil candidat Same Job.</div>
      <button onClick={signOut} style={{background:C.acc,color:C.wh,border:"none",borderRadius:10,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Se déconnecter</button>
    </div>
  </div>;

  const pendingActions=applications.filter(a=>a.pendingSlots).length;
  const hasCv=!!candidate.cv_text;
  const firstName=(candidate.full_name||'').split(' ')[0];
  const initials=(candidate.full_name||'??').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase();

  // ── DASHBOARD ──────────────────────────────
  const DashView=()=><div>
    {pendingActions>0&&<div style={{background:C.warn+"08",border:`1px solid ${C.warn}22`,borderRadius:14,padding:"14px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:12}}>
      <div style={{width:40,height:40,borderRadius:12,background:C.warn+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic n="calendar" s={20} c={C.warn}/></div>
      <div><div style={{fontSize:14,fontWeight:600,color:C.warn}}>Action requise</div><div style={{fontSize:13,color:C.t2}}>Vous avez {pendingActions} créneau{pendingActions>1?"x":""} d'entretien à confirmer</div></div>
    </div>}
    {!hasCv&&<div style={{background:C.acc+"06",border:`1px solid ${C.acc}22`,borderRadius:14,padding:"14px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:12,cursor:"pointer"}} onClick={()=>setPage("cv")}>
      <div style={{width:40,height:40,borderRadius:12,background:C.acc+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic n="upload" s={20} c={C.acc}/></div>
      <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:C.acc}}>Complétez votre dossier</div><div style={{fontSize:13,color:C.t2}}>Uploadez votre CV pour être présenté aux entreprises</div></div>
      <Ic n="chevR" s={16} c={C.acc}/>
    </div>}
    {applications.length===0&&<Card style={{padding:"32px",textAlign:"center"}}>
      <Ic n="briefcase" s={32} c={C.t3}/><div style={{fontSize:14,color:C.t2,marginTop:12}}>Aucune candidature en cours</div><div style={{fontSize:12,color:C.t3,marginTop:4}}>Votre chasseur Same Job vous présentera bientôt des opportunités.</div>
    </Card>}
    {applications.map(a=>{
      const company=a.steps.find(s=>s.revealCompany&&s.done)?.company;
      const da=dAgo(a.lastUpdate);
      return <Card key={a.cmId} onClick={()=>setSelApp(a.cmId)} style={{padding:"20px 24px",marginBottom:12,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.acc} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10,marginBottom:4}}>
          <div><div style={{fontSize:17,fontWeight:700,color:C.t1}}>{a.mission}</div>{company?<div style={{fontSize:13,color:C.acc2,marginTop:2}}>{company}</div>:<div style={{fontSize:12,color:C.t3,marginTop:2}}>Entreprise confidentielle</div>}</div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {a.pendingSlots&&<Badge c={C.warn}>Créneaux à confirmer</Badge>}
            {a.nextRdv&&!a.pendingSlots&&<Badge c={C.ok}>Entretien prévu</Badge>}
            {a.outcome==="offer"&&<Badge c={C.ok}>🎉 Offre reçue</Badge>}
            {a.outcome==="not_retained"&&<Badge c={C.t3}>Terminé</Badge>}
            {!a.nextRdv&&!a.pendingSlots&&!a.outcome&&<Badge c={C.acc}>En cours</Badge>}
          </div>
        </div>
        <Stepper steps={a.steps}/>
        <div style={{fontSize:11,color:C.t3}}>Dernière mise à jour {da===0?"aujourd'hui":`il y a ${da}j`}</div>
      </Card>;
    })}
  </div>;

  // ── APPLICATION DETAIL ─────────────────────
  const AppDetail=({a})=>{
    const company=a.steps.find(s=>s.revealCompany&&s.done)?.company;
    const da=dAgo(a.lastUpdate);
    return <div>
      <Btn onClick={()=>setSelApp(null)} style={{marginBottom:14}}>← Retour</Btn>
      <Card style={{padding:"24px 28px",marginBottom:18}}>
        <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:4}}>
          <div><h2 style={{margin:0,fontSize:22,fontWeight:700,color:C.t1}}>{a.mission}</h2>{company?<div style={{fontSize:14,color:C.acc2,marginTop:3}}>{company}</div>:<div style={{fontSize:13,color:C.t3,marginTop:3}}>Entreprise confidentielle — le nom sera révélé lors de l'entretien</div>}</div>
          <div style={{fontSize:12,color:C.t3}}>Mis à jour {da===0?"aujourd'hui":`il y a ${da}j`}</div>
        </div>
        <Stepper steps={a.steps}/>
      </Card>
      {a.nextRdv&&<Card style={{padding:"20px 24px",marginBottom:18,borderColor:C.ok+"44"}}>
        <h3 style={{margin:"0 0 12px",fontSize:15,fontWeight:600,color:C.ok,display:"flex",alignItems:"center",gap:6}}><Ic n="calendar" s={16} c={C.ok}/> Votre prochain entretien</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12}}>
          {[{l:"Date",v:a.nextRdv.date,i:"calendar"},{l:"Heure",v:a.nextRdv.time,i:"clock"},{l:"Durée",v:a.nextRdv.duration,i:"clock"},{l:"Format",v:a.nextRdv.type,i:"eye"},{l:"Avec",v:a.nextRdv.with,i:"user"}].map(x=><div key={x.l} style={{background:C.card2,borderRadius:10,padding:"10px 14px"}}>
            <div style={{fontSize:10,color:C.t3,textTransform:"uppercase",marginBottom:3,display:"flex",alignItems:"center",gap:4}}><Ic n={x.i} s={11} c={C.t3}/>{x.l}</div>
            <div style={{fontSize:14,fontWeight:600,color:C.t1}}>{x.v}</div>
          </div>)}
        </div>
        {a.nextRdv.link&&<a href={a.nextRdv.link} target="_blank" rel="noopener" style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:12,padding:"8px 16px",background:C.ok+"14",borderRadius:8,color:C.ok,fontSize:13,fontWeight:600,textDecoration:"none"}}><Ic n="link" s={14} c={C.ok}/> Rejoindre la visio</a>}
      </Card>}
      {a.pendingSlots&&<div style={{marginBottom:18}}><SlotPicker slots={a.pendingSlots.slots} proposedDate={a.pendingSlots.proposedDate} onConfirm={(slot)=>handleConfirmSlot(a.cmId,slot)}/></div>}
      {a.outcome==="offer"&&a.offer&&<Card style={{padding:"22px 26px",marginBottom:18,borderColor:C.ok+"55",background:C.ok+"04"}}>
        <h3 style={{margin:"0 0 12px",fontSize:16,fontWeight:700,color:C.ok,display:"flex",alignItems:"center",gap:8}}><Ic n="star" s={18} c={C.ok}/> Félicitations, vous avez reçu une offre !</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:14}}>
          <div style={{background:C.wh,borderRadius:10,padding:"12px 16px"}}><div style={{fontSize:10,color:C.t3,textTransform:"uppercase",marginBottom:3}}>Poste</div><div style={{fontSize:14,fontWeight:600,color:C.t1}}>{a.offer.title}</div></div>
          <div style={{background:C.wh,borderRadius:10,padding:"12px 16px"}}><div style={{fontSize:10,color:C.t3,textTransform:"uppercase",marginBottom:3}}>Rémunération</div><div style={{fontSize:14,fontWeight:600,color:C.ok}}>{a.offer.salary}</div></div>
          <div style={{background:C.wh,borderRadius:10,padding:"12px 16px"}}><div style={{fontSize:10,color:C.t3,textTransform:"uppercase",marginBottom:3}}>Démarrage</div><div style={{fontSize:14,fontWeight:600,color:C.t1}}>{a.offer.start}</div></div>
        </div>
        {a.offer.message&&<div style={{background:C.wh,borderRadius:10,padding:"14px 18px",fontSize:14,color:C.t2,lineHeight:1.7,fontStyle:"italic"}}>"{a.offer.message}"</div>}
        <div style={{fontSize:12,color:C.t2,marginTop:12}}>Contactez votre chasseur Same Job pour discuter de cette offre.</div>
      </Card>}
      {a.outcome==="not_retained"&&<Card style={{padding:"22px 26px",marginBottom:18}}>
        <h3 style={{margin:"0 0 8px",fontSize:15,fontWeight:600,color:C.t1}}>Le client a retenu un autre profil</h3>
        <p style={{fontSize:14,color:C.t2,lineHeight:1.7,margin:"0 0 12px"}}>Ce n'est pas un reflet de vos compétences — les processus de haut niveau sont très compétitifs.</p>
        <p style={{fontSize:14,color:C.acc,fontWeight:500,margin:0}}>Votre chasseur Same Job garde votre profil actif et vous présentera de nouvelles opportunités.</p>
      </Card>}
      {!a.pendingSlots&&!a.nextRdv&&!a.outcome&&<Card style={{padding:"20px 24px",background:C.acc+"04",borderColor:C.acc+"22"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,borderRadius:12,background:C.acc+"14",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic n="clock" s={18} c={C.acc}/></div>
          <div><div style={{fontSize:14,fontWeight:600,color:C.t1}}>Votre chasseur travaille activement sur votre dossier</div><div style={{fontSize:13,color:C.t2,marginTop:2}}>Vous serez notifié dès qu'il y a du nouveau. Pas besoin de relancer, on s'occupe de tout.</div></div>
        </div>
      </Card>}
    </div>;
  };

  // ── PROFILE ────────────────────────────────
  const ProfileView=()=><Card style={{padding:"24px 28px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <h3 style={{margin:0,fontSize:16,fontWeight:600,color:C.t1}}>Mes informations</h3>
      {editingProfile?<div style={{display:"flex",gap:6}}><Btn sm pr onClick={handleSaveProfile}><Ic n="check" s={13} c={C.wh}/> Enregistrer</Btn><Btn sm onClick={()=>setEditingProfile(false)}>Annuler</Btn></div>:<Btn sm onClick={()=>setEditingProfile(true)}><Ic n="edit" s={13}/> Modifier</Btn>}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      {[{l:"Nom",k:"name",dis:true},{l:"Email",k:"email",dis:true},{l:"Téléphone",k:"phone"},{l:"Poste actuel",k:"role"},{l:"Disponibilité",k:"availability"},{l:"Prétentions salariales",k:"salary"}].map(f=><div key={f.k} style={{display:"flex",flexDirection:"column",gap:3}}>
        <label style={{fontSize:10,color:C.t3,textTransform:"uppercase",letterSpacing:.5}}>{f.l}</label>
        {editingProfile&&!f.dis?<input value={profileForm[f.k]||''} onChange={e=>setProfileForm(p=>({...p,[f.k]:e.target.value}))} style={IS}/>:<div style={{padding:"10px 14px",background:C.card2,borderRadius:10,fontSize:13,color:f.dis?C.t3:C.t1}}>{profileForm[f.k]||'—'}</div>}
      </div>)}
    </div>
  </Card>;

  // ── RENDER ─────────────────────────────────
  const currentApp=selApp?applications.find(a=>a.cmId===selApp):null;
  const title=currentApp?currentApp.mission:nav.find(n=>n.k===page)?.l;

  return <div style={{display:"flex",height:"100vh",background:C.bg,fontFamily:"'Inter',-apple-system,sans-serif",color:C.t1,overflow:"hidden"}}>
    <div style={{width:240,background:C.bg2,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
      <div style={{padding:"22px 20px 24px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${C.acc},${C.acc3})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:C.wh}}>SJ</div>
          <div><div style={{fontWeight:700,fontSize:15,color:C.t1}}>Same Job</div><div style={{fontSize:10,color:C.t3}}>Espace Candidat</div></div>
        </div>
        <div style={{background:C.card2,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:C.acc+"14",color:C.acc,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12}}>{initials}</div>
          <div><div style={{fontSize:13,fontWeight:600,color:C.t1}}>{candidate.full_name}</div><div style={{fontSize:10,color:C.t2}}>{candidate.job_title}</div></div>
        </div>
      </div>
      <nav style={{flex:1,padding:"14px 10px"}}>
        {nav.map(n=>{const hasAlert=n.k==="dashboard"&&applications.some(a=>a.pendingSlots);const noCv=n.k==="cv"&&!hasCv;return <button key={n.k} onClick={()=>{setPage(n.k);setSelApp(null);}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 14px",background:page===n.k&&!selApp?C.acc+"10":"transparent",color:page===n.k&&!selApp?C.acc:C.t2,border:"none",borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:page===n.k&&!selApp?600:400,marginBottom:3}}>
          <Ic n={n.i} s={16} c={page===n.k&&!selApp?C.acc:C.t3}/>{n.l}
          {hasAlert&&<div style={{marginLeft:"auto",width:8,height:8,borderRadius:"50%",background:C.warn}}/>}
          {noCv&&<div style={{marginLeft:"auto",width:8,height:8,borderRadius:"50%",background:C.err}}/>}
        </button>;})}
      </nav>
      <div style={{padding:"14px 20px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:10,color:C.t3}}>Propulsé par <strong style={{color:C.acc}}>Same Job</strong></div>
        <button onClick={signOut} style={{background:"none",border:"none",cursor:"pointer",color:C.t3,display:"flex",alignItems:"center",gap:4,fontSize:11}} title="Se déconnecter"><Ic n="logout" s={14} c={C.t3}/></button>
      </div>
    </div>
    <div style={{flex:1,overflow:"auto",padding:"26px 34px"}}>
      <div style={{marginBottom:22}}>
        <h1 style={{margin:0,fontSize:22,fontWeight:700,color:C.t1}}>{title}</h1>
        {page==="dashboard"&&!selApp&&<p style={{margin:"3px 0 0",fontSize:13,color:C.t2}}>Bonjour {firstName}, on s'occupe de tout. Voici où en sont vos candidatures.</p>}
      </div>
      {currentApp?<AppDetail a={currentApp}/>:page==="cv"?<CvUpload mission={applications[0]?.mission||"Poste visé"} candidate={candidate} onSaved={handleCvSaved}/>:page==="profile"?<ProfileView/>:<DashView/>}
    </div>
    {toast&&<div style={{position:"fixed",bottom:24,right:24,background:C.bg2,border:`1px solid ${toast.cl}33`,borderRadius:12,padding:"12px 20px",color:toast.cl,fontSize:13,fontWeight:600,zIndex:2000,boxShadow:C.shadowM,display:"flex",alignItems:"center",gap:8,animation:"fadeIn .25s ease"}}><Ic n="check" s={16} c={toast.cl}/>{toast.m}<style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style></div>}
  </div>;
}
