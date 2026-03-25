import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'

const charts = [
  {
    section: 'H1 — ADHD',
    color: 'text-violet-400',
    charts: [
      { file: 'h1a_predicted_probability.png', caption: 'H1a — Predicted ADHD probability by screen time (all ages, held at mean)' },
      { file: 'h1b_predicted_probability.png', caption: 'H1b — Predicted ADHD probability by age group' },
      { file: 'h1b_relative_increase.png', caption: 'H1b — Relative % increase in ADHD probability vs <1 hr baseline' },
    ],
  },
  {
    section: 'H2 — Anxiety & Depression',
    color: 'text-rose-400',
    charts: [
      { file: 'h2a_anxiety_predicted_probability.png', caption: 'H2a — Predicted anxiety probability (all ages)' },
      { file: 'h2a_depression_predicted_probability.png', caption: 'H2a — Predicted depression probability (all ages)' },
      { file: 'h2b_anxiety_predicted_probability.png', caption: 'H2b — Anxiety probability by age group' },
      { file: 'h2b_anxiety_relative_increase.png', caption: 'H2b — Relative anxiety increase vs baseline' },
      { file: 'h2b_depression_predicted_probability.png', caption: 'H2b — Depression probability by age group' },
      { file: 'h2b_depression_relative_increase.png', caption: 'H2b — Relative depression increase vs baseline' },
    ],
  },
  {
    section: 'H3 — Physical Activity',
    color: 'text-amber-400',
    charts: [
      { file: 'h3_bar_phys_by_screen.png', caption: 'H3 — Physical activity days by screen time category' },
      { file: 'h3_scatter_regression.png', caption: 'H3 — Scatter with regression fit' },
    ],
  },
  {
    section: 'H4 — Income Moderation',
    color: 'text-sky-400',
    charts: [
      { file: 'h4_heatmap_income.png', caption: 'H4 — Heatmap: screen time × income → physical activity' },
      { file: 'h4_income_moderation_pa.png', caption: 'H4 — Income moderation of screen-PA relationship' },
    ],
  },
]

export default function Findings() {
  return (
    <main className="min-h-screen bg-[#070b14] text-white">
      <nav className="border-b border-white/5 px-6 py-4 flex items-center gap-4 max-w-6xl mx-auto">
        <Link href="/" className="text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <span className="text-sm text-zinc-400">All Findings</span>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Research Findings</h1>
        <p className="text-zinc-400 mb-12 text-sm max-w-xl">
          All visualizations generated from NSCH 2022 survey-weighted logistic regression analysis.
        </p>

        {charts.map((section) => (
          <div key={section.section} className="mb-16">
            <h2 className={`text-lg font-bold mb-6 ${section.color}`}>{section.section}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {section.charts.map((c) => (
                <div key={c.file} className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
                  <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
                    <Image
                      src={`/${c.file}`}
                      alt={c.caption}
                      fill
                      className="object-contain p-4"
                    />
                  </div>
                  <div className="px-4 pb-4 text-xs text-zinc-500">{c.caption}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
