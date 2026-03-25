'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppEntry } from './types'
import { Receipt } from './components/Receipt'
import { AppInputForm } from './components/AppInputForm'
import { Input } from './components/ui/input'
import { Download, Share2, RotateCcw, Sparkles, ArrowLeft } from 'lucide-react'
import html2canvas from 'html2canvas'
import { getShareableURL, decodeReceiptData } from './utils/urlEncoder'
import { Toaster, toast } from 'sonner'

export default function CalculatorPage() {
  const [age, setAge] = useState<number>(13)
  const [apps, setApps] = useState<AppEntry[]>([])
  const [isDownloading, setIsDownloading] = useState(false)

  const handleAddApp = (app: AppEntry) => setApps(prev => [...prev, app])
  const handleRemoveApp = (id: string) => setApps(prev => prev.filter(a => a.id !== id))

  const loadDemoData = () => {
    setAge(14)
    setApps([
      { id: '1', name: 'TikTok',    category: 'social',  hours: 2, minutes: 0  },
      { id: '2', name: 'YouTube',   category: 'video',   hours: 1, minutes: 0  },
      { id: '3', name: 'Minecraft', category: 'game',    hours: 0, minutes: 30 },
      { id: '4', name: 'Canvas',    category: 'school',  hours: 0, minutes: 20 },
    ])
    toast.success('Demo data loaded')
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const el = document.getElementById('receipt-content')
      if (!el) throw new Error('Receipt not found')
      const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2, logging: false })
      const link = document.createElement('a')
      link.download = `attention-receipt-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('Receipt downloaded!')
    } catch {
      toast.error('Download failed')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleShare = async () => {
    const url = getShareableURL(age, apps)
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Shareable link copied!')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const handleReset = () => {
    setAge(13)
    setApps([])
    window.history.replaceState({}, '', window.location.pathname)
    toast.success('Receipt reset')
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const receiptParam = params.get('receipt')
    if (receiptParam) {
      const data = decodeReceiptData(receiptParam)
      if (data) { setAge(data.age); setApps(data.apps); toast.success('Receipt loaded from shared link') }
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); if (apps.length > 0) handleDownload() }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); loadDemoData() }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') { e.preventDefault(); handleReset() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [apps])

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: 'Courier, monospace',
        backgroundColor: '#f5f2ed',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`,
      }}
    >
      <Toaster />

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Nav */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-black text-xs uppercase tracking-widest mb-8 transition-colors">
          <ArrowLeft size={12} /> Back
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-black tracking-tight mb-2" style={{ fontFamily: 'Arial Black, sans-serif' }}>
            THE ATTENTION RECEIPT
          </h1>
          <div className="text-xs text-gray-400 uppercase tracking-[0.3em]">
            See the real cost of screen time
          </div>
          <div className="mt-3 mx-auto w-48 border-t border-black" />
        </div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14">

          {/* ─── Left: Input ─── */}
          <div className="space-y-6">

            {/* Age input */}
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-2">Child&apos;s Age</div>
              <Input
                type="number"
                min={0}
                max={18}
                value={age}
                onChange={e => setAge(parseInt(e.target.value) || 0)}
                className="text-2xl font-bold bg-white border-2 border-black h-14 px-4 rounded-none focus:ring-0 focus:border-black"
              />
              <div className="text-[10px] text-gray-400 mt-1.5">
                Risk varies by age group: 0–5, 6–11, 12–17
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-300" />

            {/* App input */}
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-3">Add Screen Time</div>
              <div className="bg-white border-2 border-black p-5">
                <AppInputForm apps={apps} onAddApp={handleAddApp} onRemoveApp={handleRemoveApp} />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-300" />

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownload}
                disabled={isDownloading || apps.length === 0}
                className="bg-black text-white text-xs font-bold uppercase tracking-widest py-3 px-4 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Download size={13} />
                {isDownloading ? 'Saving...' : 'Download'}
              </button>
              <button
                onClick={handleShare}
                disabled={apps.length === 0}
                className="bg-white text-black text-xs font-bold uppercase tracking-widest py-3 px-4 border-2 border-black hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Share2 size={13} />
                Share
              </button>
              <button
                onClick={handleReset}
                className="bg-white text-black text-xs font-bold uppercase tracking-widest py-3 px-4 border-2 border-black hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={13} />
                Reset
              </button>
              <button
                onClick={loadDemoData}
                className="bg-white text-black text-xs font-bold uppercase tracking-widest py-3 px-4 border-2 border-black hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles size={13} />
                Demo
              </button>
            </div>

            {/* Fine print */}
            <div className="text-[10px] text-gray-400 leading-relaxed">
              <div className="border-t border-dashed border-gray-300 pt-3">
                Risk scores: survey-weighted logistic regression, NSCH 2022 (n=27,179).
                ADHD OR 1.51/hr (ages 0–5) · Anxiety OR 1.30/hr (ages 12–17) · Depression OR 1.22/hr.
                <span className="block mt-1 font-bold">Ayesh et al., 2025, UNC Charlotte</span>
              </div>
            </div>
          </div>

          {/* ─── Right: Receipt ─── */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div
              className="bg-white shadow-xl relative"
              style={{
                boxShadow: '0 4px 20px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              <Receipt age={age} apps={apps} />
            </div>

            {/* Keyboard shortcuts */}
            <div className="text-[9px] text-gray-300 text-center mt-4 tracking-widest uppercase">
              ⌘K demo · ⌘D download · ⌘⇧R reset
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
