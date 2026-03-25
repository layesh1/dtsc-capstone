'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const charts = [
  {
    id: 'h1',
    pinColor: 'from-blue-400 to-blue-700 border-blue-800',
    pinHighlight: 'bg-blue-200',
    rotation: 'rotate-[-3deg]',
    title: 'H1 — ADHD & Screen Time',
    image: '/h1b_predicted_probability.png',
    teaser: 'ADHD rises with screen time across all ages',
    finding: 'Every additional hour of daily screen time increases ADHD odds by 13%. Ages 0–5 are the most sensitive cohort.',
    forParents: 'A child under 5 at 4+ hrs/day has 450% higher ADHD odds compared to under 1 hr — the steepest increase of any age group.',
  },
  {
    id: 'h2',
    pinColor: 'from-yellow-400 to-yellow-600 border-yellow-700',
    pinHighlight: 'bg-yellow-100',
    rotation: 'rotate-[2deg]',
    title: 'H2 — Anxiety & Depression',
    image: '/h2b_anxiety_predicted_probability.png',
    teaser: 'Ages 12–17 carry the highest absolute risk',
    finding: 'Screen time predicts anxiety (OR 1.54/hr) and depression (OR 1.54/hr) — with the strongest effect in adolescents.',
    forParents: 'Teens at 4+ hrs/day show the highest predicted probability of anxiety and depression of any age group in the dataset.',
  },
  {
    id: 'h3',
    pinColor: 'from-green-400 to-green-700 border-green-800',
    pinHighlight: 'bg-green-200',
    rotation: 'rotate-[-1.5deg]',
    title: 'H3 — Physical Activity',
    image: '/h3_bar_phys_by_screen.png',
    teaser: 'More screen time = fewer active days',
    finding: 'Screen time is significantly and inversely associated with physical activity days per week across all age groups.',
    forParents: 'Children at 4+ hrs/day of screen time average 0.7 fewer active days per week compared to those under 1 hr.',
  },
  {
    id: 'h4',
    pinColor: 'from-red-400 to-red-700 border-red-800',
    pinHighlight: 'bg-red-200',
    rotation: 'rotate-[3deg]',
    title: 'H4 — Income & Inequality',
    image: '/h4_heatmap_income.png',
    teaser: 'Income amplifies the screen-activity gap',
    finding: 'Lower-income households show a stronger screen-time-to-inactivity effect, compounding existing health disparities.',
    forParents: 'The heatmap shows the screen–physical activity relationship intensifies at lower income levels — the families with least access to alternatives are most affected.',
  },
]

/* Pushpin: 3D metallic look */
function Pushpin({ colorClass, highlightClass }: { colorClass: string; highlightClass: string }) {
  return (
    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
      {/* Pin shadow on paper */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-black/20 rounded-full blur-sm" />
      {/* Pin needle */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-gray-400" />
      {/* Pin head */}
      <div className={`relative w-6 h-6 rounded-full bg-gradient-to-br ${colorClass} border shadow-md`}>
        <div className={`w-1.5 h-1.5 rounded-full ${highlightClass} absolute top-1 left-1.5`} />
      </div>
    </div>
  )
}

/* Masking tape strip */
function Tape({ className = '', rotation = 'rotate-[-2deg]' }: { className?: string; rotation?: string }) {
  return (
    <div
      className={`absolute z-10 ${className}`}
      style={{ transform: `${rotation.replace('rotate-[', 'rotate(').replace(']', ')')}` }}
    >
      <div
        className="w-20 h-5 rounded-sm"
        style={{
          background: 'linear-gradient(135deg, #d4a854 0%, #c49a42 40%, #dab668 60%, #c49a42 100%)',
          opacity: 0.75,
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }}
      />
    </div>
  )
}

/* Lined notebook paper card (torn spiral edge on left) */
function NotebookCard({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`relative ${className}`} style={style}>
      {/* Spiral holes on left edge */}
      <div className="absolute left-0 top-0 bottom-0 w-6 flex flex-col justify-start gap-4 pt-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-3 h-3 rounded-full bg-[#c4a87a] border border-[#b09060] mx-auto" />
        ))}
      </div>
      {/* Paper body */}
      <div
        className="ml-6 p-6 relative"
        style={{
          background: 'linear-gradient(to bottom, #f5f0e8 0%, #faf6ef 100%)',
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #d4c5a9 27px, #d4c5a9 28px)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.25), 2px 2px 0 rgba(0,0,0,0.05)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

/* Grid paper card (graph paper, taped at corners) */
function GridCard({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`relative ${className}`} style={style}>
      <Tape className="-top-2 -left-4" rotation="rotate(-15deg)" />
      <Tape className="-top-2 -right-4" rotation="rotate(12deg)" />
      <div
        className="p-5 relative"
        style={{
          background: '#fdfdfd',
          backgroundImage: `
            linear-gradient(rgba(180,200,220,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(180,200,220,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '16px 16px',
          boxShadow: '0 6px 25px rgba(0,0,0,0.2)',
          border: '1px solid #e8e4dc',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default function Home() {
  const [openChart, setOpenChart] = useState<string | null>(null)
  const activeChart = charts.find(c => c.id === openChart)

  return (
    <main className="min-h-screen relative overflow-x-hidden">
      {/* Cork background — real texture tile + wooden frame border */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundColor: '#b5894a',
          backgroundImage: 'url(/cork-texture.png)',
          backgroundRepeat: 'repeat',
        }}
      />
      {/* Wooden frame border */}
      <div className="fixed inset-0 -z-[5] pointer-events-none"
        style={{
          boxShadow: `
            inset 0 0 0 12px #a0764a,
            inset 0 0 0 14px #8a6238,
            inset 0 0 0 20px #c49a5c,
            inset 0 0 0 22px #9e7a48,
            inset 14px 14px 30px rgba(0,0,0,0.3),
            inset -14px -14px 30px rgba(0,0,0,0.15)
          `,
        }}
      />

      {/* Modal overlay */}
      {activeChart && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
          onClick={() => setOpenChart(null)}
        >
          <div
            className="max-w-2xl w-full relative"
            onClick={e => e.stopPropagation()}
          >
            <NotebookCard style={{ transform: 'rotate(-0.5deg)' }}>
              <button
                className="absolute top-2 right-3 text-gray-400 hover:text-black text-2xl font-bold z-20"
                onClick={() => setOpenChart(null)}
              >
                ×
              </button>
              <div className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1" style={{ fontFamily: 'Courier, monospace' }}>
                Research Finding
              </div>
              <h2 className="text-lg font-bold mb-3 text-gray-900 border-b border-dashed border-amber-300 pb-2" style={{ fontFamily: 'Courier, monospace' }}>
                {activeChart.title}
              </h2>
              <div className="mb-3 border border-gray-200 bg-white">
                <Image
                  src={activeChart.image}
                  alt={activeChart.title}
                  width={640}
                  height={400}
                  className="w-full h-auto"
                />
              </div>
              <div className="space-y-2 text-sm" style={{ fontFamily: 'Courier, monospace' }}>
                <p><span className="font-bold text-gray-900">Finding:</span> <span className="text-gray-700">{activeChart.finding}</span></p>
                <p><span className="font-bold text-gray-900">What this means:</span> <span className="text-gray-700">{activeChart.forParents}</span></p>
              </div>
              <div className="text-xs text-amber-600 mt-3 font-bold" style={{ fontFamily: 'Courier, monospace' }}>
                — Ayesh et al., 2025 · UNC Charlotte · NSCH 2022
              </div>
            </NotebookCard>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-8 py-20 relative">

        {/* ─── Title card: torn graph paper taped to board ─── */}
        <div className="flex justify-center mb-20">
          <GridCard className="max-w-lg" style={{ transform: 'rotate(-1deg)' }}>
            <div className="text-center py-2">
              <div
                className="text-3xl md:text-4xl font-black tracking-wider text-gray-900 mb-2"
                style={{ fontFamily: 'Impact, sans-serif', letterSpacing: '0.06em' }}
              >
                THE ATTENTION RECEIPT
              </div>
              <div className="text-sm text-gray-500" style={{ fontFamily: 'Courier, monospace' }}>
                See the real cost of screen time
              </div>
              <div className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'Courier, monospace' }}>
                27,179 NSCH observations · Survey-weighted logistic regression
              </div>
            </div>
          </GridCard>
        </div>

        {/* ─── Calculator CTA: yellow sticky note ─── */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-20 items-start">
          <div className="md:col-span-3">
            <Link href="/calculator" className="block">
              <div
                className="relative p-8 cursor-pointer hover:scale-[1.02] transition-transform"
                style={{
                  transform: 'rotate(1.5deg)',
                  background: 'linear-gradient(135deg, #fff9c4 0%, #fff176 40%, #fff59d 100%)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.35), inset 0 -2px 6px rgba(0,0,0,0.06)',
                  fontFamily: 'Courier, monospace',
                }}
              >
                <Pushpin colorClass="from-red-500 to-red-800 border-red-900" highlightClass="bg-red-300" />
                {/* Sticky note fold corner */}
                <div className="absolute bottom-0 right-0 w-10 h-10"
                  style={{
                    background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.08) 50%)',
                  }}
                />
                <div className="text-2xl font-black mb-3 text-gray-900">TRY THE RISK CALCULATOR →</div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  Enter your child&apos;s age and list their daily apps. Get a printable receipt
                  showing developmental risk — ADHD, anxiety, depression, physical activity —
                  based on our actual regression coefficients.
                </p>
                <div className="flex gap-2 flex-wrap">
                  {['Ages 0–17', 'Per-app logging', 'Download PNG', 'Real NSCH data'].map(tag => (
                    <span key={tag} className="text-xs bg-yellow-600/20 border border-yellow-600/40 px-2 py-0.5 font-bold text-yellow-900">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          </div>

          {/* ─── Stats: notebook paper ─── */}
          <div className="md:col-span-2">
            <NotebookCard style={{ transform: 'rotate(-2.5deg)' }}>
              <Tape className="-top-3 left-1/2 -translate-x-1/2" rotation="rotate(-3deg)" />
              <div className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-3" style={{ fontFamily: 'Courier, monospace' }}>
                Research Data
              </div>
              {[
                { v: '27,179', l: 'Children studied' },
                { v: 'NSCH 2022', l: 'Data source' },
                { v: '4', l: 'Hypotheses tested' },
                { v: '13', l: 'Charts produced' },
                { v: 'p < 0.001', l: 'All findings significant' },
              ].map(({ v, l }) => (
                <div key={l} className="flex justify-between text-sm py-1.5" style={{ fontFamily: 'Courier, monospace' }}>
                  <span className="text-gray-500">{l}</span>
                  <span className="font-bold text-gray-900">{v}</span>
                </div>
              ))}
              <div className="text-xs text-amber-600 mt-3 font-bold text-center" style={{ fontFamily: 'Courier, monospace' }}>
                Ayesh et al. · UNC Charlotte
              </div>
            </NotebookCard>
          </div>
        </div>

        {/* ─── Chart cards: pinned photos ─── */}
        <div className="mb-12">
          <GridCard className="inline-block mb-10" style={{ transform: 'rotate(-0.5deg)' }}>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1" style={{ fontFamily: 'Courier, monospace' }}>
              Click any chart to read the finding
            </div>
          </GridCard>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {charts.map((chart) => (
              <button
                key={chart.id}
                onClick={() => setOpenChart(chart.id)}
                className="text-left group"
              >
                <div
                  className={`relative bg-white p-3 ${chart.rotation} hover:scale-105 hover:rotate-0 transition-all cursor-pointer`}
                  style={{ boxShadow: '0 6px 25px rgba(0,0,0,0.3)' }}
                >
                  <Pushpin colorClass={chart.pinColor} highlightClass={chart.pinHighlight} />
                  {/* Photo-style: white border like a polaroid */}
                  <div className="mt-2 mb-3 overflow-hidden bg-gray-100">
                    <Image
                      src={chart.image}
                      alt={chart.title}
                      width={320}
                      height={200}
                      className="w-full h-auto group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="px-1">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5" style={{ fontFamily: 'Courier, monospace' }}>
                      {chart.id.toUpperCase()}
                    </div>
                    <div className="text-xs font-bold text-gray-800 leading-snug" style={{ fontFamily: 'Courier, monospace' }}>
                      {chart.teaser}
                    </div>
                    <div className="mt-1.5 text-[10px] text-amber-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontFamily: 'Courier, monospace' }}>
                      Click to read →
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ─── Footer: small taped note ─── */}
        <div className="flex justify-center mt-16">
          <GridCard style={{ transform: 'rotate(0.5deg)' }}>
            <div className="text-xs text-gray-500 text-center px-4" style={{ fontFamily: 'Courier, monospace' }}>
              DTSC Capstone · Group 3 · UNC Charlotte · 2026
            </div>
          </GridCard>
        </div>

      </div>
    </main>
  )
}
