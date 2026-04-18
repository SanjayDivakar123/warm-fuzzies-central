export interface ReusableAssessmentOption {
  id: string
  assessmentType: string
  displayName: string
  completedAt: string
  dominantColor: string | null
  totalQuestions: number | null
  sourceKind: 'personal' | 'company' | 'code'
  sourceLabel: string
  matchesCompanyAssessment: boolean
  mismatchWarning: string | null
}

interface LookupOptions {
  companyAssessmentCategory?: string | null
  companyAssessmentType?: string | null
}

interface AssessmentResultRow {
  id: string
  assessment_type: string
  created_at: string
  updated_at: string
  results: Record<string, unknown> | null
}

const COMPANY_CATEGORY_LABELS: Record<string, string> = {
  professional: 'Professional',
  entrepreneur: 'Entrepreneur',
  executive: 'Executive',
  manager: 'Manager',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function normalizeAssessmentType(assessmentType: string | null | undefined): string {
  return (assessmentType || '').toLowerCase().trim()
}

export function isReusableAssessmentType(assessmentType: string | null | undefined): boolean {
  const normalized = normalizeAssessmentType(assessmentType)

  if (!normalized) return false
  if (['free', 'quiz', 'voice'].includes(normalized)) return false
  if (normalized === 'premium' || normalized === 'pro') return true
  if (/^professional_(25q|50q)$/.test(normalized)) return true
  if (/^candidate_(professional|entrepreneur|executive|manager)_(25q|50q)$/.test(normalized)) return true

  return false
}

export function hasCompletedResultPayload(results: unknown): results is Record<string, unknown> {
  if (!isRecord(results)) return false

  const status = typeof results.status === 'string' ? results.status.toLowerCase() : null
  if (status === 'payment_completed') return false

  const dominantColor = typeof results.dominantColor === 'string' ? results.dominantColor : null
  const primaryColor = typeof results.primaryColor === 'string' ? results.primaryColor : null
  const scores = isRecord(results.scores) ? results.scores : null
  const colorScores = isRecord(results.colorScores) ? results.colorScores : null

  return Boolean(dominantColor || primaryColor || scores || colorScores)
}

function buildCompanyAssessmentKey(
  companyAssessmentCategory?: string | null,
  companyAssessmentType?: string | null,
): string | null {
  if (!companyAssessmentCategory || !companyAssessmentType) return null
  return `${companyAssessmentCategory.toLowerCase()}_${companyAssessmentType.toLowerCase()}`
}

function normalizeReusableComparisonType(assessmentType: string): string | null {
  const normalized = normalizeAssessmentType(assessmentType)

  if (!normalized) return null
  if (normalized.startsWith('candidate_')) {
    return normalized.slice('candidate_'.length)
  }
  if (/^(professional|entrepreneur|executive|manager)_(25q|50q)$/.test(normalized)) {
    return normalized
  }

  return null
}

function getMismatchWarning(displayName: string): string {
  return `This saved assessment is different from the one your company assigned. Using ${displayName} may affect how your company compares and interprets your results.`
}

function getAssessmentDisplayName(assessmentType: string): string {
  const normalized = normalizeAssessmentType(assessmentType)

  if (normalized === 'premium') return 'Premium Leadership Assessment'
  if (normalized === 'pro') return 'Pro Deep Dive Assessment'
  if (normalized === 'professional_25q') return 'Professional 25-Question Assessment'
  if (normalized === 'professional_50q') return 'Professional 50-Question Assessment'

  const candidateMatch = normalized.match(/^candidate_(professional|entrepreneur|executive|manager)_(25q|50q)$/)
  if (candidateMatch) {
    const [, category, questionCount] = candidateMatch
    const categoryLabel = COMPANY_CATEGORY_LABELS[category] || category
    const totalLabel = questionCount === '50q' ? '50-Question' : '25-Question'
    return `${categoryLabel} ${totalLabel} Assessment`
  }

  return assessmentType
}

function inferSourceKind(
  resultId: string,
  directCandidateResultIds: Set<string>,
  directCompanyResultIds: Set<string>,
): 'personal' | 'company' | 'code' {
  if (directCandidateResultIds.has(resultId)) return 'code'
  if (directCompanyResultIds.has(resultId)) return 'company'
  return 'personal'
}

function getSourceLabel(sourceKind: 'personal' | 'company' | 'code'): string {
  if (sourceKind === 'code') return 'Saved from a code-based invite'
  if (sourceKind === 'company') return 'Saved from a previous company portal'
  return 'Saved in your personal account'
}

function getCompletedAt(row: AssessmentResultRow): string {
  const results = isRecord(row.results) ? row.results : null
  const resultCompletedAt = typeof results?.completedAt === 'string' ? results.completedAt : null
  return resultCompletedAt || row.updated_at || row.created_at
}

function getDominantColor(row: AssessmentResultRow): string | null {
  const results = isRecord(row.results) ? row.results : null
  const dominantColor = typeof results?.dominantColor === 'string' ? results.dominantColor : null
  const primaryColor = typeof results?.primaryColor === 'string' ? results.primaryColor : null
  return dominantColor || primaryColor
}

function getTotalQuestions(row: AssessmentResultRow): number | null {
  const results = isRecord(row.results) ? row.results : null
  const totalQuestions = results?.totalQuestions
  return typeof totalQuestions === 'number' ? totalQuestions : null
}

async function findAuthUserIdByEmail(supabase: any, email: string): Promise<string | null> {
  const normalizedEmail = email.toLowerCase()
  let page = 1

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    })

    if (error) throw error

    const users = data?.users || []
    const match = users.find((user: any) => (user.email || '').toLowerCase() === normalizedEmail)
    if (match?.id) return match.id

    if (users.length < 1000) break
    page += 1
  }

  return null
}

export async function findReusableAssessmentsForEmail(
  supabase: any,
  email: string,
  options: LookupOptions = {},
): Promise<ReusableAssessmentOption[]> {
  const normalizedEmail = email.toLowerCase().trim()
  const companyAssessmentKey = buildCompanyAssessmentKey(
    options.companyAssessmentCategory,
    options.companyAssessmentType,
  )

  const authUserId = await findAuthUserIdByEmail(supabase, normalizedEmail)

  const [{ data: companyUsers, error: companyUsersError }, { data: candidates, error: candidatesError }] =
    await Promise.all([
      supabase
        .from('company_users')
        .select('id, user_id, assessment_result_id')
        .eq('email', normalizedEmail),
      supabase
        .from('candidates')
        .select('id, assessment_result_id')
        .eq('email', normalizedEmail),
    ])

  if (companyUsersError) throw companyUsersError
  if (candidatesError) throw candidatesError

  const userIdsToSearch = new Set<string>()
  const directResultIds = new Set<string>()
  const directCompanyResultIds = new Set<string>()
  const directCandidateResultIds = new Set<string>()

  if (authUserId) userIdsToSearch.add(authUserId)

  for (const row of companyUsers || []) {
    if (row.id) userIdsToSearch.add(row.id)
    if (row.user_id) userIdsToSearch.add(row.user_id)
    if (row.assessment_result_id) {
      directResultIds.add(row.assessment_result_id)
      directCompanyResultIds.add(row.assessment_result_id)
    }
  }

  for (const row of candidates || []) {
    if (row.id) userIdsToSearch.add(row.id)
    if (row.assessment_result_id) {
      directResultIds.add(row.assessment_result_id)
      directCandidateResultIds.add(row.assessment_result_id)
    }
  }

  const userIdList = Array.from(userIdsToSearch)
  const directResultIdList = Array.from(directResultIds)
  const rowsById = new Map<string, AssessmentResultRow>()

  if (userIdList.length > 0) {
    const { data: userRows, error: userRowsError } = await supabase
      .from('assessment_results')
      .select('id, assessment_type, created_at, updated_at, results')
      .in('user_id', userIdList)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (userRowsError) throw userRowsError

    for (const row of userRows || []) {
      rowsById.set(row.id, row as AssessmentResultRow)
    }
  }

  if (directResultIdList.length > 0) {
    const missingIds = directResultIdList.filter((id) => !rowsById.has(id))

    if (missingIds.length > 0) {
      const { data: directRows, error: directRowsError } = await supabase
        .from('assessment_results')
        .select('id, assessment_type, created_at, updated_at, results')
        .in('id', missingIds)

      if (directRowsError) throw directRowsError

      for (const row of directRows || []) {
        rowsById.set(row.id, row as AssessmentResultRow)
      }
    }
  }

  const reusableAssessments = Array.from(rowsById.values())
    .filter((row) => isReusableAssessmentType(row.assessment_type))
    .filter((row) => hasCompletedResultPayload(row.results))
    .map((row) => {
      const displayName = getAssessmentDisplayName(row.assessment_type)
      const sourceKind = inferSourceKind(row.id, directCandidateResultIds, directCompanyResultIds)
      const normalizedComparableType = normalizeReusableComparisonType(row.assessment_type)
      const matchesCompanyAssessment = !!companyAssessmentKey && normalizedComparableType === companyAssessmentKey

      return {
        id: row.id,
        assessmentType: row.assessment_type,
        displayName,
        completedAt: getCompletedAt(row),
        dominantColor: getDominantColor(row),
        totalQuestions: getTotalQuestions(row),
        sourceKind,
        sourceLabel: getSourceLabel(sourceKind),
        matchesCompanyAssessment,
        mismatchWarning: matchesCompanyAssessment || !companyAssessmentKey ? null : getMismatchWarning(displayName),
      } satisfies ReusableAssessmentOption
    })
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())

  return reusableAssessments
}
