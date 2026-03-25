import React from 'react';
import { AppEntry } from '@/app/calculator/types';
import {
  calculateTotalTime,
  formatTime,
  generateTimeBar,
  calculateRiskAssessment,
  getRiskIcon,
  getCategoryDisplay
} from '@/app/calculator/utils/riskCalculator';

interface ReceiptProps {
  age: number;
  apps: AppEntry[];
  showWatermark?: boolean;
}

export function Receipt({ age, apps, showWatermark = false }: ReceiptProps) {
  const totalTime = calculateTotalTime(apps);
  const risk = calculateRiskAssessment(age, apps);
  const currentDate = new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true
  });

  return (
    <div 
      id="receipt-content"
      className="bg-white text-black max-w-md mx-auto relative"
      style={{ fontFamily: 'Courier, monospace' }}
    >
      {/* Thermal printer paper texture */}
      <div className="relative" style={{
        background: 'linear-gradient(to bottom, #fafafa 0%, #ffffff 10%, #ffffff 90%, #f5f5f5 100%)',
      }}>
        {/* Perforated edge at top */}
        <div className="absolute -top-2 left-0 right-0 h-2 flex justify-around">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-gray-400"></div>
          ))}
        </div>
        
        <div className="p-8 pt-6">
          {/* Header */}
          <div className="border-4 border-black border-double p-4 bg-white">
            <div className="text-center mb-4">
              <div className="text-2xl font-bold tracking-wider mb-1">━━━━━━━━━━━━━━━━━</div>
              <div className="text-xl font-bold tracking-wider">THE ATTENTION</div>
              <div className="text-xl font-bold tracking-wider">RECEIPT</div>
              <div className="text-2xl font-bold tracking-wider mt-1">━━━━━━━━━━━━━━━━━</div>
              <div className="text-xs mt-2 opacity-70">attentionreceipt.com</div>
            </div>
            
            <div className="border-t-2 border-b-2 border-black border-dashed py-3 my-4 bg-gray-50">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-xs opacity-60">DATE</div>
                  <div className="font-bold">{currentDate}</div>
                </div>
                <div>
                  <div className="text-xs opacity-60">TIME</div>
                  <div className="font-bold">{currentTime}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs opacity-60">CHILD AGE (YRS)</div>
                  <div className="font-bold text-lg">{age} years old</div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="my-4">
              <div className="font-bold mb-3 text-center text-lg border-y-2 border-black py-2 bg-gray-100">
                ATTENTION SPENT TODAY
              </div>
              <div className="border-b border-black border-dashed mb-3"></div>
              
              {apps.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 border-2 border-dashed border-gray-300">
                  <div className="text-sm opacity-60 mb-2">No apps tracked yet</div>
                  <div className="text-xs opacity-50">Add apps to see your receipt</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {apps.map((app, index) => {
                    const appTime = app.hours + app.minutes / 60;
                    const timeStr = formatTime(appTime);
                    const bar = generateTimeBar(appTime);
                    
                    return (
                      <div key={app.id}>
                        {index > 0 && <div className="border-b border-dotted border-gray-300 my-2"></div>}
                        <div className="bg-gray-50 p-2">
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex-1">
                              <span className="font-bold text-base">{app.name}</span>
                            </div>
                            <span className="font-bold text-base ml-2">{timeStr}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="opacity-60 uppercase">{getCategoryDisplay(app.category)}</span>
                            <span className="font-mono">{bar}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div className="border-t-2 border-black border-double my-3 pt-3 bg-yellow-50">
                <div className="flex justify-between font-bold text-lg">
                  <span>TOTAL TIME</span>
                  <span>{formatTime(totalTime)}</span>
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            {apps.length > 0 && (
              <>
                <div className="border-t-4 border-b-4 border-black border-double py-3 my-4 bg-red-50">
                  <div className="font-bold mb-3 text-center text-base">
                    ⚠️ RESEARCH-BASED RISK ASSESSMENT ⚠️
                  </div>
                  <div className="text-center text-xs opacity-70 mb-3">
                    AGE GROUP: {age >= 0 && age <= 5 ? '0-5' : age >= 6 && age <= 11 ? '6-11' : age >= 12 && age <= 17 ? '12-17' : '18+'}
                  </div>
                  <div className="border-b border-black border-dashed mb-3"></div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center bg-white p-2 border border-gray-300">
                      <span className="font-bold">Anxiety/Depression</span>
                      <span className="flex items-center gap-2">
                        <span className="w-24 text-right font-mono">{risk.anxietyDepression}</span>
                        <span className="w-10 text-xl">{getRiskIcon(risk.anxietyDepression)}</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 border border-gray-300">
                      <span className="font-bold">Physical Activity</span>
                      <span className="flex items-center gap-2">
                        <span className="w-24 text-right font-mono">{risk.physicalActivity}</span>
                        <span className="w-10 text-xl">{getRiskIcon(risk.physicalActivity)}</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 border border-gray-300">
                      <span className="font-bold">ADHD</span>
                      <span className="flex items-center gap-2">
                        <span className="w-24 text-right font-mono">{risk.adhd}</span>
                        <span className="w-10 text-xl">{getRiskIcon(risk.adhd)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="border-t-2 border-b-2 border-black border-dashed py-3 my-4 bg-green-50">
                  <div className="font-bold mb-2 text-center text-base">
                    💡 RECOMMENDED SWAP 💡
                  </div>
                  <div className="text-sm leading-relaxed p-3 bg-white border-2 border-green-600">
                    {risk.recommendation}
                  </div>
                </div>
              </>
            )}

            {/* Footer */}
            <div className="text-xs mt-4 leading-relaxed space-y-1 border-t-2 border-black pt-3">
              <div className="font-bold text-center mb-2">━━ RESEARCH NOTES ━━</div>
              <div>✱ Based on 315,000-child NSCH study</div>
              {age >= 12 && age <= 17 && (
                <div>✱ Ages 12-17: 3+hrs social media = 2.1× anxiety odds</div>
              )}
              {age >= 0 && age <= 5 && (
                <div>✱ Ages 0-5: strongest screen → ADHD link</div>
              )}
              {totalTime >= 4 && (
                <div>✱ 4+ hrs/day → 0.7 fewer active days/week</div>
              )}
              <div className="border-t border-dashed border-black mt-2 pt-2 text-center">
                <div className="font-bold">Ayesh et al., 2025</div>
                <div className="opacity-70">UNC Charlotte</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Perforated edge at bottom */}
        <div className="absolute -bottom-2 left-0 right-0 h-2 flex justify-around">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-gray-400"></div>
          ))}
        </div>
      </div>
    </div>
  );
}