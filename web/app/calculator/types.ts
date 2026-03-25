export type AppCategory = 'social' | 'video' | 'game' | 'school' | 'other';

export interface AppEntry {
  id: string;
  name: string;
  category: AppCategory;
  hours: number;
  minutes: number;
}

export type RiskLevel = 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH';

export interface RiskAssessment {
  anxietyDepression: RiskLevel;
  physicalActivity: RiskLevel;
  adhd: RiskLevel;
  recommendation: string;
}
