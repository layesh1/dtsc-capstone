import { AppEntry, RiskLevel, RiskAssessment, AppCategory } from '../types';

/**
 * Calculate total screen time in hours
 */
export function calculateTotalTime(apps: AppEntry[]): number {
  return apps.reduce((total, app) => {
    return total + app.hours + app.minutes / 60;
  }, 0);
}

/**
 * Calculate time spent on specific category
 */
export function calculateCategoryTime(apps: AppEntry[], category: AppCategory): number {
  return apps
    .filter(app => app.category === category)
    .reduce((total, app) => total + app.hours + app.minutes / 60, 0);
}

/**
 * Format hours as "Xh YYm"
 */
export function formatTime(totalHours: number): string {
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);
  
  if (hours === 0) {
    return `${minutes}m`;
  }
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}

/**
 * Generate visual bar based on time spent (max 4 hours = 8 blocks)
 */
export function generateTimeBar(totalHours: number): string {
  const blocks = Math.min(Math.ceil(totalHours / 0.5), 8);
  return '█'.repeat(blocks);
}

/**
 * Calculate risk assessment based on age and screen time
 * Based on NSCH study findings:
 * - Ages 0-5: screen time → ADHD (strongest)
 * - Ages 12-17: screen time → anxiety/depression (strongest)
 * - 4+ hrs/day → 0.7 fewer active days/week
 */
export function calculateRiskAssessment(age: number, apps: AppEntry[]): RiskAssessment {
  const totalTime = calculateTotalTime(apps);
  const socialMediaTime = calculateCategoryTime(apps, 'social');
  
  let anxietyDepression: RiskLevel = 'LOW';
  let physicalActivity: RiskLevel = 'LOW';
  let adhd: RiskLevel = 'LOW';
  let recommendation = '';

  // Ages 0-5: ADHD is strongest association
  if (age >= 0 && age <= 5) {
    if (totalTime >= 3) {
      adhd = 'ELEVATED';
      physicalActivity = 'MODERATE';
      anxietyDepression = 'MODERATE';
      recommendation = `Replace 30 min screen time with active play → reduces ADHD risk to MODERATE`;
    } else if (totalTime >= 2) {
      adhd = 'MODERATE';
      physicalActivity = 'MODERATE';
      anxietyDepression = 'LOW';
      recommendation = `Limit to 1hr/day to reduce ADHD risk`;
    } else if (totalTime >= 1) {
      adhd = 'MODERATE';
      physicalActivity = 'LOW';
      anxietyDepression = 'LOW';
      recommendation = `Current levels are manageable for this age`;
    } else {
      adhd = 'LOW';
      physicalActivity = 'LOW';
      anxietyDepression = 'LOW';
      recommendation = `Screen time is within healthy limits`;
    }
  }
  // Ages 6-11: Moderate risk across categories
  else if (age >= 6 && age <= 11) {
    if (totalTime >= 4) {
      adhd = 'ELEVATED';
      physicalActivity = 'ELEVATED';
      anxietyDepression = 'MODERATE';
      recommendation = `4+ hrs/day linked to 0.7 fewer active days/week. Reduce by 1hr to improve activity levels`;
    } else if (totalTime >= 3) {
      adhd = 'MODERATE';
      physicalActivity = 'MODERATE';
      anxietyDepression = 'MODERATE';
      recommendation = `Swap 30 min screen time for outdoor play`;
    } else if (totalTime >= 2) {
      adhd = 'MODERATE';
      physicalActivity = 'LOW';
      anxietyDepression = 'LOW';
      recommendation = `Balance screen time with physical activities`;
    } else {
      adhd = 'LOW';
      physicalActivity = 'LOW';
      anxietyDepression = 'LOW';
      recommendation = `Screen time is within healthy limits`;
    }
  }
  // Ages 12-17: Anxiety/depression is strongest association
  else if (age >= 12 && age <= 17) {
    // 3+ hrs social media = 2.1× higher anxiety odds (from research)
    if (socialMediaTime >= 3) {
      anxietyDepression = 'HIGH';
      physicalActivity = 'ELEVATED';
      adhd = 'MODERATE';
      recommendation = `Replace 30 min social media with a structured activity → drops anxiety risk to ELEVATED`;
    } else if (totalTime >= 4) {
      anxietyDepression = 'ELEVATED';
      physicalActivity = 'ELEVATED';
      adhd = 'MODERATE';
      recommendation = `4+ hrs/day linked to 0.7 fewer active days/week. Consider reducing total time`;
    } else if (totalTime >= 3 || socialMediaTime >= 2) {
      anxietyDepression = 'ELEVATED';
      physicalActivity = 'MODERATE';
      adhd = 'LOW';
      recommendation = `Limit social media to reduce anxiety/depression risk`;
    } else if (totalTime >= 2) {
      anxietyDepression = 'MODERATE';
      physicalActivity = 'LOW';
      adhd = 'LOW';
      recommendation = `Current levels are manageable. Monitor social media use`;
    } else {
      anxietyDepression = 'LOW';
      physicalActivity = 'LOW';
      adhd = 'LOW';
      recommendation = `Screen time is within healthy limits`;
    }
  }
  // Ages 18+
  else {
    if (totalTime >= 5) {
      anxietyDepression = 'MODERATE';
      physicalActivity = 'ELEVATED';
      adhd = 'LOW';
      recommendation = `Consider reducing screen time to improve physical activity`;
    } else if (totalTime >= 3) {
      anxietyDepression = 'LOW';
      physicalActivity = 'MODERATE';
      adhd = 'LOW';
      recommendation = `Balance screen time with other activities`;
    } else {
      anxietyDepression = 'LOW';
      physicalActivity = 'LOW';
      adhd = 'LOW';
      recommendation = `Screen time appears balanced`;
    }
  }

  return {
    anxietyDepression,
    physicalActivity,
    adhd,
    recommendation
  };
}

/**
 * Get icon for risk level
 */
export function getRiskIcon(level: RiskLevel): string {
  switch (level) {
    case 'HIGH':
      return '⚠⚠';
    case 'ELEVATED':
      return '⚠';
    case 'MODERATE':
      return '△';
    case 'LOW':
      return '✓';
  }
}

/**
 * Get category display name
 */
export function getCategoryDisplay(category: AppCategory): string {
  const displays: Record<AppCategory, string> = {
    social: 'Social',
    video: 'Video',
    game: 'Game',
    school: 'School',
    other: 'Other'
  };
  return displays[category];
}
