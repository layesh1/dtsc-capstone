'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Brain, Activity, Heart, AlertCircle, CheckCircle, Info } from 'lucide-react'

// ─── Regression Coefficients (from scripts/h1_analysis.py & h2_analysis.py) ──

// H1 ADHD — interaction model, reference group = age 0–5
// OR per screen-hour (age 0-5 base) = 1.513; modifiers: 12-17 × 0.749, 6-11 × 0.706
const ADHD = {
  intercept: -6.8244,
  screentime: 0.4144,
  ref: '0-5' as const,
  interaction_12_17: -0.2892,
  interaction_6_11:  -0.3477,
}

// H2 Anxiety — interaction model, reference group = age 12–17
// OR per screen-hour (age 12-17 base) = 1.302; modifiers: 0-5 × 1.453, 6-11 × 1.225
const ANXIETY = {
  intercept: -3.1884,
  screentime: 0.2638,
  ref: '12-17' as const,
  interaction_0_5:  0.3734,
  interaction_6_11: 0.2028,
}

// H2 Depression — interaction model, reference group = age 12–17
// Age interactions NOT significant (p=0.069, p=0.562) — use simple model
// Simple model: intercept=-4.5246, OR per screen-hour = 1.224
const DEPRESSION = {
  intercept: -4.5246,
  screentime: 0.2019,
  ref: 'all' as const,
}

type AgeGroup = '0-5' | '6-11' | '12-17'

function predictADHD(screentime: number, age: AgeGroup): number {
  // ref = 0-5; modifiers reduce effect for older groups
  const modifier = age === '12-17' ? ADHD.interaction_12_17 : age === '6-11' ? ADHD.interaction_6_11 : 0
  const logit = ADHD.intercept + (ADHD.screentime + modifier) * screentime
  return (1 / (1 + Math.exp(-logit))) * 100
}

function predictAnxiety(screentime: number, age: AgeGroup): number {
  // ref = 12-17; modifiers increase effect for younger groups
  const modifier = age === '0-5' ? ANXIETY.interaction_0_5 : age === '6-11' ? ANXIETY.interaction_6_11 : 0
  const logit = ANXIETY.intercept + (ANXIETY.screentime + modifier) * screentime
  return (1 / (1 + Math.exp(-logit))) * 100
}

function predictDepression(screentime: number): number {
  // No significant age interaction — simple model only
  const logit = DEPRESSION.intercept + DEPRESSION.screentime * screentime
  return (1 / (1 + Math.exp(-logit))) * 100
}

// Screentime ordinal → midpoint hours for calculation
const screentimeMap: Record<number, number> = {
  0: 0.5,  // < 1 hr
  1: 1,
  2: 2,
  3: 3,
  4: 4.5,  // 4+ hrs
}

const screentimeLabels = ['< 1 hr', '1 hr', '2 hrs', '3 hrs', '4+ hrs']

function RiskBar({ label, prob, icon: Icon, color, bg }: {
  label: string; prob: number; icon: typeof Brain; color: string; bg: string
}) {
  const level = prob < 1.5 ? 'Low' : prob < 3.5 ? 'Moderate' : 'Elevated'
  const levelColor = prob < 1.5 ? 'text-emerald-400' : prob < 3.5 ? 'text-amber-400' : 'text-rose-400'

  return (
    <div className={`rounded-2xl border p-5 ${bg}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={16} className={color} />
          <span className="text-sm font-medium text-zinc-300">{label}</span>
        </div>
        <span className={`text-xs font-semibold ${levelColor}`}>{level}</span>
      </div>
      <div className="text-3xl font-bold text-white mb-3">{prob.toFixed(2)}%</div>
      <div className="w-full bg-white/5 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${
            prob < 1.5 ? 'bg-emerald-500' : prob < 3.5 ? 'bg-amber-500' : 'bg-rose-500'
          }`}
          style={{ width: `${Math.min(prob * 10, 100)}%` }}
        />
      </div>
      <div className="text-xs text-zinc-500 mt-2">Predicted probability</div>
    </div>
  )
}

export default function Calculator() {
  const [age, setAge] = useState<AgeGroup>('6-11')
  const [screentimeIdx, setScreentimeIdx] = useState(2) // 2 hrs default

  const hrs = screentimeMap[screentimeIdx]
  const adhd = predictADHD(hrs, age)
  const anxiety = predictAnxiety(hrs, age)
  const depression = predictDepression(hrs)

  const overallRisk = (adhd + anxiety + depression) / 3
  const riskLabel = overallRisk < 1.5 ? 'Low Risk' : overallRisk < 3.5 ? 'Moderate Risk' : 'Elevated Risk'
  const riskColor = overallRisk < 1.5 ? 'text-emerald-400' : overallRisk < 3.5 ? 'text-amber-400' : 'text-rose-400'

  const aaRecommended = age === '0-5' ? 1 : age === '6-11' ? 2 : 2
  const overLimit = hrs > aaRecommended

  return (
    <main className="min-h-screen bg-[#070b14] text-white">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center gap-4 max-w-4xl mx-auto">
        <Link href="/" className="text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <span className="text-sm text-zinc-400">Screen Time Risk Calculator</span>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-zinc-500">
          <Info size={12} />
          Based on NSCH 2022 regression analysis
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Child Health Risk Calculator</h1>
        <p className="text-zinc-400 mb-10 text-sm leading-relaxed max-w-xl">
          Predicted probabilities of ADHD, anxiety, and depression based on your child's age group
          and daily screen time — calculated directly from our logistic regression model.
        </p>

        {/* Inputs */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* Age Group */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-4 block">
              Age Group
            </label>
            <div className="flex flex-col gap-2">
              {(['0-5', '6-11', '12-17'] as AgeGroup[]).map((a) => (
                <button
                  key={a}
                  onClick={() => setAge(a)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium text-left transition-all ${
                    age === a
                      ? 'bg-violet-600 text-white'
                      : 'bg-white/3 text-zinc-400 hover:bg-white/6 border border-white/5'
                  }`}
                >
                  Ages {a}
                  <span className="text-xs ml-2 opacity-60">
                    {a === '0-5' ? '· Early childhood' : a === '6-11' ? '· School age' : '· Adolescent'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Screen Time Slider */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1 block">
              Daily Screen Time
            </label>
            <div className="text-4xl font-bold text-white mb-6 mt-2">
              {screentimeLabels[screentimeIdx]}
            </div>
            <input
              type="range"
              min={0}
              max={4}
              step={1}
              value={screentimeIdx}
              onChange={(e) => setScreentimeIdx(Number(e.target.value))}
              className="w-full accent-violet-500 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-zinc-500 mt-2">
              {screentimeLabels.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>

            {/* AAP Warning */}
            <div className={`mt-5 flex items-start gap-2 rounded-xl p-3 text-xs ${
              overLimit
                ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
            }`}>
              {overLimit
                ? <AlertCircle size={14} className="shrink-0 mt-0.5" />
                : <CheckCircle size={14} className="shrink-0 mt-0.5" />}
              {overLimit
                ? `Exceeds AAP guideline of ${aaRecommended}hr/day for ages ${age}`
                : `Within AAP guideline of ${aaRecommended}hr/day for ages ${age}`}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Predicted Risk</h2>
            <span className={`text-sm font-semibold ${riskColor}`}>{riskLabel}</span>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <RiskBar
              label="ADHD"
              prob={adhd}
              icon={Brain}
              color="text-violet-400"
              bg="bg-violet-500/8 border-violet-500/15"
            />
            <RiskBar
              label="Anxiety"
              prob={anxiety}
              icon={Heart}
              color="text-rose-400"
              bg="bg-rose-500/8 border-rose-500/15"
            />
            <RiskBar
              label="Depression"
              prob={depression}
              icon={Activity}
              color="text-amber-400"
              bg="bg-amber-500/8 border-amber-500/15"
            />
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-white/2 border border-white/5 rounded-xl p-4 text-xs text-zinc-500 leading-relaxed">
          <strong className="text-zinc-400">Note:</strong> These are population-level predicted probabilities from
          survey-weighted logistic regression on NSCH 2022 data (n = 27,179). This tool is for
          educational purposes only and does not constitute a clinical diagnosis. Odds ratios reflect
          association, not causation.
        </div>
      </div>
    </main>
  )
}
