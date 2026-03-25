'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppEntry } from './types'
import { Receipt } from './components/Receipt'
import { AppInputForm } from './components/AppInputForm'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Label } from './components/ui/label'
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

  // Load from shared URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const receiptParam = params.get('receipt')
    if (receiptParam) {
      const data = decodeReceiptData(receiptParam)
      if (data) { setAge(data.age); setApps(data.apps); toast.success('Receipt loaded from shared link') }
    }
  }, [])

  // Keyboard shortcuts
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
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #8B7355 0%, #6B5644 50%, #8B7355 100%)',
    }}>
      {/* Cork texture */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(139,115,85,0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(107,86,68,0.3) 0%, transparent 50%)`,
      }} />

      <Toaster />

      <div className="relative max-w-7xl mx-auto py-8 px-4">

        {/* Back nav */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-amber-200 hover:text-white text-sm font-mono transition-colors">
            <ArrowLeft size={14} /> Back to Research
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12 relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-red-500 shadow-lg border-2 border-red-700"
               style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(0,0,0,0.3)' }}>
            <div className="w-2 h-2 rounded-full bg-red-300 absolute top-1.5 left-1.5" />
          </div>
          <div className="bg-yellow-50 inline-block px-8 py-6 shadow-2xl border-2 border-yellow-200"
               style={{ transform: 'rotate(-1deg)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2"
                style={{ fontFamily: 'Impact, sans-serif', letterSpacing: '0.05em' }}>
              THE ATTENTION RECEIPT
            </h1>
            <p className="text-base md:text-lg text-gray-700 px-4" style={{ fontFamily: 'Courier, monospace' }}>
              See the real cost of screen time • 27,179 NSCH observations • Real regression model
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">

          {/* Left: Input clipboard */}
          <div className="space-y-6">
            <div className="bg-amber-50 p-8 relative shadow-2xl border-4 border-amber-900"
                 style={{ transform: 'rotate(0.5deg)', boxShadow: '0 15px 40px rgba(0,0,0,0.4)' }}>
              {/* Clipboard clip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-24 h-12 bg-gray-700 rounded-t-lg shadow-xl"
                   style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                <div className="w-16 h-6 bg-gray-800 rounded-sm absolute top-3 left-4" />
              </div>

              <h2 className="text-2xl font-bold mb-6 text-center border-b-2 border-dashed border-amber-900 pb-2"
                  style={{ fontFamily: 'Courier, monospace' }}>
                CREATE RECEIPT
              </h2>

              <div className="mb-6 bg-white p-4 border-2 border-amber-800 shadow-inner">
                <Label htmlFor="childAge" className="text-lg" style={{ fontFamily: 'Courier, monospace' }}>
                  Child's Age (years)
                </Label>
                <Input
                  id="childAge"
                  type="number"
                  min="0"
                  max="18"
                  value={age}
                  onChange={e => setAge(parseInt(e.target.value) || 0)}
                  className="mt-2 text-lg border-2 border-gray-400"
                  style={{ fontFamily: 'Courier, monospace' }}
                />
                <p className="text-sm text-gray-600 mt-2" style={{ fontFamily: 'Courier, monospace' }}>
                  Risk varies by age group (0–5, 6–11, 12–17) per our regression model
                </p>
              </div>

              <div className="bg-white p-4 border-2 border-amber-800 shadow-inner">
                <AppInputForm apps={apps} onAddApp={handleAddApp} onRemoveApp={handleRemoveApp} />
              </div>
            </div>

            {/* Actions sticky note */}
            <div className="bg-yellow-200 p-6 relative shadow-xl"
                 style={{ transform: 'rotate(-1.5deg)', boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }}>
              <div className="absolute -top-1 left-0 right-0 h-8 bg-yellow-300 opacity-50" />
              <h3 className="text-xl font-bold mb-4 text-center" style={{ fontFamily: 'Courier, monospace' }}>
                QUICK ACTIONS
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <Button onClick={handleDownload} disabled={isDownloading || apps.length === 0}
                  className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3"
                  style={{ fontFamily: 'Courier, monospace' }}>
                  <Download className="w-4 h-4 mr-2" />
                  {isDownloading ? 'PRINTING...' : 'DOWNLOAD PNG'}
                </Button>
                <Button onClick={handleShare} disabled={apps.length === 0} variant="outline"
                  className="w-full border-2 border-black font-bold py-3"
                  style={{ fontFamily: 'Courier, monospace' }}>
                  <Share2 className="w-4 h-4 mr-2" /> COPY LINK
                </Button>
                <Button onClick={handleReset} variant="outline"
                  className="w-full border-2 border-black font-bold py-3"
                  style={{ fontFamily: 'Courier, monospace' }}>
                  <RotateCcw className="w-4 h-4 mr-2" /> RESET
                </Button>
                <Button onClick={loadDemoData} variant="outline"
                  className="w-full border-2 border-black font-bold py-3 bg-yellow-100"
                  style={{ fontFamily: 'Courier, monospace' }}>
                  <Sparkles className="w-4 h-4 mr-2" /> TRY DEMO
                </Button>
              </div>
            </div>

            {/* Research note card */}
            <div className="bg-white p-6 border-2 border-blue-300 shadow-xl"
                 style={{ transform: 'rotate(0.5deg)', background: 'linear-gradient(to bottom, #e0f2fe 0%, #bae6fd 2px, white 2px)' }}>
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-lg font-bold mb-3 text-blue-900" style={{ fontFamily: 'Courier, monospace' }}>
                  RESEARCH DATA
                </h3>
                <p className="text-sm text-blue-900 leading-relaxed mb-2" style={{ fontFamily: 'Courier, monospace' }}>
                  Risk scores use survey-weighted logistic regression on NSCH 2022 (n=27,179).
                  ADHD model: OR 1.51/hr (ages 0–5). Anxiety: OR 1.30/hr (ages 12–17).
                  Depression: OR 1.22/hr (no significant age interaction).
                </p>
                <p className="text-xs text-blue-700 font-bold" style={{ fontFamily: 'Courier, monospace' }}>
                  — Ayesh et al., 2025, UNC Charlotte
                </p>
              </div>
            </div>
          </div>

          {/* Right: Receipt preview */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-12 bg-yellow-100 opacity-60 shadow-md"
                   style={{ transform: 'rotate(-2deg)' }} />
              <div className="bg-white p-8 relative shadow-2xl"
                   style={{ transform: 'rotate(-0.5deg)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                <h2 className="text-2xl font-bold mb-6 text-center border-b-4 border-dashed border-black pb-2"
                    style={{ fontFamily: 'Courier, monospace', letterSpacing: '0.1em' }}>
                  🧾 YOUR RECEIPT
                </h2>
                <Receipt age={age} apps={apps} />
              </div>
              <div className="absolute -bottom-2 right-4 w-16 h-16 bg-gray-300 opacity-20 rounded-full blur-xl" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center">
          <div className="inline-block bg-gray-100 px-8 py-4 shadow-lg border-t-4 border-gray-300"
               style={{
                 transform: 'rotate(-0.5deg)',
                 clipPath: 'polygon(0 0, 100% 0, 100% 85%, 95% 90%, 90% 85%, 85% 90%, 80% 85%, 75% 90%, 70% 85%, 65% 90%, 60% 85%, 55% 90%, 50% 85%, 45% 90%, 40% 85%, 35% 90%, 30% 85%, 25% 90%, 20% 85%, 15% 90%, 10% 85%, 5% 90%, 0 85%)'
               }}>
            <p className="text-sm text-gray-700 font-mono">The Attention Receipt · DTSC Capstone · UNC Charlotte</p>
            <p className="mt-1 text-xs text-gray-500 font-mono">⌨ Shortcuts: ⌘K demo · ⌘D download · ⌘⇧R reset</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
