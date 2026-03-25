'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const charts = [
  {
    id: 'h1',
    pinColor: 'from-blue-400 to-blue-700 border-blue-800',
    pinHighlight: 'bg-blue-200',
    rotation: '-rotate-2',
    cardBg: 'bg-white',
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
    rotation: 'rotate-1',
    cardBg: 'bg-white',
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
    rotation: '-rotate-1',
    cardBg: 'bg-white',
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
    rotation: 'rotate-2',
    cardBg: 'bg-white',
    title: 'H4 — Income & Inequality',
    image: '/h4_heatmap_income.png',
    teaser: 'Income amplifies the screen-activity gap',
    finding: 'Lower-income households show a stronger screen-time-to-inactivity effect, compounding existing health disparities.',
    forParents: 'The heatmap shows the screen–physical activity relationship intensifies at lower income levels — the families with least access to alternatives are most affected.',
  },
]

function Pushpin({ colorClass, highlightClass }: { colorClass: string; highlightClass: string }) {
  return (
    <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-gradient-to-br ${colorClass} shadow-lg border z-10`}>
      <div className={`w-2 h-2 rounded-full ${highlightClass} absolute top-1 left-2`} />
    </div>
  )
}

export default function Home() {
  const [openChart, setOpenChart] = useState<string | null>(null)
  const activeChart = charts.find(c => c.id === openChart)

  return (
    <main
      className="min-h-screen relative overflow-x-hidden"
      style={{
        backgroundColor: '#b5894a',
        backgroundImage: `
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)' opacity='0.18'/%3E%3C/svg%3E"),
          radial-gradient(ellipse at 25% 35%, #c9a06a 0%, transparent 55%),
          radial-gradient(ellipse at 75% 65%, #9e7438 0%, transparent 50%),
          radial-gradient(ellipse at 50% 90%, #b08040 0%, transparent 40%)
        `,
      }}
    >
      {/* Modal */}
      {activeChart && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpenChart(null)}
        >
          <div
            className="bg-white max-w-2xl w-full rounded-sm shadow-2xl p-6 relative"
            style={{ fontFamily: 'Courier, monospace' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-4 text-gray-400 hover:text-black text-xl font-bold"
              onClick={() => setOpenChart(null)}
            >
              ×
            </button>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Research Finding</div>
            <h2 className="text-xl font-bold mb-4 border-b-2 border-dashed border-black pb-2">{activeChart.title}</h2>
            <div className="mb-4 border-2 border-gray-200 bg-gray-50">
              <Image
                src={activeChart.image}
                alt={activeChart.title}
                width={640}
                height={400}
                className="w-full h-auto"
              />
            </div>
            <div className="space-y-3 text-sm">
              <div className="bg-yellow-50 border border-yellow-200 p-3">
                <span className="font-bold">Finding: </span>{activeChart.finding}
              </div>
              <div className="bg-green-50 border border-green-200 p-3">
                <span className="font-bold">What this means: </span>{activeChart.forParents}
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-4 text-center">Ayesh et al., 2025 · UNC Charlotte · NSCH 2022</div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-16">

        {/* Title card — top center */}
        <div className="flex justify-center mb-16 relative">
          <div
            className="relative bg-amber-50 border-2 border-amber-200 px-10 py-7 shadow-2xl text-center max-w-xl"
            style={{ transform: 'rotate(-1deg)', boxShadow: '0 12px 40px rgba(0,0,0,0.35)' }}
          >
            <Pushpin colorClass="from-red-400 to-red-700 border-red-800" highlightClass="bg-red-200" />
            <div className="text-3xl md:text-4xl font-black tracking-wider text-gray-900 mb-2" style={{ fontFamily: 'Impact, sans-serif' }}>
              THE ATTENTION RECEIPT
            </div>
            <div className="text-sm text-gray-600" style={{ fontFamily: 'Courier, monospace' }}>
              See the real cost of screen time · 27,179 NSCH observations · Real regression model
            </div>
          </div>
        </div>

        {/* Row 1: Calculator pin + Stats card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-14 items-start">

          {/* Calculator — big yellow sticky note */}
          <div className="md:col-span-2">
            <Link href="/calculator">
              <div
                className="relative bg-yellow-200 p-8 shadow-2xl cursor-pointer hover:scale-[1.02] transition-transform"
                style={{ transform: 'rotate(1.5deg)', boxShadow: '0 15px 45px rgba(0,0,0,0.4)', fontFamily: 'Courier, monospace' }}
              >
                <Pushpin colorClass="from-red-400 to-red-700 border-red-800" highlightClass="bg-red-200" />
                <div className="absolute -top-1 left-0 right-0 h-8 bg-yellow-300 opacity-50" />
                <div className="text-2xl font-black mb-3 text-gray-900">TRY THE RISK CALCULATOR →</div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  Enter your child&apos;s age and list their daily apps. Get a printable receipt showing the developmental risk — ADHD, anxiety, depression, and physical activity — based on our actual regression coefficients.
                </p>
                <div className="flex gap-3 flex-wrap">
                  {['Ages 0–17', 'Per-app logging', 'Download PNG', 'Real NSCH data'].map(tag => (
                    <span key={tag} className="text-xs bg-yellow-400 border border-yellow-600 px-2 py-0.5 font-bold">{tag}</span>
                  ))}
                </div>
              </div>
            </Link>
          </div>

          {/* Stats — blue lined index card */}
          <div>
            <div
              className="relative p-6 shadow-xl"
              style={{
                transform: 'rotate(-2deg)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                background: 'linear-gradient(to bottom, #dbeafe 0%, #bfdbfe 3px, white 3px)',
                fontFamily: 'Courier, monospace',
                borderLeft: '4px solid #3b82f6',
              }}
            >
              <Pushpin colorClass="from-green-400 to-green-700 border-green-800" highlightClass="bg-green-200" />
              <div className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Research Data</div>
              {[
                { v: '27,179', l: 'Children in dataset' },
                { v: 'NSCH 2022', l: 'Data source' },
                { v: '4', l: 'Hypotheses tested' },
                { v: '13', l: 'Charts generated' },
              ].map(({ v, l }) => (
                <div key={l} className="flex justify-between text-sm border-b border-dotted border-gray-300 py-1.5">
                  <span className="text-gray-500">{l}</span>
                  <span className="font-bold text-gray-900">{v}</span>
                </div>
              ))}
              <div className="text-xs text-gray-400 mt-3 text-center">Ayesh et al. · UNC Charlotte</div>
            </div>
          </div>
        </div>

        {/* Row 2: Chart pins */}
        <div className="mb-8">
          <div
            className="inline-block bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-500 shadow mb-8"
            style={{ transform: 'rotate(-0.5deg)', fontFamily: 'Courier, monospace' }}
          >
            📌 Click any chart to read the finding
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {charts.map((chart) => (
              <button
                key={chart.id}
                onClick={() => setOpenChart(chart.id)}
                className="text-left group"
              >
                <div
                  className={`relative ${chart.cardBg} p-4 shadow-xl ${chart.rotation} hover:scale-105 hover:shadow-2xl transition-all cursor-pointer`}
                  style={{ boxShadow: '0 8px 25px rgba(0,0,0,0.3)' }}
                >
                  <Pushpin colorClass={chart.pinColor} highlightClass={chart.pinHighlight} />
                  <div className="mt-2 mb-3 overflow-hidden border border-gray-200 bg-gray-50">
                    <Image
                      src={chart.image}
                      alt={chart.title}
                      width={320}
                      height={200}
                      className="w-full h-auto grayscale group-hover:grayscale-0 transition-all"
                    />
                  </div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1" style={{ fontFamily: 'Courier, monospace' }}>
                    {chart.id.toUpperCase()}
                  </div>
                  <div className="text-sm font-bold text-gray-900 leading-snug" style={{ fontFamily: 'Courier, monospace' }}>
                    {chart.teaser}
                  </div>
                  <div className="mt-2 text-xs text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontFamily: 'Courier, monospace' }}>
                    Click to read →
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="flex justify-center mt-12">
          <div
            className="bg-gray-100 px-6 py-3 text-xs text-gray-500 shadow"
            style={{ transform: 'rotate(-0.5deg)', fontFamily: 'Courier, monospace' }}
          >
            DTSC Capstone · Group 3 · UNC Charlotte · 2026
          </div>
        </div>

      </div>
    </main>
  )
}
