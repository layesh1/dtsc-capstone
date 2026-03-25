'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const charts = [
  {
    id: 'h1',
    title: 'H1 — ADHD & Screen Time',
    image: '/h1b_predicted_probability.png',
    teaser: 'ADHD rises with screen time across all ages',
    finding: 'Every additional hour of daily screen time increases ADHD odds by 13%. Ages 0–5 are the most sensitive cohort.',
    forParents: 'A child under 5 at 4+ hrs/day has 450% higher ADHD odds compared to under 1 hr — the steepest increase of any age group.',
  },
  {
    id: 'h2',
    title: 'H2 — Anxiety & Depression',
    image: '/h2b_anxiety_predicted_probability.png',
    teaser: 'Ages 12–17 carry the highest absolute risk',
    finding: 'Screen time predicts anxiety (OR 1.54/hr) and depression (OR 1.54/hr) — with the strongest effect in adolescents.',
    forParents: 'Teens at 4+ hrs/day show the highest predicted probability of anxiety and depression of any age group in the dataset.',
  },
  {
    id: 'h3',
    title: 'H3 — Physical Activity',
    image: '/h3_bar_phys_by_screen.png',
    teaser: 'More screen time = fewer active days',
    finding: 'Screen time is significantly and inversely associated with physical activity days per week across all age groups.',
    forParents: 'Children at 4+ hrs/day of screen time average 0.7 fewer active days per week compared to those under 1 hr.',
  },
  {
    id: 'h4',
    title: 'H4 — Income & Inequality',
    image: '/h4_heatmap_income.png',
    teaser: 'Income amplifies the screen-activity gap',
    finding: 'Lower-income households show a stronger screen-time-to-inactivity effect, compounding existing health disparities.',
    forParents: 'The screen–physical activity relationship intensifies at lower income levels — the families with least access to alternatives are most affected.',
  },
]

/* Red pushpin using the actual PNG */
function Pin({ className = '', size = 32 }: { className?: string; size?: number }) {
  return (
    <Image
      src="/pin-red.png"
      alt=""
      width={size}
      height={size * 1.5}
      className={`absolute z-20 pointer-events-none ${className}`}
    />
  )
}

export default function Home() {
  const [openChart, setOpenChart] = useState<string | null>(null)
  const activeChart = charts.find(c => c.id === openChart)

  return (
    <main className="min-h-screen relative overflow-x-hidden">
      {/* Cork background — real texture */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: 'url(/cork-bg.png)',
          backgroundRepeat: 'repeat',
          backgroundSize: '500px',
        }}
      />
      {/* Subtle vignette */}
      <div className="fixed inset-0 -z-[5] pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.25) 100%)',
      }} />

      {/* ═══ Modal ═══ */}
      {activeChart && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
          onClick={() => setOpenChart(null)}
        >
          <div className="max-w-2xl w-full relative" onClick={e => e.stopPropagation()}>
            <Pin className="-top-5 left-1/2 -translate-x-1/2" size={36} />
            <div
              className="bg-[#faf6ef] p-7 shadow-2xl relative"
              style={{
                transform: 'rotate(-0.5deg)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.05)',
              }}
            >
              <button
                className="absolute top-3 right-4 text-gray-400 hover:text-black text-2xl font-bold z-20"
                onClick={() => setOpenChart(null)}
              >
                ×
              </button>
              <div className="text-[10px] font-bold text-red-400 uppercase tracking-[0.2em] mb-1" style={{ fontFamily: 'Courier, monospace' }}>
                Research Finding
              </div>
              <h2 className="text-lg font-bold mb-4 text-gray-900" style={{ fontFamily: 'Courier, monospace' }}>
                {activeChart.title}
              </h2>
              <div className="mb-4 bg-white border border-gray-200 shadow-inner">
                <Image src={activeChart.image} alt={activeChart.title} width={640} height={400} className="w-full h-auto" />
              </div>
              <div className="space-y-2 text-sm text-gray-700 leading-relaxed" style={{ fontFamily: 'Courier, monospace' }}>
                <p><span className="font-bold text-gray-900">Finding:</span> {activeChart.finding}</p>
                <p><span className="font-bold text-gray-900">What this means:</span> {activeChart.forParents}</p>
              </div>
              <div className="text-[10px] text-gray-400 mt-4 font-bold" style={{ fontFamily: 'Courier, monospace' }}>
                Ayesh et al., 2025 · UNC Charlotte · NSCH 2022
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Board contents ═══ */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-12 relative">

        {/* ─── Title sticky note (yellow, top-center, slightly tilted) ─── */}
        <div className="flex justify-center mb-6">
          <div className="relative" style={{ transform: 'rotate(-1.5deg)' }}>
            <Pin className="-top-4 left-1/2 -translate-x-1/2" size={28} />
            <div
              className="px-8 py-5 text-center"
              style={{
                background: 'linear-gradient(180deg, #fff9c4 0%, #fff176 100%)',
                boxShadow: '2px 3px 12px rgba(0,0,0,0.25), inset 0 -1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div className="text-2xl md:text-3xl font-black tracking-wide text-gray-900" style={{ fontFamily: 'Impact, sans-serif' }}>
                THE ATTENTION RECEIPT
              </div>
              <div className="text-[10px] text-gray-500 mt-1 tracking-wide" style={{ fontFamily: 'Courier, monospace' }}>
                See the real cost of screen time
              </div>
            </div>
          </div>
        </div>

        {/* ─── Subtitle: small torn paper strip ─── */}
        <div className="flex justify-center mb-14">
          <div
            className="bg-white px-4 py-1.5 text-[10px] text-gray-400 tracking-widest uppercase"
            style={{
              fontFamily: 'Courier, monospace',
              transform: 'rotate(0.8deg)',
              boxShadow: '1px 2px 6px rgba(0,0,0,0.15)',
            }}
          >
            27,179 children · NSCH 2022 · Survey-weighted logistic regression
          </div>
        </div>

        {/* ─── Main content: scattered organically ─── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-4 items-start">

          {/* ─── Calculator CTA: big pink sticky note ─── */}
          <div className="md:col-span-5 md:mt-4">
            <Link href="/calculator" className="block group">
              <div className="relative" style={{ transform: 'rotate(2deg)' }}>
                <Pin className="-top-4 left-10" size={30} />
                <div
                  className="p-7 group-hover:scale-[1.02] transition-transform cursor-pointer"
                  style={{
                    background: 'linear-gradient(145deg, #f8d7da 0%, #f1aeb5 100%)',
                    boxShadow: '3px 4px 14px rgba(0,0,0,0.25), inset 0 -2px 4px rgba(0,0,0,0.04)',
                    fontFamily: 'Courier, monospace',
                  }}
                >
                  <div className="text-xs font-bold text-red-800/60 uppercase tracking-widest mb-2">our solution</div>
                  <div className="text-xl font-black mb-3 text-gray-900">
                    Try the Risk Calculator →
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed mb-4">
                    Enter your child&apos;s age + daily apps.
                    Get a printable receipt showing developmental risk based on our actual regression model.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {['Ages 0–17', 'Per-app logging', 'Download PNG'].map(tag => (
                      <span key={tag} className="text-[9px] bg-white/50 border border-red-300 px-1.5 py-0.5 font-bold text-red-900">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* ─── Stats: cream note with paperclip look ─── */}
          <div className="md:col-span-3 md:mt-16">
            <div className="relative" style={{ transform: 'rotate(-3deg)' }}>
              <Pin className="-top-4 right-6" size={26} />
              <div
                className="p-5"
                style={{
                  background: 'linear-gradient(180deg, #f5f0e6 0%, #ebe4d4 100%)',
                  boxShadow: '2px 3px 10px rgba(0,0,0,0.2), inset 0 -1px 2px rgba(0,0,0,0.03)',
                  fontFamily: 'Courier, monospace',
                }}
              >
                <div className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-3">Research data</div>
                {[
                  { v: '27,179', l: 'Children' },
                  { v: 'NSCH 2022', l: 'Source' },
                  { v: '4', l: 'Hypotheses' },
                  { v: '13', l: 'Charts' },
                  { v: 'p < 0.001', l: 'Significance' },
                ].map(({ v, l }) => (
                  <div key={l} className="flex justify-between text-[11px] py-1 border-b border-dotted border-gray-300/60">
                    <span className="text-gray-500">{l}</span>
                    <span className="font-bold text-gray-800">{v}</span>
                  </div>
                ))}
                <div className="text-[9px] text-gray-400 mt-3 text-center font-bold">Ayesh et al. · UNC Charlotte</div>
              </div>
            </div>
          </div>

          {/* ─── "Key Findings" label: small blue sticky ─── */}
          <div className="md:col-span-4 md:mt-2">
            <div className="relative mb-3" style={{ transform: 'rotate(1deg)' }}>
              <Pin className="-top-4 left-6" size={26} />
              <div
                className="p-4"
                style={{
                  background: 'linear-gradient(180deg, #dbeafe 0%, #bfdbfe 100%)',
                  boxShadow: '2px 3px 10px rgba(0,0,0,0.2)',
                  fontFamily: 'Courier, monospace',
                }}
              >
                <div className="text-xs font-bold text-blue-900">Key Findings</div>
                <div className="text-[10px] text-blue-700 mt-1">Click any chart below to read the full finding and what it means for parents.</div>
              </div>
            </div>

            {/* First two charts stacked here */}
            <div className="space-y-5">
              {charts.slice(0, 2).map((chart, i) => (
                <button key={chart.id} onClick={() => setOpenChart(chart.id)} className="text-left group w-full">
                  <div className="relative" style={{ transform: `rotate(${i === 0 ? -2 : 1.5}deg)` }}>
                    <Pin className="-top-4 left-1/2 -translate-x-1/2" size={24} />
                    <div
                      className="bg-white p-3 group-hover:scale-[1.03] transition-all cursor-pointer"
                      style={{ boxShadow: '2px 3px 12px rgba(0,0,0,0.2)' }}
                    >
                      <div className="overflow-hidden mb-2 bg-gray-50">
                        <Image src={chart.image} alt={chart.title} width={320} height={200} className="w-full h-auto group-hover:scale-105 transition-transform" />
                      </div>
                      <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest" style={{ fontFamily: 'Courier, monospace' }}>
                        {chart.id.toUpperCase()}
                      </div>
                      <div className="text-xs font-bold text-gray-800 leading-snug" style={{ fontFamily: 'Courier, monospace' }}>
                        {chart.teaser}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Bottom row: remaining 2 charts + decoration ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-6 mt-8 items-start">

          {/* Chart H3 */}
          <div className="md:col-span-4 md:col-start-2">
            <button onClick={() => setOpenChart('h3')} className="text-left group w-full">
              <div className="relative" style={{ transform: 'rotate(-1.5deg)' }}>
                <Pin className="-top-4 left-8" size={26} />
                <div
                  className="bg-white p-3 group-hover:scale-[1.03] transition-all cursor-pointer"
                  style={{ boxShadow: '2px 3px 12px rgba(0,0,0,0.2)' }}
                >
                  <div className="overflow-hidden mb-2 bg-gray-50">
                    <Image src={charts[2].image} alt={charts[2].title} width={320} height={200} className="w-full h-auto group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest" style={{ fontFamily: 'Courier, monospace' }}>H3</div>
                  <div className="text-xs font-bold text-gray-800 leading-snug" style={{ fontFamily: 'Courier, monospace' }}>{charts[2].teaser}</div>
                </div>
              </div>
            </button>
          </div>

          {/* Chart H4 */}
          <div className="md:col-span-4">
            <button onClick={() => setOpenChart('h4')} className="text-left group w-full">
              <div className="relative" style={{ transform: 'rotate(2.5deg)' }}>
                <Pin className="-top-4 right-6" size={26} />
                <div
                  className="bg-white p-3 group-hover:scale-[1.03] transition-all cursor-pointer"
                  style={{ boxShadow: '2px 3px 12px rgba(0,0,0,0.2)' }}
                >
                  <div className="overflow-hidden mb-2 bg-gray-50">
                    <Image src={charts[3].image} alt={charts[3].title} width={320} height={200} className="w-full h-auto group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest" style={{ fontFamily: 'Courier, monospace' }}>H4</div>
                  <div className="text-xs font-bold text-gray-800 leading-snug" style={{ fontFamily: 'Courier, monospace' }}>{charts[3].teaser}</div>
                </div>
              </div>
            </button>
          </div>

          {/* Small green sticky: footer note */}
          <div className="md:col-span-3 md:mt-8">
            <div className="relative" style={{ transform: 'rotate(-2deg)' }}>
              <Pin className="-top-4 left-1/2 -translate-x-1/2" size={22} />
              <div
                className="p-3 text-center"
                style={{
                  background: 'linear-gradient(180deg, #d1fae5 0%, #a7f3d0 100%)',
                  boxShadow: '2px 3px 8px rgba(0,0,0,0.18)',
                  fontFamily: 'Courier, monospace',
                }}
              >
                <div className="text-[9px] text-green-800 font-bold">DTSC Capstone · Group 3</div>
                <div className="text-[9px] text-green-700">UNC Charlotte · 2026</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
