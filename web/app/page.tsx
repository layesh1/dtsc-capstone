import Link from 'next/link'
import { ArrowRight, Brain, Activity, TrendingUp, Users } from 'lucide-react'

const stats = [
  { value: '27,179', label: 'Children in dataset', sub: 'NSCH 2022' },
  { value: '13.2%', label: 'OR increase per screen-hour', sub: 'ADHD risk' },
  { value: '4+ hrs', label: 'Highest risk threshold', sub: 'all outcomes' },
  { value: '3 cohorts', label: 'Age groups analyzed', sub: '0–5, 6–11, 12–17' },
]

const findings = [
  {
    icon: Brain,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
    label: 'H1 — ADHD',
    result: 'OR = 1.13 per screen-hour',
    detail: 'Steepest relative increase in ages 0–5 (450% at 4+ hrs vs baseline)',
  },
  {
    icon: Activity,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
    label: 'H2 — Anxiety & Depression',
    result: 'OR = 1.54 (anxiety), 1.54 (depression)',
    detail: 'Ages 12–17 show highest absolute risk — most policy-relevant group',
  },
  {
    icon: TrendingUp,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    label: 'H3 — Physical Activity',
    result: 'Significant inverse relationship',
    detail: 'Higher screen time consistently predicts lower physical activity',
  },
  {
    icon: Users,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/20',
    label: 'H4 — Income Moderation',
    result: 'Income moderates screen–PA link',
    detail: 'Lower-income households show amplified screen-to-inactivity effect',
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-[#070b14] text-white">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <span className="text-sm font-mono text-zinc-500">DTSC Capstone · Group 3 · 2026</span>
        <Link
          href="/calculator"
          className="text-sm bg-violet-600 hover:bg-violet-500 transition-colors px-4 py-2 rounded-full font-medium"
        >
          Risk Calculator →
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-violet-300 text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Survey-Weighted Logistic Regression · NSCH 2022
        </div>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
          Screen Time &{' '}
          <span className="bg-gradient-to-r from-violet-400 to-rose-400 bg-clip-text text-transparent">
            Child Health
          </span>
          <br />
          Outcomes
        </h1>
        <p className="text-zinc-400 text-xl max-w-2xl leading-relaxed mb-10">
          A nationally representative analysis of how daily screen time predicts ADHD,
          anxiety, depression, and physical inactivity across three pediatric age cohorts.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/calculator"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 transition-colors px-6 py-3 rounded-full font-semibold text-base"
          >
            Try the Risk Calculator <ArrowRight size={16} />
          </Link>
          <Link
            href="/findings"
            className="inline-flex items-center gap-2 border border-white/10 hover:border-white/20 transition-colors px-6 py-3 rounded-full font-semibold text-base text-zinc-300"
          >
            View All Charts
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white/3 border border-white/8 rounded-2xl p-6">
              <div className="text-3xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-sm text-zinc-300 font-medium">{s.label}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Key Findings */}
      <section className="max-w-6xl mx-auto px-6 pb-28">
        <h2 className="text-2xl font-bold mb-8 text-zinc-100">Key Findings</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {findings.map((f) => (
            <div key={f.label} className={`rounded-2xl border p-6 ${f.bg}`}>
              <div className="flex items-center gap-3 mb-3">
                <f.icon size={20} className={f.color} />
                <span className="text-xs font-mono text-zinc-400">{f.label}</span>
              </div>
              <div className="text-lg font-semibold text-white mb-1">{f.result}</div>
              <div className="text-sm text-zinc-400">{f.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold mb-2">Our Solution</h3>
            <p className="text-zinc-400 text-sm max-w-md">
              A parent-facing risk calculator built directly from our regression coefficients —
              translating research into actionable guidance at the individual child level.
            </p>
          </div>
          <Link
            href="/calculator"
            className="shrink-0 inline-flex items-center gap-2 bg-white text-black hover:bg-zinc-100 transition-colors px-6 py-3 rounded-full font-semibold text-base"
          >
            Open Calculator <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  )
}
