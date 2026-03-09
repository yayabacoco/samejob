import { supabase } from './supabase'

// ── MAPPINGS ─────────────────────────────────

const STAGE_FROM_DB = {
  sourcing: 'Sourcing',
  entretien_interne: 'Entretien interne',
  shortlist: 'Shortlist',
  entretien_client: 'Entretien client',
  offre: 'Offre',
  place: 'Placé',
}

export const STAGE_TO_DB = {
  'Sourcing': 'sourcing',
  'Entretien interne': 'entretien_interne',
  'Shortlist': 'shortlist',
  'Entretien client': 'entretien_client',
  'Offre': 'offre',
  'Placé': 'place',
}

const COMPANY_STATUS_FROM_DB = { actif: 'Actif', prospect: 'Prospect', inactif: 'Inactif' }
export const COMPANY_STATUS_TO_DB = { 'Actif': 'actif', 'Prospect': 'prospect', 'Inactif': 'inactif' }

const MISSION_STATUS_FROM_DB = { nouveau: 'Nouveau', en_cours: 'En cours', place: 'Placé' }
export const MISSION_STATUS_TO_DB = { 'Nouveau': 'nouveau', 'En cours': 'en_cours', 'Placé': 'place' }

const initials = name => (name || '??').split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase()

// ── USERS CACHE ──────────────────────────────

let usersCache = null

async function getUsers() {
  if (usersCache) return usersCache
  const { data } = await supabase.from('users').select('id, full_name')
  usersCache = data || []
  return usersCache
}

export function resolveUserName(userId, users, currentUserId) {
  if (!userId) return 'Vous'
  if (userId === currentUserId) return 'Vous'
  const u = (users || []).find(u => u.id === userId)
  return u?.full_name || 'Inconnu'
}

// ── COMPANIES ────────────────────────────────

export async function getCompanies(currentUserId) {
  const [
    { data: companies, error },
    { data: contacts },
    { data: interactions },
  ] = await Promise.all([
    supabase.from('companies').select('*').order('created_at', { ascending: false }),
    supabase.from('company_contacts').select('*'),
    supabase.from('interactions').select('*').eq('entity_type', 'company').order('created_at', { ascending: false }),
  ])

  if (error) throw error

  return (companies || []).map(c => ({
    id: c.id,
    name: c.name,
    sector: c.sector || '',
    status: COMPANY_STATUS_FROM_DB[c.status] || 'Prospect',
    mandatStage: c.mandat_stage || 'Premier contact',
    notes: c.notes || '',
    revenue: c.revenue || 0,
    contacts: (contacts || [])
      .filter(ct => ct.company_id === c.id)
      .map(ct => ({
        name: ct.full_name || ct.name || '',
        role: ct.job_title || ct.role || '',
        email: ct.email || '',
        phone: ct.phone || '',
      })),
    history: (interactions || [])
      .filter(i => i.entity_id === c.id)
      .map(i => ({
        id: i.id,
        date: (i.created_at || '').slice(0, 10),
        type: i.type || 'note',
        text: i.text || '',
        context: i.context_label || null,
        isFromClient: i.is_from_client || false,
        by: i.is_from_client ? 'Client' : 'Vous',
      })),
  }))
}

// ── CANDIDATES ───────────────────────────────

export async function getCandidates(currentUserId) {
  const [
    { data: candidates, error },
    { data: candMissions },
    { data: missions },
    { data: interactions },
    { data: companies },
    users,
  ] = await Promise.all([
    supabase.from('candidates').select('*').order('created_at', { ascending: false }),
    supabase.from('candidate_missions').select('*'),
    supabase.from('missions').select('id, title, company_id'),
    supabase.from('interactions').select('*').eq('entity_type', 'candidate').order('created_at', { ascending: false }),
    supabase.from('companies').select('id, name'),
    getUsers(),
  ])

  if (error) throw error

  return (candidates || []).map(c => {
    const myMissions = (candMissions || []).filter(cm => cm.candidate_id === c.id)
    const missionTitles = myMissions
      .map(cm => (missions || []).find(m => m.id === cm.mission_id)?.title)
      .filter(Boolean)

    let companyName = ''
    if (myMissions.length > 0) {
      const firstMission = (missions || []).find(m => m.id === myMissions[0].mission_id)
      if (firstMission) {
        companyName = (companies || []).find(co => co.id === firstMission.company_id)?.name || ''
      }
    }

    return {
      id: c.id,
      name: c.full_name || '',
      role: c.job_title || '',
      email: c.email || '',
      phone: c.phone || '',
      skills: c.skills || [],
      scores: [
        c.score_technique ?? 5,
        c.score_soft ?? 5,
        c.score_motivation ?? 5,
        c.score_fit ?? 5,
        c.score_dispo ?? 5,
      ],
      stage: STAGE_FROM_DB[c.stage] || 'Sourcing',
      salary: c.salary_expectation || '',
      available: c.availability === 'disponible' || c.availability === true,
      missions: missionTitles,
      company: companyName,
      avatar: initials(c.full_name),
      consultant: resolveUserName(c.consultant_id, users, currentUserId),
      history: (interactions || [])
        .filter(i => i.entity_id === c.id)
        .map(i => ({
          date: (i.created_at || '').slice(0, 10),
          type: i.type || 'note',
          text: i.text || '',
          by: resolveUserName(i.author_id, users, currentUserId),
        })),
      docs: [],
      cvText: c.cv_text || '',
      aiSummary: c.ai_summary || '',
    }
  })
}

// ── MISSIONS ────────────────────────────────

export async function getMissions(currentUserId) {
  const [
    { data: missions, error },
    { data: companies },
    users,
  ] = await Promise.all([
    supabase.from('missions').select('*').order('created_at', { ascending: false }),
    supabase.from('companies').select('id, name'),
    getUsers(),
  ])

  if (error) throw error

  return (missions || []).map(m => {
    const comp = (companies || []).find(c => c.id === m.company_id)
    return {
      id: m.id,
      title: m.title || '',
      company: comp?.name || '',
      companyId: m.company_id,
      salary: m.salary || '',
      fee: m.fee_percent ? `${m.fee_percent}%` : '18%',
      status: MISSION_STATUS_FROM_DB[m.status] || 'Nouveau',
      startDate: (m.created_at || '').slice(0, 10),
      deadline: m.deadline || '',
      location: m.location || '',
      contract: m.contract_type || 'CDI',
      experience: m.experience_required || '',
      skills: m.skills || [],
      description: m.description || '',
      requirements: m.requirements || [],
      remote: m.remote_policy || '',
      consultant: resolveUserName(m.consultant_id, users, currentUserId),
    }
  })
}

// ── REMINDERS ───────────────────────────────

export async function getReminders() {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('done', false)
    .order('due_date', { ascending: true })
    .limit(10)

  if (error) return []

  return (data || []).map(r => ({
    id: r.id,
    text: r.content || r.text || '',
    date: r.due_date || r.date || '',
    done: r.done || false,
    linked: r.linked_name || '',
  }))
}

// ── CANDIDATE MUTATIONS ──────────────────────

export async function updateCandidateStage(id, stage) {
  const { error } = await supabase
    .from('candidates')
    .update({ stage: STAGE_TO_DB[stage] || 'sourcing' })
    .eq('id', id)
  if (error) throw error
}

export async function updateCandidateScores(id, scores) {
  const { error } = await supabase
    .from('candidates')
    .update({
      score_technique: scores[0],
      score_soft: scores[1],
      score_motivation: scores[2],
      score_fit: scores[3],
      score_dispo: scores[4],
    })
    .eq('id', id)
  if (error) throw error
}

export async function addCandidateInteraction(candidateId, { type, text }) {
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('interactions').insert({
    entity_type: 'candidate',
    entity_id: candidateId,
    type,
    text,
    author_id: user?.id,
  })
  if (error) throw error
}

export async function addCompanyInteraction(companyId, { type, text }) {
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('interactions').insert({
    entity_type: 'company',
    entity_id: companyId,
    type,
    text,
    author_id: user?.id,
  })
  if (error) throw error
}

export async function sendMessageToClient(companyId, text) {
  const { error } = await supabase.from('company_messages').insert({
    company_id: companyId,
    text,
    is_from_client: false,
  })
  if (error) throw error
}

export async function getCompanyMessages(companyId) {
  const { data, error } = await supabase
    .from('company_messages')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true })
  if (error) return []
  return (data || []).map(m => ({
    id: m.id,
    text: m.text,
    isFromClient: m.is_from_client,
    date: (m.created_at || '').slice(0, 10),
    by: m.is_from_client ? 'Client' : 'Vous',
  }))
}

// ── CREATE MUTATIONS ─────────────────────────

export async function createCandidate(data) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data: cand, error } = await supabase
    .from('candidates')
    .insert({
      full_name: data.name,
      email: data.email,
      phone: data.phone,
      job_title: data.role,
      skills: data.skills,
      salary_expectation: data.salary,
      score_technique: data.scores[0],
      score_soft: data.scores[1],
      score_motivation: data.scores[2],
      score_fit: data.scores[3],
      score_dispo: data.scores[4],
      stage: 'sourcing',
      consultant_id: user?.id,
      availability: 'disponible',
    })
    .select()
    .single()
  if (error) throw error
  return cand
}

export async function createCompany(data) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data: comp, error } = await supabase
    .from('companies')
    .insert({
      name: data.name,
      sector: data.sector,
      status: COMPANY_STATUS_TO_DB[data.status] || 'prospect',
      notes: data.notes,
    })
    .select()
    .single()
  if (error) throw error

  if (data.contacts?.[0]?.email) {
    await supabase.from('company_contacts').insert({
      company_id: comp.id,
      full_name: data.contacts[0].name,
      job_title: data.contacts[0].role,
      email: data.contacts[0].email,
      phone: data.contacts[0].phone,
    })
  }
  return comp
}

// ── CLIENT PORTAL ACCESS ─────────────────────

const SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY
const SUPABASE_URL_BASE = 'https://gbgbtbzrcsqmyckrcehe.supabase.co'

export async function createClientAccess(companyId, email) {
  const password = Math.random().toString(36).slice(-8) + 'A1!'

  // 1. Créer le compte auth via Admin API
  const res = await fetch(`${SUPABASE_URL_BASE}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.msg || data.message || 'Erreur création compte')

  // 2. Lier le compte à l'entreprise
  const { error } = await supabase
    .from('companies')
    .update({ portal_user_id: data.id })
    .eq('id', companyId)
  if (error) throw error

  return { email, password, userId: data.id }
}

export async function revokeClientAccess(companyId) {
  const { error } = await supabase
    .from('companies')
    .update({ portal_user_id: null })
    .eq('id', companyId)
  if (error) throw error
}

export async function updateCandidateInfo(id, data) {
  const { error } = await supabase
    .from('candidates')
    .update({
      full_name: data.name,
      job_title: data.role,
      email: data.email,
      phone: data.phone,
      salary_expectation: data.salary,
      availability: data.available ? 'disponible' : 'en_poste',
      skills: data.skills,
    })
    .eq('id', id)
  if (error) throw error
}

export async function updateCandidateCvSummary(id, { cvText, aiSummary }) {
  const { error } = await supabase
    .from('candidates')
    .update({ cv_text: cvText, ai_summary: aiSummary })
    .eq('id', id)
  if (error) throw error
}

export async function assignMissionToCandidate(candidateId, missionId) {
  const { error } = await supabase
    .from('candidate_missions')
    .insert({ candidate_id: candidateId, mission_id: missionId })
  if (error) throw error
}

export async function unassignMissionFromCandidate(candidateId, missionId) {
  const { error } = await supabase
    .from('candidate_missions')
    .delete()
    .eq('candidate_id', candidateId)
    .eq('mission_id', missionId)
  if (error) throw error
}

export async function createMission(data, companyId) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data: mission, error } = await supabase
    .from('missions')
    .insert({
      title: data.title,
      company_id: companyId,
      salary: data.salary,
      fee_percent: parseInt(data.fee) || 18,
      status: MISSION_STATUS_TO_DB[data.status] || 'nouveau',
      location: data.location,
      contract_type: data.contract,
      experience_required: data.experience,
      skills: data.skills,
      description: data.description,
      requirements: data.requirements,
      remote_policy: data.remote,
      deadline: data.deadline,
      consultant_id: user?.id,
    })
    .select()
    .single()
  if (error) throw error
  return mission
}
