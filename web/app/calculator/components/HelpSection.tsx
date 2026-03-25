import React from 'react';
import { Info, TrendingUp, AlertTriangle, Activity } from 'lucide-react';

export function HelpSection() {
  return (
    <div className="bg-orange-100 p-6 relative shadow-xl border-4 border-orange-400"
         style={{ 
           transform: 'rotate(1deg)',
           boxShadow: '0 10px 25px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.4)'
         }}>
      {/* Thumbtack decoration */}
      <div className="absolute -top-4 right-8 w-6 h-6 rounded-full bg-blue-500 shadow-lg border-2 border-blue-700" 
           style={{ boxShadow: '0 3px 6px rgba(0,0,0,0.3), inset 0 -1px 2px rgba(0,0,0,0.3)' }}>
        <div className="w-1.5 h-1.5 rounded-full bg-blue-200 absolute top-1 left-1"></div>
      </div>
      
      <div className="flex items-center gap-2 mb-4 border-b-2 border-dashed border-orange-600 pb-2">
        <Info className="w-5 h-5 text-orange-700" />
        <h3 className="text-xl font-bold text-orange-900" style={{ fontFamily: 'Courier, monospace' }}>
          HOW IT WORKS
        </h3>
      </div>
      
      <div className="space-y-4 text-sm text-orange-900" style={{ fontFamily: 'Courier, monospace' }}>
        <div className="flex gap-3 bg-white p-3 border-2 border-orange-300 shadow-sm">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
            1
          </div>
          <div>
            <p className="font-bold">Enter your child's age</p>
            <p className="text-orange-700 text-xs">Risk factors vary by age group</p>
          </div>
        </div>
        
        <div className="flex gap-3 bg-white p-3 border-2 border-orange-300 shadow-sm">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
            2
          </div>
          <div>
            <p className="font-bold">Add apps and screen time</p>
            <p className="text-orange-700 text-xs">Include all devices: phone, tablet, PC, TV</p>
          </div>
        </div>
        
        <div className="flex gap-3 bg-white p-3 border-2 border-orange-300 shadow-sm">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
            3
          </div>
          <div>
            <p className="font-bold">Review your receipt</p>
            <p className="text-orange-700 text-xs">See risk assessment + actionable swaps</p>
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t-2 border-dashed border-orange-600">
        <p className="text-xs text-orange-800 font-bold mb-3" style={{ fontFamily: 'Courier, monospace' }}>
          KEY RESEARCH FINDINGS:
        </p>
        <div className="grid grid-cols-1 gap-2 text-xs" style={{ fontFamily: 'Courier, monospace' }}>
          <div className="flex items-start gap-2 bg-white p-2 border-l-4 border-red-500">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span className="text-orange-800">Ages 0-5: Screen time → ADHD risk (strongest link)</span>
          </div>
          <div className="flex items-start gap-2 bg-white p-2 border-l-4 border-yellow-500">
            <TrendingUp className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
            <span className="text-orange-800">Ages 12-17: 3+ hrs social = 2.1× anxiety odds</span>
          </div>
          <div className="flex items-start gap-2 bg-white p-2 border-l-4 border-blue-500">
            <Activity className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <span className="text-orange-800">4+ hrs/day = 0.7 fewer active days/week</span>
          </div>
        </div>
      </div>
    </div>
  );
}