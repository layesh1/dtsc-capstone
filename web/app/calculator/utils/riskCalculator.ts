import { AppEntry, AppCategory, RiskLevel, RiskAssessment } from '../types'

// ─── Real regression coefficients from NSCH 2022 analysis ────────────────────

// H1 ADHD — interaction model, reference = age 0–5
// OR per screen-hour (age 0-5) = 1.513; 12-17 modifier × 0.749; 6-11 modifier × 0.706
const ADHD_MODEL = {
  intercept: -6.8244,
  screentime: 0.4144,
  mod_12_17: -0.2892,
  mod_6_11:  -0.3477,
}

// H2 Anxiety — interaction model, reference = age 12–17
// OR per screen-hour (age 12-17) = 1.302; 0-5 modifier × 1.453; 6-11 modifier × 1.225
const ANXIETY_MODEL = {
  intercept: -3.1884,
  screentime: 0.2638,
  mod_0_5:  0.3734,
  mod_6_11: 0.2028,
}

// H2 Depression — simple model (age interaction not significant, p>0.05)
// OR per screen-hour = 1.224
const DEPRESSION_MODEL = {
  intercept: -4.5246,
  screentime: 0.2019,
}

// ─── Helper: logistic probability ────────────────────────────────────────────
function logistic(logit: number): number {
  return 1 / (1 + Math.exp(-logit))
}

// ─── Predicted probabilities ─────────────────────────────────────────────────
function adhdProb(hours: number, age: number): number {
  const mod = age <= 5 ? 0 : age <= 11 ? ADHD_MODEL.mod_6_11 : ADHD_MODEL.mod_12_17
  return logistic(ADHD_MODEL.intercept + (ADHD_MODEL.screentime + mod) * hours) * 100
}

function anxietyProb(hours: number, age: number): number {
  const mod = age <= 5 ? ANXIETY_MODEL.mod_0_5 : age <= 11 ? ANXIETY_MODEL.mod_6_11 : 0
  return logistic(ANXIETY_MODEL.intercept + (ANXIETY_MODEL.screentime + mod) * hours) * 100
}

function depressionProb(hours: number): number {
  return logistic(DEPRESSION_MODEL.intercept + DEPRESSION_MODEL.screentime * hours) * 100
}

// ─── Map probability → risk level ────────────────────────────────────────────
// Thresholds calibrated to the observed range of predicted probabilities
function probToRisk(prob: number, type: 'adhd' | 'anxiety' | 'depression'): RiskLevel {
  if (type === 'adhd') {
    if (prob < 1.0)  return 'LOW'
    if (prob < 2.5)  return 'MODERATE'
    if (prob < 5.0)  return 'ELEVATED'
    return 'HIGH'
  }
  if (type === 'anxiety') {
    if (prob < 5.0)  return 'LOW'
    if (prob < 10.0) return 'MODERATE'
    if (prob < 16.0) return 'ELEVATED'
    return 'HIGH'
  }
  // depression
  if (prob < 8.0)  return 'LOW'
  if (prob < 14.0) return 'MODERATE'
  if (prob < 20.0) return 'ELEVATED'
  return 'HIGH'
}

// Physical activity — derived from H3 finding: 4+ hrs/day → 0.7 fewer active days/week
function physicalActivityRisk(hours: number): RiskLevel {
  if (hours < 1)  return 'LOW'
  if (hours < 2)  return 'LOW'
  if (hours < 3)  return 'MODERATE'
  if (hours < 4)  return 'ELEVATED'
  return 'HIGH'
}

// ─── Recommendation generator ────────────────────────────────────────────────
function buildRecommendation(
  age: number,
  totalHours: number,
  socialHours: number,
  adhdLevel: RiskLevel,
  anxietyLevel: RiskLevel,
): string {
  const ageGroup = age <= 5 ? '0-5' : age <= 11 ? '6-11' : age <= 17 ? '12-17' : '18+'

  if (ageGroup === '0-5') {
    if (adhdLevel === 'HIGH' || adhdLevel === 'ELEVATED')
      return `Ages 0–5 show the steepest screen→ADHD link in our data (OR 1.51/hr). Replace 30 min screen time with active play to move from ${adhdLevel} → MODERATE ADHD risk.`
    if (totalHours >= 1)
      return `AAP recommends <1 hr/day for ages 2–5. Current usage is above threshold — limit and prioritize unstructured play.`
    return `Screen time is within AAP guidelines. Continue prioritizing play and face-to-face interaction.`
  }

  if (ageGroup === '6-11') {
    if (totalHours >= 4)
      return `4+ hrs/day linked to 0.7 fewer active days/week (H3 finding). Reducing by 1 hr would meaningfully lower both physical and ADHD risk.`
    if (adhdLevel === 'ELEVATED' || adhdLevel === 'HIGH')
      return `Swap 30 min screen time for outdoor activity — associated with lower ADHD risk in the 6–11 cohort.`
    return `Usage appears manageable. Balance screen time with physical activity for best outcomes.`
  }

  if (ageGroup === '12-17') {
    if (socialHours >= 3)
      return `3+ hrs social media is associated with 2.1× higher anxiety odds in ages 12–17. Replacing 30 min social media with a structured activity is the highest-impact change.`
    if (anxietyLevel === 'ELEVATED' || anxietyLevel === 'HIGH')
      return `Anxiety/depression risk is highest in this age group (OR 1.30/hr). Reducing total screen time by 1 hr/day, especially social media, would have meaningful impact.`
    if (totalHours >= 4)
      return `4+ hrs/day puts physical activity at risk (−0.7 active days/week). Consider setting a 2–3 hr daily limit.`
    return `Levels appear manageable. Monitor social media use specifically — it's the strongest predictor in this age group.`
  }

  // 18+
  if (totalHours >= 5)
    return `High screen time is associated with reduced physical activity across all ages. Consider setting a daily limit of 3–4 hrs for best health outcomes.`
  return `Screen time appears balanced for your age group.`
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function calculateTotalTime(apps: AppEntry[]): number {
  return apps.reduce((t, a) => t + a.hours + a.minutes / 60, 0)
}

export function calculateCategoryTime(apps: AppEntry[], category: AppCategory): number {
  return apps
    .filter(a => a.category === category)
    .reduce((t, a) => t + a.hours + a.minutes / 60, 0)
}

export function formatTime(totalHours: number): string {
  const h = Math.floor(totalHours)
  const m = Math.round((totalHours - h) * 60)
  if (h === 0) return `${m}m`
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

export function generateTimeBar(totalHours: number): string {
  return '█'.repeat(Math.min(Math.ceil(totalHours / 0.5), 8))
}

export function calculateRiskAssessment(age: number, apps: AppEntry[]): RiskAssessment {
  const total = calculateTotalTime(apps)
  const social = calculateCategoryTime(apps, 'social')

  const adhdP   = adhdProb(total, age)
  const anxP    = anxietyProb(total, age)
  const depP    = depressionProb(total)

  const adhdLevel    = probToRisk(adhdP,  'adhd')
  const anxLevel     = probToRisk(anxP,   'anxiety')
  const depLevel     = probToRisk(depP,   'depression')
  const paLevel      = physicalActivityRisk(total)

  // Anxiety/depression: show whichever is worse
  const anxDepLevel: RiskLevel = (['HIGH', 'ELEVATED', 'MODERATE', 'LOW'] as RiskLevel[])
    .find(l => anxLevel === l || depLevel === l) ?? 'LOW'

  return {
    anxietyDepression: anxDepLevel,
    physicalActivity:  paLevel,
    adhd:              adhdLevel,
    recommendation:    buildRecommendation(age, total, social, adhdLevel, anxLevel),
  }
}

export function getRiskIcon(level: RiskLevel): string {
  switch (level) {
    case 'HIGH':     return '⚠⚠'
    case 'ELEVATED': return '⚠'
    case 'MODERATE': return '△'
    case 'LOW':      return '✓'
  }
}

export function getCategoryDisplay(category: AppCategory): string {
  const map: Record<AppCategory, string> = {
    social: 'Social', video: 'Video', game: 'Game', school: 'School', other: 'Other',
  }
  return map[category]
}
