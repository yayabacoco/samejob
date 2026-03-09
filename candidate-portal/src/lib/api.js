import { supabase } from './supabase'

// ── AUTH ──────────────────────────────────────

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.session
}

export async function signOut() {
  await supabase.auth.signOut()
}

// ── CANDIDATE PROFILE ─────────────────────────

export async function getMyCandidate(userId) {
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('candidate_portal_user_id', userId)
    .single()
  if (error) throw error
  return data
}

export async function updateMyProfile(candidateId, fields) {
  const { error } = await supabase
    .from('candidates')
    .update({
      full_name: fields.name,
      phone: fields.phone,
      job_title: fields.role,
      availability: fields.availability,
      salary_expectation: fields.salary,
    })
    .eq('id', candidateId)
  if (error) throw error
}

export async function saveMyCv(candidateId, cvText, aiSummary) {
  const { error } = await supabase
    .from('candidates')
    .update({ cv_text: cvText, ai_summary: aiSummary })
    .eq('id', candidateId)
  if (error) throw error
}

// ── APPLICATIONS ──────────────────────────────

export async function getMyApplications(candidateId) {
  const { data, error } = await supabase
    .from('candidate_missions')
    .select(`
      *,
      missions (
        id, title, salary, description, skills, status,
        companies ( id, name )
      )
    `)
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(cm => buildApplication(cm))
}

function buildApplication(cm) {
  const stage = cm.stage
  const phase = cm.client_phase
  const mission = cm.missions
  const company = mission?.companies?.name || null

  const rejected = cm.client_action === 'rejected' || phase === 'rejected'
  const hasOffer = ['offre', 'place'].includes(stage) || phase === 'offer_sent'
  const interviewDone = phase === 'interviewed' || ['offre', 'place'].includes(stage)
  const interviewScheduled = ['entretien_client', 'offre', 'place'].includes(stage) ||
    ['slots_proposed', 'interviewed', 'offer_sent'].includes(phase)
  const selected = phase !== 'new' || ['shortlist', 'entretien_client', 'offre', 'place'].includes(stage)

  const steps = [
    { key: 'presented', label: 'Profil présenté', done: true, date: (cm.created_at || '').slice(0, 10) },
    { key: 'selected', label: 'Sélectionné par le client', done: selected },
    { key: 'interview_scheduled', label: 'Entretien prévu', done: interviewScheduled,
      revealCompany: interviewScheduled, company: interviewScheduled ? company : null },
    { key: 'interview_done', label: 'Entretien réalisé', done: interviewDone },
    { key: 'decision', label: rejected ? 'Non retenu' : hasOffer ? 'Offre reçue !' : 'Décision',
      done: rejected || hasOffer, final: rejected ? 'not_retained' : hasOffer ? 'offer' : null },
  ]

  // Build nextRdv from confirmed slot
  let nextRdv = null
  if (cm.confirmed_slot) {
    const [date, time] = cm.confirmed_slot.split('_')
    nextRdv = { date, time, duration: '1h', type: 'Visio', with: 'Responsable recrutement', link: null }
  }

  // Build pending slots
  let pendingSlots = null
  if (phase === 'slots_proposed' && cm.client_slots?.length && !cm.confirmed_slot) {
    pendingSlots = { proposedDate: (cm.created_at || '').slice(0, 10), slots: cm.client_slots }
  }

  // Build offer
  let offer = null
  if (hasOffer) {
    offer = {
      title: mission?.title || '',
      salary: mission?.salary || 'À définir',
      start: 'À convenir',
      benefits: 'Selon politique entreprise',
      message: cm.client_offer || null,
    }
  }

  return {
    id: cm.id,
    cmId: cm.id,
    mission: mission?.title || 'Mission',
    company,
    companyRevealed: interviewScheduled,
    phase: rejected ? 'not_retained' : hasOffer ? 'offer_received' : interviewDone ? 'interview_done'
      : pendingSlots ? 'slots_pending' : interviewScheduled ? 'interview_scheduled' : selected ? 'selected' : 'presented',
    lastUpdate: cm.created_at ? cm.created_at.slice(0, 10) : '',
    steps,
    nextRdv,
    pendingSlots,
    outcome: rejected ? 'not_retained' : hasOffer ? 'offer' : null,
    offer,
  }
}

export async function confirmSlot(cmId, slot) {
  const { error } = await supabase
    .from('candidate_missions')
    .update({ confirmed_slot: slot })
    .eq('id', cmId)
  if (error) throw error
}
