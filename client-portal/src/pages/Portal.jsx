import { useState, useEffect, useRef } from "react";
import {
  getMyCompany, getMissionsWithProfiles,
  submitSlots, submitOffer, rejectProfile, validateProfile,
  getMessages, sendMessage, signOut,
} from '../lib/api'
import { supabase } from '../lib/supabase'

/* ═══════════════════════════════════════════════
   SAME JOB — Client Portal V2 (Supabase)
   ═══════════════════════════════════════════════ */

const C={bg:"#f5f7fb",bg2:"#ffffff",card:"#ffffff",card2:"#f0f2f8",border:"#e0e4ee",borderH:"#c4c9da",acc:"#6c5ce7",acc2:"#a29bfe",acc3:"#00cec9",ok:"#00b894",warn:"#f39c12",err:"#e74c3c",pink:"#e84393",hot:"#ff6b6b",t1:"#1a1d2e",t2:"#555b74",t3:"#8890a6",wh:"#fff",shadow:"0 2px 8px rgba(108,92,231,.05)",shadowM:"0 6px 20px rgba(0,0,0,.07)"};
const DIMS=["Technique","Soft Skills","Motivation","Fit culturel","Disponibilité"];
const P={briefcase:"M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16",users:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z",msg:"M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",check:"M20 6L9 17l-5-5",x:"M18 6L6 18M6 6l12 12",clock:"M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2",chevR:"M9 18l6-6-6-6",chevL:"M15 18l-6-6 6-6",send:"M22 2L11 13M22 2l-7 20-4-9-9-4z",calendar:"M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18",compare:"M18 20V10M12 20V4M6 20v-6",file:"M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6",bell:"M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",zap:"M13 2L3 14h9l-1 8 10-12h-9z",fire:"M12 22c4.97 0 9-3.58 9-8 0-2.52-2.04-5.77-3.57-7.77-.48-.63-1.43-.63-1.91 0C14.05 8.23 12 11.48 12 14c0 2.21-1.79 4-4 4-.6 0-1.17-.13-1.68-.37C8.06 20.37 9.88 22 12 22z",activity:"M22 12h-4l-3 9L9 3l-3 9H2",gift:"M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 110-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 100-5C13 2 12 7 12 7z",logout:"M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"};
const Ic=({n,s=18,c:cl})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={cl||"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{(P[n]||"").split("M").filter(Boolean).map((d,i)=><path key={i} d={"M"+d}/>)}</svg>;
const dUntil=d=>Math.max(0,Math.ceil((new Date(d).getTime()-Date.now())/864e5));
const dAgo=d=>Math.floor((Date.now()-new Date(d).getTime())/864e5);
const avgS=sc=>sc?.length?Math.round(sc.reduce((a,b)=>a+b,0)/sc.length*10):0;
const Badge=({c:cl=C.acc,children,pulse})=><span style={{background:cl+"14",color:cl,padding:"3px 11px",borderRadius:20,fontSize:11,fontWeight:600,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:4}}>{children}</span>;
const Btn=({children,pr,sm,onClick:oc,dis,outline,color:cl,style:st})=><button onClick={oc} disabled={dis} style={{background:pr?cl||C.acc:outline?"transparent":C.card2,color:pr?C.wh:cl||C.t2,border:outline?`1.5px solid ${cl||C.acc}`:pr?"none":`1px solid ${C.border}`,borderRadius:10,padding:sm?"6px 14px":"10px 20px",fontSize:sm?12:13,fontWeight:600,cursor:dis?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:6,opacity:dis?.45:1,transition:"all .15s",...st}}>{children}</button>;
const Card=({children,style:s,glow,...p})=><div style={{background:C.card,borderRadius:16,border:`1px solid ${glow?C.acc+"55":C.border}`,boxShadow:glow?`0 0 20px ${C.acc}15`:C.shadow,transition:"all .2s",...s}} {...p}>{children}</div>;
const IS={width:"100%",background:C.card2,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.t1,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"};

const Radar=({scores:sc,size:sz=180})=>{
  const cx=sz/2,r=sz/2-26,n=5;
  const ang=i=>(Math.PI*2*i/n)-Math.PI/2;
  const pt=(i,v)=>[cx+r*(v/10)*Math.cos(ang(i)),cx+r*(v/10)*Math.sin(ang(i))];
  return <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
    {[2,4,6,8,10].map(lv=><polygon key={lv} points={Array.from({length:n},(_,i)=>pt(i,lv).join(",")).join(" ")} fill="none" stroke={C.border} strokeWidth={.7}/>)}
    <polygon points={sc.map((_,i)=>pt(i,sc[i]).join(",")).join(" ")} fill={C.acc+"22"} stroke={C.acc} strokeWidth={2.5}/>
    {sc.map((v,i)=>{const[x,y]=pt(i,v);return <circle key={i} cx={x} cy={y} r={4} fill={C.wh} stroke={C.acc} strokeWidth={2.5}/>;})}
    {sc.map((_,i)=>{const[x,y]=pt(i,12);const lb=["Tech","Soft","Motiv","Fit","Dispo"];return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill={C.t2} fontSize={9} fontWeight={600}>{lb[i]}</text>;})}
  </svg>;
};

const ProgressBar=({profiles:cn})=>{
  const hasSL=cn.length>0;
  const hasInt=cn.some(p=>p.phase==="interviewed"||p.phase==="offer_sent");
  const hasOffer=cn.some(p=>p.phase==="offer_sent");
  const placed=cn.some(p=>p.phase==="placed");
  let pct=5;if(hasSL)pct=20;if(hasInt)pct=50;if(hasOffer)pct=75;if(placed)pct=100;
  const steps=[{l:"Recherche",done:true},{l:"Shortlist",done:hasSL},{l:"Entretiens",done:hasInt},{l:"Offre",done:hasOffer},{l:"Placement",done:placed}];
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>{steps.map((s,i)=><div key={i} style={{fontSize:10,fontWeight:600,color:s.done?C.acc:C.t3,textAlign:"center",flex:1}}>{s.l}</div>)}</div>
    <div style={{height:6,background:C.card2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${C.acc},${C.acc3})`,borderRadius:3,transition:"width .6s ease"}}/></div>
    <div style={{textAlign:"right",fontSize:11,color:C.acc,fontWeight:600,marginTop:3}}>{pct}%</div>
  </div>;
};

const WeekCal=({selected,onToggle,onClose,onConfirm,candidateAlias})=>{
  const [wo,setWo]=useState(0);
  const getDays=()=>{const now=new Date();const mon=new Date(now);mon.setDate(now.getDate()-now.getDay()+1+wo*7);return Array.from({length:5},(_,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);return d;});};
  const days=getDays();
  const slots=["09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00"];
  const fmt=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const dN=["Lun","Mar","Mer","Jeu","Ven"];
  const mN=["jan","fév","mar","avr","mai","jun","jul","aoû","sep","oct","nov","déc"];
  const isPast=d=>{const now=new Date();now.setHours(0,0,0,0);return d<now;};
  const isThisWeek=wo===0,isNextWeek=wo===1;
  const weekColor=isThisWeek?C.ok:isNextWeek?C.warn:C.t3;
  return <div style={{background:C.card,borderRadius:16,border:`1px solid ${C.border}`,padding:22,boxShadow:C.shadowM}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <h3 style={{margin:0,fontSize:16,fontWeight:700,color:C.t1}}>Proposez vos disponibilités</h3>
      <button onClick={onClose} style={{background:C.card2,border:"none",borderRadius:8,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Ic n="x" s={16} c={C.t3}/></button>
    </div>
    <div style={{background:C.hot+"08",border:`1px solid ${C.hot}22`,borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
      <Ic n="fire" s={16} c={C.hot}/>
      <div><div style={{fontSize:12,fontWeight:600,color:C.hot}}>{candidateAlias} est en process actif avec d'autres entreprises</div><div style={{fontSize:11,color:C.t2,marginTop:1}}>Les créneaux les plus proches maximisent vos chances</div></div>
    </div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <button onClick={()=>setWo(w=>w-1)} disabled={wo<=0} style={{background:C.card2,border:"none",borderRadius:8,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:wo<=0?"not-allowed":"pointer",opacity:wo<=0?.4:1}}><Ic n="chevL" s={16} c={C.t2}/></button>
      <span style={{fontSize:13,fontWeight:600,color:C.t1}}>Sem. {days[0].getDate()} {mN[days[0].getMonth()]} — {days[4].getDate()} {mN[days[4].getMonth()]}</span>
      <button onClick={()=>setWo(w=>w+1)} style={{background:C.card2,border:"none",borderRadius:8,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Ic n="chevR" s={16} c={C.t2}/></button>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"54px repeat(5,1fr)",gap:2,fontSize:12}}>
      <div/>{days.map((d,i)=><div key={i} style={{textAlign:"center",padding:"5px 0",fontWeight:600,color:isPast(d)?C.t3:C.t1,background:C.card2,borderRadius:5,fontSize:11}}>{dN[i]} {d.getDate()}</div>)}
      {slots.map(sl=><div key={sl} style={{display:"contents"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:6,fontSize:10,color:C.t3,height:28}}>{sl}</div>
        {days.map((d,di)=>{const key=`${fmt(d)}_${sl}`;const sel=selected.includes(key);const past=isPast(d);const slotColor=isThisWeek?C.ok:isNextWeek?C.warn:C.t3;return <div key={`${sl}-${di}`} onClick={()=>!past&&onToggle(key)} style={{height:28,borderRadius:4,background:sel?slotColor+"22":past?C.card2+"80":"transparent",border:`1px solid ${sel?slotColor:past?"transparent":C.border+"88"}`,cursor:past?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .1s"}}>{sel&&<div style={{width:7,height:7,borderRadius:"50%",background:slotColor}}/>}</div>;})}
      </div>)}
    </div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14}}>
      <span style={{fontSize:12,color:C.t2}}>{selected.length} créneau{selected.length>1?"x":""}</span>
      <div style={{display:"flex",gap:8}}><Btn sm onClick={onClose}>Annuler</Btn><Btn pr sm dis={selected.length===0} onClick={onConfirm}><Ic n="calendar" s={13} c={C.wh}/> Envoyer</Btn></div>
    </div>
  </div>;
};

const OfferForm=({candidateAlias,missionTitle,onSubmit,onCancel})=>{
  const [f,setF]=useState({title:missionTitle,salaryFixed:"",salaryVar:"",startDate:"",benefits:"",message:"",trialPeriod:"3 mois"});
  return <Card style={{padding:22}}>
    <h3 style={{margin:"0 0 4px",fontSize:16,fontWeight:700,color:C.t1}}>Proposition d'offre — {candidateAlias}</h3>
    <p style={{fontSize:12,color:C.t2,margin:"0 0 16px"}}>Transmise au candidat par votre chasseur Same Job.</p>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <div style={{gridColumn:"1/-1",display:"flex",flexDirection:"column",gap:3}}><label style={{fontSize:10,color:C.t3,textTransform:"uppercase",letterSpacing:.5}}>Intitulé du poste</label><input value={f.title} onChange={e=>setF({...f,title:e.target.value})} style={IS}/></div>
      <div style={{display:"flex",flexDirection:"column",gap:3}}><label style={{fontSize:10,color:C.t3,textTransform:"uppercase",letterSpacing:.5}}>Salaire fixe annuel brut</label><input value={f.salaryFixed} onChange={e=>setF({...f,salaryFixed:e.target.value})} placeholder="Ex: 130 000€" style={IS}/></div>
      <div style={{display:"flex",flexDirection:"column",gap:3}}><label style={{fontSize:10,color:C.t3,textTransform:"uppercase",letterSpacing:.5}}>Variable / Bonus</label><input value={f.salaryVar} onChange={e=>setF({...f,salaryVar:e.target.value})} placeholder="Ex: 15% sur objectifs" style={IS}/></div>
      <div style={{display:"flex",flexDirection:"column",gap:3}}><label style={{fontSize:10,color:C.t3,textTransform:"uppercase",letterSpacing:.5}}>Date de démarrage</label><input type="date" value={f.startDate} onChange={e=>setF({...f,startDate:e.target.value})} style={IS}/></div>
      <div style={{display:"flex",flexDirection:"column",gap:3}}><label style={{fontSize:10,color:C.t3,textTransform:"uppercase",letterSpacing:.5}}>Période d'essai</label><select value={f.trialPeriod} onChange={e=>setF({...f,trialPeriod:e.target.value})} style={{...IS,appearance:"auto"}}><option>3 mois</option><option>4 mois</option><option>6 mois</option><option>3 mois renouvelable</option><option>4 mois renouvelable</option></select></div>
      <div style={{gridColumn:"1/-1",display:"flex",flexDirection:"column",gap:3}}><label style={{fontSize:10,color:C.t3,textTransform:"uppercase",letterSpacing:.5}}>Avantages</label><input value={f.benefits} onChange={e=>setF({...f,benefits:e.target.value})} placeholder="Ex: 3j télétravail, véhicule de fonction..." style={IS}/></div>
      <div style={{gridColumn:"1/-1",display:"flex",flexDirection:"column",gap:3}}><label style={{fontSize:10,color:C.t3,textTransform:"uppercase",letterSpacing:.5}}>Message au candidat</label><textarea value={f.message} onChange={e=>setF({...f,message:e.target.value})} placeholder="Pourquoi ce candidat vous intéresse..." style={{...IS,height:80,resize:"vertical"}}/></div>
    </div>
    <div style={{display:"flex",gap:8,marginTop:16,justifyContent:"flex-end"}}><Btn sm onClick={onCancel}>Annuler</Btn><Btn pr sm dis={!f.salaryFixed||!f.startDate} onClick={()=>onSubmit(f)} color={C.ok}><Ic n="gift" s={14} c={C.wh}/> Envoyer la proposition</Btn></div>
  </Card>;
};

const phaseLabel={new:"À évaluer",validated:"Validé — créneaux en attente",slots_proposed:"Créneaux envoyés",interviewed:"Entretien réalisé",offer_sent:"Offre envoyée",placed:"Placé",rejected:"Rejeté"};
const phaseColor={new:C.warn,validated:C.acc,slots_proposed:C.acc3,interviewed:C.ok,offer_sent:C.pink,placed:C.ok,rejected:C.err};

export default function Portal({ session }) {
  const [page, setPage] = useState("dashboard");
  const [company, setCompany] = useState(null);
  const [missions, setMissions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selMis, setSelMis] = useState(null);
  const [selProf, setSelProf] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const companyRef = useRef(null);

  const showToast = (m, cl = C.ok) => { setToast({ m, cl }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    loadData();
  }, []);

  // ── REALTIME SUBSCRIPTIONS ─────────────────
  useEffect(() => {
    if (!companyRef.current) return;
    const compId = companyRef.current.id;

    const channel = supabase
      .channel('portal-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidate_missions' },
        () => refreshMissions(compId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' },
        () => refreshMissions(compId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'missions',
        filter: `company_id=eq.${compId}` },
        () => refreshMissions(compId))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'interactions',
        filter: `company_id=eq.${compId}` },
        (payload) => {
          const i = payload.new;
          if (!i.is_from_client) {
            setMessages(prev => [...prev, {
              id: i.id,
              from: 'Same Job',
              date: (i.created_at || '').slice(0, 10),
              text: i.content || '',
              context: i.context_label || null,
            }]);
            showToast('Nouveau message de votre chasseur', C.acc);
          }
        })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [company]);

  const refreshMissions = async (compId) => {
    try {
      const mis = await getMissionsWithProfiles(compId);
      setMissions(mis);
    } catch (e) { console.error(e); }
  };

  const loadData = async () => {
    try {
      const comp = await getMyCompany(session.user.id);
      companyRef.current = comp;
      setCompany(comp);
      const mis = await getMissionsWithProfiles(comp.id);
      setMissions(mis);
      const msgs = await getMessages(comp.id);
      setMessages(msgs);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleAction = async (profile, action, data) => {
    const mission = missions.find(m => m.id === profile.missionId);
    try {
      if (action === "validated") {
        await validateProfile(profile.cmId);
        updateProfileState(profile.cmId, { phase: "validated", isNew: false });
      }
      if (action === "slots_proposed") {
        await submitSlots(profile.cmId, data);
        updateProfileState(profile.cmId, { phase: "slots_proposed", slots: data, isNew: false });
        showToast("Créneaux envoyés !");
      }
      if (action === "offer_sent") {
        await submitOffer(profile.cmId, data);
        updateProfileState(profile.cmId, { phase: "offer_sent", offer: data, isNew: false });
        showToast("Proposition envoyée au candidat via Same Job !", C.ok);
      }
      if (action === "rejected") {
        await rejectProfile(profile.cmId, data);
        updateProfileState(profile.cmId, { phase: "rejected", rejectionReason: data, isNew: false });
        showToast("Profil rejeté — votre chasseur ajuste la recherche", C.err);
        setSelProf(null);
      }
      if (action === "new_interview") {
        await validateProfile(profile.cmId);
        updateProfileState(profile.cmId, { phase: "validated", isNew: false });
      }
    } catch (e) {
      showToast("Erreur — réessayez", C.err);
    }
  };

  const updateProfileState = (cmId, updates) => {
    setMissions(prev => prev.map(m => ({
      ...m,
      profiles: m.profiles.map(p => p.cmId === cmId ? { ...p, ...updates } : p)
    })));
  };

  const handleSend = async (text, contextLabel) => {
    if (!company || !text.trim()) return;
    await sendMessage(company.id, text, contextLabel);
    setMessages(prev => [...prev, { id: Date.now(), from: 'client', date: new Date().toISOString().slice(0, 10), text, context: contextLabel }]);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.bg, fontFamily: "'Inter',-apple-system,sans-serif" }}>
      <div style={{ textAlign: 'center', color: C.t2 }}>Chargement...</div>
    </div>
  );

  const allProfiles = missions.flatMap(m => m.profiles);
  const newCount = allProfiles.filter(p => p.isNew && p.phase === 'new').length;
  const contactName = company?.contacts?.[0]?.name || session.user.email;

  // ── PROFILE DETAIL ───────────────────────────
  const ProfileDetail = ({ p }) => {
    const m = missions.find(x => x.id === p.missionId);
    const sc = avgS(p.scores);
    const [action, setAction] = useState(null);
    const [reason, setReason] = useState("");
    const [slots, setSlots] = useState([]);
    const [msgTxt, setMsgTxt] = useState("");
    const toggleSlot = k => setSlots(s => s.includes(k) ? s.filter(x => x !== k) : [...s, k]);
    const canAct = p.phase === "new" || p.phase === "validated";
    const postInterview = p.phase === "interviewed";

    return <div>
      <Btn onClick={() => setSelProf(null)} style={{ marginBottom: 14 }}>← Retour à {m?.title}</Btn>
      <Card style={{ padding: "26px 30px", marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.acc + "14", color: C.acc, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, position: "relative" }}>
                {p.alias.slice(-1)}{p.isNew && <div style={{ position: "absolute", top: -2, right: -2, width: 12, height: 12, borderRadius: "50%", background: C.hot, border: `2px solid ${C.wh}` }} />}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: C.t1 }}>{p.alias}</h2>
                  {p.hot && <Badge c={C.hot}><Ic n="fire" s={11} c={C.hot} /> En process ailleurs</Badge>}
                  {p.isNew && <Badge c={C.hot}>Nouveau</Badge>}
                </div>
                <div style={{ color: C.t2, fontSize: 14, marginTop: 3 }}>{p.subtitle}</div>
                <div style={{ marginTop: 6 }}><Badge c={phaseColor[p.phase]}>{phaseLabel[p.phase]}</Badge></div>
              </div>
            </div>
            {p.summary && <div style={{ marginBottom: 16 }}><h4 style={{ fontSize: 14, fontWeight: 600, color: C.t1, margin: "0 0 6px" }}>Résumé</h4><p style={{ color: C.t2, fontSize: 14, lineHeight: 1.8, margin: 0 }}>{p.summary}</p></div>}
            {p.experience && <div style={{ marginBottom: 16 }}><h4 style={{ fontSize: 14, fontWeight: 600, color: C.t1, margin: "0 0 6px" }}>Parcours</h4><p style={{ color: C.t2, fontSize: 14, lineHeight: 1.8, margin: 0 }}>{p.experience}</p></div>}
            {p.skills.length > 0 && <div style={{ marginBottom: 16 }}><h4 style={{ fontSize: 14, fontWeight: 600, color: C.t1, margin: "0 0 6px" }}>Compétences</h4><div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{p.skills.map(s => <Badge key={s} c={m?.skills.includes(s) ? C.ok : C.acc2}>{s}{m?.skills.includes(s) ? " ✓" : ""}</Badge>)}</div></div>}
            {p.cr && <div style={{ background: C.card2, borderRadius: 12, padding: 16 }}><h4 style={{ fontSize: 13, fontWeight: 600, color: C.t1, margin: "0 0 6px", display: "flex", alignItems: "center", gap: 6 }}><Ic n="file" s={14} c={C.acc} /> Compte-rendu d'entretien</h4><p style={{ color: C.t2, fontSize: 13, lineHeight: 1.7, margin: 0 }}>{p.cr}</p>{p.interviewDate && <div style={{ fontSize: 11, color: C.t3, marginTop: 6 }}>Entretien du {p.interviewDate}</div>}</div>}
            {p.offer && <div style={{ background: C.ok + "08", border: `1px solid ${C.ok}22`, borderRadius: 12, padding: 16, marginTop: 12 }}><h4 style={{ fontSize: 13, fontWeight: 600, color: C.ok, margin: "0 0 6px" }}><Ic n="gift" s={14} c={C.ok} /> Votre proposition</h4><div style={{ fontSize: 13, color: C.t2, lineHeight: 1.6 }}>Poste : {p.offer.title}<br />Salaire : {p.offer.salaryFixed} + {p.offer.salaryVar}<br />Démarrage : {p.offer.startDate}</div></div>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minWidth: 210 }}>
            <Radar scores={p.scores} size={195} />
            <div style={{ fontSize: 30, fontWeight: 800, color: sc >= 85 ? C.ok : sc >= 70 ? C.acc : C.warn }}>{sc}<span style={{ fontSize: 13, fontWeight: 400, color: C.t3 }}>/100</span></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, width: "100%" }}>
              {DIMS.map((d, i) => <div key={d} style={{ background: C.card2, borderRadius: 8, padding: "7px 8px", textAlign: "center" }}><div style={{ fontSize: 9, color: C.t3 }}>{d}</div><div style={{ fontSize: 17, fontWeight: 700, color: p.scores[i] >= 8 ? C.ok : p.scores[i] >= 6 ? C.acc : C.warn }}>{p.scores[i]}/10</div></div>)}
            </div>
          </div>
        </div>
      </Card>

      {canAct && !action && <Card style={{ padding: "20px 24px", marginBottom: 18 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600, color: C.t1 }}>Votre décision</h3>
        {p.phase === "new" && <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Btn pr color={C.ok} onClick={() => { handleAction(p, "validated"); setAction("calendar"); }}><Ic n="check" s={15} c={C.wh} /> Valider — Proposer un entretien</Btn>
          <Btn outline color={C.err} onClick={() => setAction("reject")}><Ic n="x" s={15} c={C.err} /> Rejeter ce profil</Btn>
        </div>}
        {p.phase === "validated" && <div>
          <div style={{ background: C.acc + "08", border: `1px solid ${C.acc}22`, borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: C.acc }}>Profil validé — proposez vos disponibilités.</div>
          <Btn pr color={C.acc3} onClick={() => setAction("calendar")}><Ic n="calendar" s={15} c={C.wh} /> Proposer mes créneaux</Btn>
        </div>}
      </Card>}

      {postInterview && !action && <Card style={{ padding: "20px 24px", marginBottom: 18 }}>
        <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 600, color: C.t1 }}>Décision post-entretien</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Btn pr color={C.ok} onClick={() => setAction("offer")}><Ic n="gift" s={15} c={C.wh} /> Faire une proposition d'offre</Btn>
          <Btn pr color={C.acc3} onClick={() => { handleAction(p, "new_interview"); setAction("calendar"); }}><Ic n="calendar" s={15} c={C.wh} /> Nouvel entretien</Btn>
          <Btn outline color={C.err} onClick={() => setAction("reject")}><Ic n="x" s={15} c={C.err} /> Rejeter</Btn>
        </div>
      </Card>}

      {action === "reject" && <Card style={{ padding: "20px 24px", marginBottom: 18 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600, color: C.t1 }}>Motif du rejet</h3>
        <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex: Pas assez d'expérience en management..." style={{ ...IS, height: 80, resize: "vertical", marginBottom: 10 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <Btn sm onClick={() => { setAction(null); setReason(""); }}>Annuler</Btn>
          <Btn sm pr color={C.err} dis={!reason.trim()} onClick={() => { handleAction(p, "rejected", reason); setAction(null); }}><Ic n="x" s={13} c={C.wh} /> Confirmer</Btn>
        </div>
      </Card>}

      {action === "calendar" && <div style={{ marginBottom: 18 }}>
        <WeekCal selected={slots} onToggle={toggleSlot} candidateAlias={p.alias} onClose={() => { setAction(null); setSlots([]); }} onConfirm={() => { handleAction(p, "slots_proposed", slots); setAction(null); setSlots([]); }} />
      </div>}

      {action === "offer" && <div style={{ marginBottom: 18 }}>
        <OfferForm candidateAlias={p.alias} missionTitle={m?.title || ""} onCancel={() => setAction(null)} onSubmit={(data) => { handleAction(p, "offer_sent", data); setAction(null); }} />
      </div>}

      <Card style={{ padding: "18px 22px" }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: C.t1 }}>Message à votre chasseur sur {p.alias}</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={msgTxt} onChange={e => setMsgTxt(e.target.value)} placeholder="Posez une question..." onKeyDown={e => { if (e.key === "Enter" && msgTxt.trim()) { handleSend(msgTxt, p.alias); setMsgTxt(""); showToast("Message envoyé"); } }} style={{ flex: 1, ...IS }} />
          <Btn pr sm onClick={() => { if (msgTxt.trim()) { handleSend(msgTxt, p.alias); setMsgTxt(""); showToast("Message envoyé"); } }} dis={!msgTxt.trim()}><Ic n="send" s={14} c={C.wh} /></Btn>
        </div>
      </Card>
    </div>;
  };

  // ── MISSION VIEW ──────────────────────────────
  const MissionView = ({ m }) => {
    const dl = dUntil(m.deadline);
    const [compare, setCompare] = useState(false);
    if (compare) {
      const toC = m.profiles.filter(p => p.phase !== "rejected");
      return <div>
        <Btn onClick={() => setCompare(false)} style={{ marginBottom: 14 }}>← Retour</Btn>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: C.t1, marginBottom: 16 }}>Comparaison — {m.title}</h2>
        <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
          {toC.map(p => { const sc = avgS(p.scores); return <Card key={p.id} style={{ padding: 20, minWidth: 230, flex: 1 }}>
            <div style={{ textAlign: "center", marginBottom: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.acc + "14", color: C.acc, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, margin: "0 auto 6px" }}>{p.alias.slice(-1)}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.t1 }}>{p.alias}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}><Radar scores={p.scores} size={140} /></div>
            <div style={{ textAlign: "center", fontSize: 24, fontWeight: 800, color: sc >= 85 ? C.ok : sc >= 70 ? C.acc : C.warn, marginBottom: 8 }}>{sc}/100</div>
            <div style={{ textAlign: "center" }}><Badge c={phaseColor[p.phase]}>{phaseLabel[p.phase]}</Badge></div>
          </Card>; })}
        </div>
      </div>;
    }
    return <div>
      <Btn onClick={() => setSelMis(null)} style={{ marginBottom: 14 }}>← Retour</Btn>
      <Card style={{ padding: "22px 26px", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
          <div><h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.t1 }}>{m.title}</h2><div style={{ color: C.t2, marginTop: 3, fontSize: 13 }}>{m.salary} · Lancée le {m.startDate}</div></div>
          <Badge c={dl < 30 ? C.err : C.ok}>{dl}j restants</Badge>
        </div>
        <ProgressBar profiles={m.profiles} />
        {m.description && <p style={{ color: C.t2, fontSize: 13, lineHeight: 1.6, margin: "10px 0 12px" }}>{m.description}</p>}
        {m.skills.length > 0 && <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{m.skills.map(s => <Badge key={s} c={C.acc2}>{s}</Badge>)}</div>}
      </Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.t1 }}>Profils ({m.profiles.length})</h3>
        {m.profiles.length >= 2 && <Btn sm outline color={C.acc} onClick={() => setCompare(true)}><Ic n="compare" s={13} c={C.acc} /> Comparer</Btn>}
      </div>
      {m.profiles.map(p => { const sc = avgS(p.scores); return <Card key={p.cmId} glow={p.isNew} onClick={() => setSelProf(p.cmId)} style={{ padding: "16px 20px", marginBottom: 8, cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.borderColor = C.acc} onMouseLeave={e => e.currentTarget.style.borderColor = p.isNew ? C.acc + "55" : C.border}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: C.acc + "14", color: C.acc, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, position: "relative" }}>{p.alias.slice(-1)}{p.isNew && <div style={{ position: "absolute", top: -2, right: -2, width: 11, height: 11, borderRadius: "50%", background: C.hot, border: `2px solid ${C.wh}` }} />}</div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 15, fontWeight: 700, color: C.t1 }}>{p.alias}</span>{p.isNew && <Badge c={C.hot}>Nouveau</Badge>}{p.hot && <Badge c={C.warn}><Ic n="fire" s={10} c={C.warn} /> Demandé</Badge>}</div>
            <div style={{ fontSize: 12, color: C.t2, marginTop: 2 }}>{p.subtitle}</div>
          </div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 800, color: sc >= 85 ? C.ok : sc >= 70 ? C.acc : C.warn }}>{sc}</div><div style={{ fontSize: 9, color: C.t3 }}>Score</div></div>
          <Badge c={phaseColor[p.phase]}>{phaseLabel[p.phase]}</Badge>
          <Ic n="chevR" s={15} c={C.t3} />
        </div>
      </Card>; })}
    </div>;
  };

  // ── MESSAGES VIEW ─────────────────────────────
  const MsgView = () => {
    const [txt, setTxt] = useState("");
    const [ctx, setCtx] = useState("Général");
    const ctxs = ["Général", ...missions.map(m => m.title)];
    const flt = ctx === "Général" ? messages : messages.filter(m => m.context === ctx);
    return <Card style={{ padding: "20px 24px", display: "flex", flexDirection: "column", minHeight: 440 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600, color: C.t1 }}>Messages avec Same Job</h3>
      <div style={{ display: "flex", gap: 3, marginBottom: 12, flexWrap: "wrap" }}>{ctxs.map(c => <button key={c} onClick={() => setCtx(c)} style={{ background: ctx === c ? C.acc + "14" : C.card2, color: ctx === c ? C.acc : C.t3, border: "none", borderRadius: 7, padding: "4px 11px", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{c}</button>)}</div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, marginBottom: 12, maxHeight: 400, overflow: "auto" }}>
        {flt.map(m => { const isMe = m.from === 'client'; return <div key={m.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}><div style={{ maxWidth: "78%", background: isMe ? C.acc + "10" : C.card2, borderRadius: 14, borderBottomRightRadius: isMe ? 4 : 14, borderBottomLeftRadius: isMe ? 14 : 4, padding: "11px 15px" }}>{m.context && <div style={{ fontSize: 9, color: C.acc, fontWeight: 600, marginBottom: 2 }}>📌 {m.context}</div>}<div style={{ fontSize: 10, color: C.t3, marginBottom: 3 }}>{isMe ? contactName : 'Same Job'} · {m.date}</div><div style={{ fontSize: 13, color: C.t1, lineHeight: 1.6 }}>{m.text}</div></div></div>; })}
        {flt.length === 0 && <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.t3, fontSize: 12 }}>Aucun message</div>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={txt} onChange={e => setTxt(e.target.value)} placeholder="Écrivez à votre chasseur..." onKeyDown={e => { if (e.key === "Enter" && txt.trim()) { handleSend(txt, ctx === "Général" ? null : ctx); setTxt(""); } }} style={{ flex: 1, ...IS }} />
        <Btn pr onClick={() => { if (txt.trim()) { handleSend(txt, ctx === "Général" ? null : ctx); setTxt(""); } }} dis={!txt.trim()}><Ic n="send" s={15} c={C.wh} /></Btn>
      </div>
    </Card>;
  };

  // ── DASHBOARD ─────────────────────────────────
  const DashView = () => {
    const pending = allProfiles.filter(p => p.phase === "new").length;
    const interviewed = allProfiles.filter(p => p.phase === "interviewed").length;
    return <div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 22 }}>
        {[
          { l: "Missions actives", v: missions.length, ic: "briefcase", cl: C.acc, sub: "en cours" },
          { l: "Nouveaux profils", v: newCount, ic: "zap", cl: C.hot, sub: "à découvrir" },
          { l: "À évaluer", v: pending, ic: "users", cl: C.warn, sub: "en attente" },
          { l: "Post-entretien", v: interviewed, ic: "calendar", cl: C.ok, sub: "décision à prendre" },
        ].map(s => <Card key={s.l} glow={s.v > 0 && s.cl === C.hot} style={{ padding: "16px 20px", flex: 1, minWidth: 160 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}><div style={{ width: 32, height: 32, borderRadius: 9, background: s.cl + "12", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic n={s.ic} s={16} c={s.cl} /></div><span style={{ fontSize: 11, color: C.t2 }}>{s.l}</span></div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.t1 }}>{s.v}</div><div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>{s.sub}</div>
        </Card>)}
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: C.t1, marginBottom: 12 }}>Vos missions</h3>
      {missions.map(m => { const dl = dUntil(m.deadline); const nw = m.profiles.filter(p => p.isNew).length; return <Card key={m.id} glow={nw > 0} onClick={() => setSelMis(m.id)} style={{ padding: "18px 22px", marginBottom: 12, cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.borderColor = C.acc} onMouseLeave={e => e.currentTarget.style.borderColor = nw > 0 ? C.acc + "55" : C.border}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <div><div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 16, fontWeight: 700, color: C.t1 }}>{m.title}</span>{nw > 0 && <Badge c={C.hot}>{nw} nouveau{nw > 1 ? "x" : ""}</Badge>}</div><div style={{ fontSize: 12, color: C.t2, marginTop: 2 }}>{m.salary} · Deadline {dl}j</div></div>
          <Badge c={dl < 30 ? C.err : C.ok}>{dl}j</Badge>
        </div>
        <ProgressBar profiles={m.profiles} />
      </Card>; })}
      {missions.length === 0 && <Card style={{ padding: 32, textAlign: "center", color: C.t3 }}>Aucune mission active</Card>}
    </div>;
  };

  const render = () => {
    if (selProf) { const p = allProfiles.find(x => x.cmId === selProf); if (p) return <ProfileDetail p={p} />; }
    if (selMis) { const m = missions.find(x => x.id === selMis); if (m) return <MissionView m={m} />; }
    if (page === "messages") return <MsgView />;
    return <DashView />;
  };

  const title = selProf ? allProfiles.find(p => p.cmId === selProf)?.alias : selMis ? missions.find(m => m.id === selMis)?.title : page === "messages" ? "Messages" : "Tableau de bord";

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: "'Inter',-apple-system,sans-serif", color: C.t1, overflow: "hidden" }}>
      {/* Sidebar */}
      <div style={{ width: 245, background: C.bg2, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "22px 18px 20px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${C.acc},${C.acc3})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: C.wh }}>SJ</div>
            <div><div style={{ fontWeight: 700, fontSize: 15, color: C.t1 }}>Same Job</div><div style={{ fontSize: 10, color: C.t3 }}>Espace Client</div></div>
          </div>
          <div style={{ background: C.card2, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.acc + "14", color: C.acc, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11 }}>{(company?.name || '?').slice(0, 2).toUpperCase()}</div>
            <div><div style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>{company?.name}</div><div style={{ fontSize: 10, color: C.t2 }}>{contactName}</div></div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "12px 8px" }}>
          {[{ k: "dashboard", l: "Tableau de bord", i: "briefcase" }, { k: "messages", l: "Messages", i: "msg" }].map(n => <button key={n.k} onClick={() => { setPage(n.k); setSelMis(null); setSelProf(null); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 14px", background: page === n.k && !selMis && !selProf ? C.acc + "10" : "transparent", color: page === n.k && !selMis && !selProf ? C.acc : C.t2, border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: page === n.k ? 600 : 400, marginBottom: 3 }}>
            <Ic n={n.i} s={16} c={page === n.k && !selMis && !selProf ? C.acc : C.t3} />{n.l}
            {n.k === "dashboard" && newCount > 0 && <span style={{ marginLeft: "auto", background: C.hot, color: C.wh, fontSize: 9, fontWeight: 700, borderRadius: 10, padding: "2px 7px" }}>{newCount}</span>}
          </button>)}
          <div style={{ padding: "12px 14px 6px", fontSize: 10, color: C.t3, textTransform: "uppercase", letterSpacing: .5, marginTop: 8 }}>Missions</div>
          {missions.map(m => { const np = m.profiles.filter(p => p.isNew).length; return <button key={m.id} onClick={() => { setSelMis(m.id); setSelProf(null); }} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", padding: "7px 14px", background: selMis === m.id ? C.acc + "10" : "transparent", color: selMis === m.id ? C.acc : C.t2, border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: selMis === m.id ? 600 : 400, marginBottom: 2 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: selMis === m.id ? C.acc : C.t3 }} />{m.title}
            {np > 0 && <span style={{ marginLeft: "auto", background: C.hot + "18", color: C.hot, fontSize: 9, fontWeight: 700, borderRadius: 10, padding: "1px 6px" }}>{np}</span>}
          </button>; })}
        </nav>
        <div style={{ padding: "12px 18px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: C.t3 }}>Propulsé par <strong style={{ color: C.acc }}>Same Job</strong></span>
          <button onClick={signOut} style={{ background: "none", border: "none", cursor: "pointer", color: C.t3, display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}><Ic n="logout" s={13} c={C.t3} /></button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto", padding: "24px 32px", background: C.bg }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.t1 }}>{title}</h1>
            {!selMis && !selProf && page === "dashboard" && <p style={{ margin: "3px 0 0", fontSize: 13, color: C.t2 }}>Bienvenue, {contactName}</p>}
          </div>
        </div>
        {render()}
      </div>

      {toast && <div style={{ position: "fixed", bottom: 24, right: 24, background: C.bg2, border: `1px solid ${toast.cl}33`, borderRadius: 12, padding: "12px 20px", color: toast.cl, fontSize: 13, fontWeight: 600, zIndex: 2000, boxShadow: C.shadowM, display: "flex", alignItems: "center", gap: 8 }}>{toast.m}</div>}
    </div>
  );
}
