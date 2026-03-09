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

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

// ── COMPANY (linked to logged-in user) ────────

export async function getMyCompany(userId) {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('portal_user_id', userId)
    .single()
  if (error) throw error
  return data
}

// ── MISSIONS + PROFILES ───────────────────────

export async function getMissionsWithProfiles(companyId) {
  const { data: missions, error } = await supabase
    .from('missions')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
  if (error) throw error

  const missionIds = missions.map(m => m.id)
  if (missionIds.length === 0) return missions.map(m => ({ ...m, profiles: [] }))

  const { data: candMissions } = await supabase
    .from('candidate_missions')
    .select('*, candidates(*)')
    .in('mission_id', missionIds)

  return missions.map(m => ({
    id: m.id,
    title: m.title,
    salary: m.salary || '',
    status: m.status || 'nouveau',
    startDate: (m.created_at || '').slice(0, 10),
    deadline: m.deadline || '',
    description: m.description || '',
    skills: m.skills || [],
    profiles: (candMissions || [])
      .filter(cm => cm.mission_id === m.id)
      .map(cm => ({
        cmId: cm.id,
        id: cm.candidate_id,
        missionId: m.id,
        alias: cm.candidates?.client_alias || anonymize(cm.candidates?.full_name),
        subtitle: buildSubtitle(cm.candidates),
        scores: [
          cm.candidates?.score_technique ?? 5,
          cm.candidates?.score_soft ?? 5,
          cm.candidates?.score_motivation ?? 5,
          cm.candidates?.score_fit ?? 5,
          cm.candidates?.score_dispo ?? 5,
        ],
        skills: cm.candidates?.skills || [],
        summary: cm.candidates?.client_summary || cm.candidates?.notes || '',
        experience: cm.candidates?.experience || '',
        cr: cm.candidates?.interview_report || '',
        interviewDate: cm.interview_date || '',
        phase: cm.client_phase || 'new',
        hot: cm.candidates?.is_hot || false,
        addedDate: (cm.created_at || '').slice(0, 10),
        isNew: cm.is_new_for_client ?? true,
        slots: cm.client_slots || [],
        offer: cm.client_offer || null,
        rejectionReason: cm.client_rejection_reason || '',
      }))
  }))
}

function anonymize(name) {
  if (!name) return 'Candidat'
  const parts = name.trim().split(' ')
  return `Candidat ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`
}

function buildSubtitle(c) {
  if (!c) return ''
  const parts = []
  if (c.job_title) parts.push(c.job_title)
  return parts.join(' — ')
}

// ── CLIENT DECISIONS ──────────────────────────

export async function updateClientPhase(cmId, phase, extra = {}) {
  const { error } = await supabase
    .from('candidate_missions')
    .update({
      client_phase: phase,
      is_new_for_client: false,
      ...extra,
    })
    .eq('id', cmId)
  if (error) throw error
}

export async function submitSlots(cmId, slots) {
  return updateClientPhase(cmId, 'slots_proposed', { client_slots: slots })
}

export async function submitOffer(cmId, offer) {
  return updateClientPhase(cmId, 'offer_sent', { client_offer: offer })
}

export async function rejectProfile(cmId, reason) {
  return updateClientPhase(cmId, 'rejected', { client_rejection_reason: reason })
}

export async function validateProfile(cmId) {
  return updateClientPhase(cmId, 'validated')
}

// ── MESSAGES ──────────────────────────────────

export async function getMessages(companyId) {
  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true })
  if (error) return []
  return (data || []).map(i => ({
    id: i.id,
    from: i.is_from_client ? 'client' : 'Same Job',
    date: (i.created_at || '').slice(0, 10),
    text: i.content || '',
    context: i.context_label || null,
  }))
}

export async function sendMessage(companyId, text, contextLabel) {
  const { error } = await supabase.from('interactions').insert({
    company_id: companyId,
    type: 'message',
    content: text,
    is_from_client: true,
    context_label: contextLabel || null,
  })
  if (error) throw error
}
