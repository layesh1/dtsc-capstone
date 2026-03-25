import { useState, useEffect } from 'react';
import { AppEntry } from './types';
import { Receipt } from './components/Receipt';
import { AppInputForm } from './components/AppInputForm';
import { HelpSection } from './components/HelpSection';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Download, Share2, RotateCcw, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';
import { getShareableURL, decodeReceiptData } from './utils/urlEncoder';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';

function App() {
  const [age, setAge] = useState<number>(13);
  const [apps, setApps] = useState<AppEntry[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleAddApp = (app: AppEntry) => {
    setApps([...apps, app]);
  };

  const handleRemoveApp = (id: string) => {
    setApps(apps.filter(app => app.id !== id));
  };

  const loadDemoData = () => {
    setAge(14);
    setApps([
      { id: '1', name: 'TikTok', category: 'social', hours: 2, minutes: 0 },
      { id: '2', name: 'YouTube', category: 'video', hours: 1, minutes: 0 },
      { id: '3', name: 'Minecraft', category: 'game', hours: 0, minutes: 30 },
      { id: '4', name: 'Canvas', category: 'school', hours: 0, minutes: 20 },
    ]);
    toast.success('Demo data loaded');
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const element = document.getElementById('receipt-content');
      if (!element) {
        throw new Error('Receipt element not found');
      }

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `attention-receipt-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download receipt');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    const url = getShareableURL(age, apps);
    
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Shareable link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleReset = () => {
    setAge(13);
    setApps([]);
    window.history.replaceState({}, '', window.location.pathname);
    toast.success('Receipt reset');
  };

  // Load from URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const receiptParam = params.get('receipt');
    
    if (receiptParam) {
      const data = decodeReceiptData(receiptParam);
      if (data) {
        setAge(data.age);
        setApps(data.apps);
        toast.success('Receipt loaded from shared link');
      }
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + D to download
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (apps.length > 0) {
          handleDownload();
        }
      }
      // Ctrl/Cmd + K to load demo
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        loadDemoData();
      }
      // Ctrl/Cmd + Shift + R to reset
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [apps]); // Only depend on apps for the length check

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #8B7355 0%, #6B5644 50%, #8B7355 100%)',
    }}>
      {/* Cork board texture overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(139, 115, 85, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(107, 86, 68, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(139, 115, 85, 0.2) 0%, transparent 40%)
          `,
        }}
      />
      
      {/* Noise texture for realism */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
        }}
      />
      
      <Toaster />
      
      <div className="relative max-w-7xl mx-auto py-8 px-4">
        {/* Header with pin aesthetic */}
        <div className="text-center mb-12 relative">
          {/* Push pin decoration */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-red-500 shadow-lg border-2 border-red-700" 
               style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(0,0,0,0.3)' }}>
            <div className="w-2 h-2 rounded-full bg-red-300 absolute top-1.5 left-1.5"></div>
          </div>
          
          <div className="bg-yellow-50 inline-block px-8 py-6 shadow-2xl border-2 border-yellow-200 relative"
               style={{ 
                 transform: 'rotate(-1deg)',
                 boxShadow: '0 10px 30px rgba(0,0,0,0.3), 0 1px 8px rgba(0,0,0,0.2)'
               }}>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2" 
                style={{ fontFamily: 'Impact, sans-serif', letterSpacing: '0.05em' }}>
              THE ATTENTION RECEIPT
            </h1>
            <p className="text-base md:text-lg text-gray-700 px-4" style={{ fontFamily: 'Courier, monospace' }}>
              See the real cost of screen time • 315,000+ child observations
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column: Input - styled like a clipboard */}
          <div className="space-y-6">
            <div className="bg-amber-50 p-8 relative shadow-2xl border-4 border-amber-900"
                 style={{ 
                   transform: 'rotate(0.5deg)',
                   boxShadow: '0 15px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.5)'
                 }}>
              {/* Clipboard clip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-24 h-12 bg-gray-700 rounded-t-lg shadow-xl"
                   style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.2)' }}>
                <div className="w-16 h-6 bg-gray-800 rounded-sm absolute top-3 left-4"></div>
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
                  onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                  className="mt-2 text-lg border-2 border-gray-400"
                  style={{ fontFamily: 'Courier, monospace' }}
                />
                <p className="text-sm text-gray-600 mt-2" style={{ fontFamily: 'Courier, monospace' }}>
                  Risk assessment varies by age group (0-5, 6-11, 12-17, 18+)
                </p>
              </div>

              <div className="bg-white p-4 border-2 border-amber-800 shadow-inner">
                <AppInputForm
                  apps={apps}
                  onAddApp={handleAddApp}
                  onRemoveApp={handleRemoveApp}
                />
              </div>
            </div>

            {/* Actions - styled like sticky notes */}
            <div className="bg-yellow-200 p-6 relative shadow-xl"
                 style={{ 
                   transform: 'rotate(-1.5deg)',
                   boxShadow: '0 8px 20px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(0,0,0,0.1)'
                 }}>
              <div className="absolute -top-1 left-0 right-0 h-8 bg-yellow-300 opacity-50"></div>
              
              <h3 className="text-xl font-bold mb-4 text-center" style={{ fontFamily: 'Courier, monospace' }}>
                QUICK ACTIONS
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <Button
                  onClick={handleDownload}
                  disabled={isDownloading || apps.length === 0}
                  variant="default"
                  className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3"
                  style={{ fontFamily: 'Courier, monospace' }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isDownloading ? 'PRINTING...' : 'DOWNLOAD PNG'}
                </Button>
                
                <Button
                  onClick={handleShare}
                  disabled={apps.length === 0}
                  variant="outline"
                  className="w-full border-2 border-black font-bold py-3"
                  style={{ fontFamily: 'Courier, monospace' }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  COPY LINK
                </Button>
                
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full border-2 border-black font-bold py-3"
                  style={{ fontFamily: 'Courier, monospace' }}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  RESET
                </Button>
                
                <Button
                  onClick={loadDemoData}
                  variant="outline"
                  className="w-full border-2 border-black font-bold py-3 bg-yellow-100"
                  style={{ fontFamily: 'Courier, monospace' }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  TRY DEMO
                </Button>
              </div>
            </div>

            {/* Help Section */}
            <HelpSection />

            {/* About - styled like an index card */}
            <div className="bg-white p-6 border-2 border-blue-300 shadow-xl relative"
                 style={{ 
                   transform: 'rotate(0.5deg)',
                   boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                   background: 'linear-gradient(to bottom, #e0f2fe 0%, #bae6fd 2px, white 2px)'
                 }}>
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-lg font-bold mb-3 text-blue-900" style={{ fontFamily: 'Courier, monospace' }}>
                  RESEARCH DATA
                </h3>
                <p className="text-sm text-blue-900 leading-relaxed mb-3" style={{ fontFamily: 'Courier, monospace' }}>
                  Based on survey-weighted logistic regression analysis of 315,000+ 
                  NSCH observations (2018-2024). Key findings: screen time strongly 
                  predicts ADHD in ages 0-5, anxiety/depression in ages 12-17, and 
                  reduced physical activity across all ages.
                </p>
                <p className="text-xs text-blue-700 font-bold" style={{ fontFamily: 'Courier, monospace' }}>
                  — Ayesh et al., 2025, UNC Charlotte
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Receipt Preview - styled like a thermal receipt */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="relative">
              {/* Tape at top */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-12 bg-yellow-100 opacity-60 shadow-md"
                   style={{ 
                     transform: 'rotate(-2deg)',
                     boxShadow: '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.5)'
                   }}>
              </div>
              
              <div className="bg-white p-8 relative shadow-2xl"
                   style={{ 
                     transform: 'rotate(-0.5deg)',
                     boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 8px 20px rgba(0,0,0,0.3)',
                   }}>
                <h2 className="text-2xl font-bold mb-6 text-center border-b-4 border-dashed border-black pb-2"
                    style={{ fontFamily: 'Courier, monospace', letterSpacing: '0.1em' }}>
                  🧾 YOUR RECEIPT
                </h2>
                <Receipt age={age} apps={apps} />
              </div>
              
              {/* Bottom curl effect */}
              <div className="absolute -bottom-2 right-4 w-16 h-16 bg-gray-300 opacity-20 rounded-full blur-xl"></div>
            </div>
          </div>
        </div>

        {/* Footer - styled like a torn paper note */}
        <footer className="mt-16 text-center relative">
          <div className="inline-block bg-gray-100 px-8 py-4 shadow-lg border-t-4 border-gray-300 relative"
               style={{ 
                 transform: 'rotate(-0.5deg)',
                 boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                 clipPath: 'polygon(0 0, 100% 0, 100% 85%, 95% 90%, 90% 85%, 85% 90%, 80% 85%, 75% 90%, 70% 85%, 65% 90%, 60% 85%, 55% 90%, 50% 85%, 45% 90%, 40% 85%, 35% 90%, 30% 85%, 25% 90%, 20% 85%, 15% 90%, 10% 85%, 5% 90%, 0 85%)'
               }}>
            <p className="text-sm text-gray-700 font-mono">
              The Attention Receipt • A research-based visualization
            </p>
            <p className="mt-1 text-xs text-gray-600 font-mono">
              Data: National Survey of Children's Health (NSCH) 2018-2024
            </p>
            <p className="mt-2 text-xs text-gray-500 font-mono">
              ⌨️ Shortcuts: Ctrl+K (demo) • Ctrl+D (download) • Ctrl+Shift+R (reset)
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;