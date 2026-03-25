'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const charts = [
  {
    id: 'h1',
    rotation: '-rotate-3',
    noteType: 'spiral' as const,
    title: 'H1 — ADHD & Screen Time',
    image: '/h1b_predicted_probability.png',
    teaser: 'ADHD rises with screen time across all ages',
    finding: 'Every additional hour of daily screen time increases ADHD odds by 13%. Ages 0–5 are the most sensitive cohort.',
    forParents: 'A child under 5 at 4+ hrs/day has 450% higher ADHD odds compared to under 1 hr — the steepest increase of any age group.',
  },
  {
    id: 'h2',
    rotation: 'rotate-2',
    noteType: 'paperclip' as const,
    title: 'H2 — Anxiety & Depression',
    image: '/h2b_anxiety_predicted_probability.png',
    teaser: 'Ages 12–17 carry the highest absolute risk',
    finding: 'Screen time predicts anxiety (OR 1.54/hr) and depression (OR 1.54/hr) — with the strongest effect in adolescents.',
    forParents: 'Teens at 4+ hrs/day show the highest predicted probability of anxiety and depression of any age group in the dataset.',
  },
  {
    id: 'h3',
    rotation: '-rotate-1',
    noteType: 'spiral' as const,
    title: 'H3 — Physical Activity',
    image: '/h3_bar_phys_by_screen.png',
    teaser: 'More screen time = fewer active days',
    finding: 'Screen time is significantly and inversely associated with physical activity days per week across all age groups.',
    forParents: 'Children at 4+ hrs/day of screen time average 0.7 fewer active days per week compared to those under 1 hr.',
  },
  {
    id: 'h4',
    rotation: 'rotate-3',
    noteType: 'paperclip' as const,
    title: 'H4 — Income & Inequality',
    image: '/h4_heatmap_income.png',
    teaser: 'Income amplifies the screen-activity gap',
    finding: 'Lower-income households show a stronger screen-time-to-inactivity effect, compounding existing health disparities.',
    forParents: 'The screen–physical activity relationship intensifies at lower income levels — the families with least access to alternatives are most affected.',
  },
]

function Pin({ className = '' }: { className?: string }) {
  return (
    <Image
      src="/pin-red.png"
      alt=""
      width={40}
      height={60}
      className={`absolute z-20 pointer-events-none drop-shadow-lg ${className}`}
      style={{ imageRendering: 'auto' }}
    />
  )
}

export default function Home() {
  const [openChart, setOpenChart] = useState<string | null>(null)
  const activeChart = charts.find(c => c.id === openChart)

  return (
    <main className="min-h-screen relative overflow-x-hidden">
      {/* Cork background */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: 'url(/cork-bg.png)',
          backgroundRepeat: 'repeat',
          backgroundSize: '400px',
        }}
      />

      {/* Modal */}
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
            {/* Notebook paper background */}
            <div className="relative">
              <Pin className="-top-6 left-1/2 -translate-x-1/2" />
              <div className="bg-[#f0ebe0] p-8 shadow-2xl" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                <button
                  className="absolute top-3 right-4 text-gray-400 hover:text-black text-2xl font-bold z-20"
                  onClick={() => setOpenChart(null)}
                >
                  ×
                </button>
                <div className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1" style={{ fontFamily: 'Courier, monospace' }}>
                  Research Finding
                </div>
                <h2 className="text-lg font-bold mb-4 text-gray-900 border-b border-dashed border-amber-300 pb-2" style={{ fontFamily: 'Courier, monospace' }}>
                  {activeChart.title}
                </h2>
                <div className="mb-4 border border-gray-300 bg-white">
                  <Image
                    src={activeChart.image}
                    alt={activeChart.title}
                    width={640}
                    height={400}
                    className="w-full h-auto"
                  />
                </div>
                <div className="space-y-3 text-sm" style={{ fontFamily: 'Courier, monospace' }}>
                  <p><span className="font-bold text-gray-900">Finding:</span> <span className="text-gray-700">{activeChart.finding}</span></p>
                  <p><span className="font-bold text-gray-900">What this means:</span> <span className="text-gray-700">{activeChart.forParents}</span></p>
                </div>
                <div className="text-xs text-amber-600 mt-4 font-bold" style={{ fontFamily: 'Courier, monospace' }}>
                  — Ayesh et al., 2025 · UNC Charlotte · NSCH 2022
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-8 py-20 relative">

        {/* ─── Title: kraft speech bubble pinned to board ─── */}
        <div className="flex justify-center mb-20">
          <div className="relative" style={{ transform: 'rotate(-1deg)' }}>
            <Pin className="-top-7 left-1/2 -translate-x-1/2" />
            <div className="relative">
              <Image
                src="/bubble-kraft.png"
                alt=""
                width={500}
                height={160}
                className="w-[500px] h-auto drop-shadow-xl"
              />
              {/* Text overlaid on the bubble */}
              <div className="absolute inset-0 flex flex-col items-center justify-center px-16 pb-6">
                <div
                  className="text-2xl md:text-3xl font-black tracking-wider text-gray-900 mb-1"
                  style={{ fontFamily: 'Impact, sans-serif', letterSpacing: '0.05em' }}
                >
                  THE ATTENTION RECEIPT
                </div>
                <div className="text-[10px] text-gray-600 text-center" style={{ fontFamily: 'Courier, monospace' }}>
                  27,179 NSCH observations · Real regression model
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Row 1: Calculator CTA + Stats ─── */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-14 mb-24 items-start">

          {/* Calculator: notebook paper with pin */}
          <div className="md:col-span-3">
            <Link href="/calculator" className="block group">
              <div className="relative" style={{ transform: 'rotate(1.5deg)' }}>
                <Pin className="-top-7 left-12" />
                <div className="relative overflow-hidden">
                  {/* Spiral notebook paper background */}
                  <Image
                    src="/note-spiral.png"
                    alt=""
                    width={600}
                    height={450}
                    className="w-full h-auto drop-shadow-xl group-hover:drop-shadow-2xl transition-all"
                  />
                  {/* Content overlaid */}
                  <div className="absolute inset-0 p-10 pt-8 flex flex-col justify-center" style={{ fontFamily: 'Courier, monospace' }}>
                    <div className="text-xl md:text-2xl font-black mb-3 text-gray-900 group-hover:text-amber-800 transition-colors">
                      TRY THE RISK CALCULATOR →
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed mb-4 max-w-sm">
                      Enter your child&apos;s age and daily apps.
                      Get a printable receipt showing ADHD, anxiety,
                      depression &amp; physical activity risk.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {['Ages 0–17', 'Per-app logging', 'Download PNG'].map(tag => (
                        <span key={tag} className="text-[10px] bg-amber-100/80 border border-amber-300 px-2 py-0.5 font-bold text-amber-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Stats: paperclip note */}
          <div className="md:col-span-2">
            <div className="relative" style={{ transform: 'rotate(-2.5deg)' }}>
              <Pin className="-top-7 right-8" />
              <div className="relative">
                <Image
                  src="/note-paperclip.png"
                  alt=""
                  width={350}
                  height={450}
                  className="w-full h-auto drop-shadow-xl"
                />
                {/* Content overlaid */}
                <div className="absolute inset-0 p-8 pt-6" style={{ fontFamily: 'Courier, monospace' }}>
                  <div className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-4">
                    Research Data
                  </div>
                  {[
                    { v: '27,179', l: 'Children studied' },
                    { v: 'NSCH 2022', l: 'Data source' },
                    { v: '4', l: 'Hypotheses tested' },
                    { v: '13', l: 'Charts produced' },
                    { v: 'p < 0.001', l: 'All significant' },
                  ].map(({ v, l }) => (
                    <div key={l} className="flex justify-between text-xs py-1.5 border-b border-dotted border-gray-300">
                      <span className="text-gray-500">{l}</span>
                      <span className="font-bold text-gray-900">{v}</span>
                    </div>
                  ))}
                  <div className="text-[10px] text-amber-600 mt-4 font-bold text-center">
                    Ayesh et al. · UNC Charlotte
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Section label: kraft bubble ─── */}
        <div className="mb-10 flex" style={{ transform: 'rotate(-0.5deg)' }}>
          <div className="relative inline-block">
            <Pin className="-top-7 left-8" />
            <Image
              src="/bubble-kraft.png"
              alt=""
              width={300}
              height={90}
              className="w-[280px] h-auto drop-shadow-lg"
            />
            <div className="absolute inset-0 flex items-center justify-center px-10 pb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-700" style={{ fontFamily: 'Courier, monospace' }}>
                Click a chart to read the finding
              </span>
            </div>
          </div>
        </div>

        {/* ─── Chart cards: alternating note styles ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
          {charts.map((chart) => (
            <button
              key={chart.id}
              onClick={() => setOpenChart(chart.id)}
              className="text-left group"
            >
              <div className={`relative ${chart.rotation} group-hover:rotate-0 transition-all`}>
                <Pin className="-top-7 left-1/2 -translate-x-1/2" />
                <div className="relative">
                  {/* Paper background image */}
                  <Image
                    src={chart.noteType === 'spiral' ? '/note-spiral.png' : '/note-paperclip.png'}
                    alt=""
                    width={300}
                    height={380}
                    className="w-full h-auto drop-shadow-lg group-hover:drop-shadow-2xl transition-all"
                  />
                  {/* Content overlaid */}
                  <div className="absolute inset-0 p-5 pt-4 flex flex-col">
                    <div className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1" style={{ fontFamily: 'Courier, monospace' }}>
                      {chart.id.toUpperCase()}
                    </div>
                    <div className="flex-1 flex items-center">
                      <div className="w-full overflow-hidden border border-gray-200 bg-white/80">
                        <Image
                          src={chart.image}
                          alt={chart.title}
                          width={280}
                          height={175}
                          className="w-full h-auto group-hover:scale-105 transition-transform"
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-bold text-gray-800 leading-snug" style={{ fontFamily: 'Courier, monospace' }}>
                        {chart.teaser}
                      </div>
                      <div className="mt-1 text-[10px] text-amber-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontFamily: 'Courier, monospace' }}>
                        Click to read →
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* ─── Footer ─── */}
        <div className="flex justify-center">
          <div className="relative" style={{ transform: 'rotate(0.5deg)' }}>
            <Image
              src="/bubble-kraft.png"
              alt=""
              width={320}
              height={90}
              className="w-[300px] h-auto drop-shadow-md"
            />
            <div className="absolute inset-0 flex items-center justify-center px-10 pb-3">
              <span className="text-[10px] text-gray-600" style={{ fontFamily: 'Courier, monospace' }}>
                DTSC Capstone · Group 3 · UNC Charlotte · 2026
              </span>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
