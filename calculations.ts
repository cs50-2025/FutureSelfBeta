import { UserHabits, SimulationMetrics, ProjectionPoint } from '../types';

const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

export const calculateImpact = (habits: UserHabits): string => {
  // Changed const to let to allow reassignment
  let improvements: { name: string; score: number } = { name: '', score: 0 };
  
  // Check Sleep
  if (habits.sleepHours < 7) {
    improvements = { name: 'Increase Sleep', score: 9 };
  }
  // Check Exercise
  else if (habits.exerciseDays < 3) {
    improvements = { name: 'More Exercise', score: 8 };
  }
  // Check Stress
  else if (habits.stressLevel > 7) {
    improvements = { name: 'Reduce Stress', score: 8.5 };
  }
  // Check Screen Time
  else if (habits.screenTime > 4) {
    improvements = { name: 'Reduce Screen Time', score: 7 };
  }
  // Check Study (Too low)
  else if (habits.studyHours < 5) {
    improvements = { name: 'Increase Study Time', score: 6 };
  }
  // Check Study (Too high causing burnout)
  else if (habits.studyHours > 25 && habits.sleepHours < 6) {
    improvements = { name: 'Balance Study/Rest', score: 9.5 };
  } else {
    improvements = { name: 'Maintain Habits', score: 0 };
  }

  return improvements.name;
};

export const calculateMetrics = (habits: UserHabits): SimulationMetrics => {
  // Normalize inputs for calculation
  // Sleep: Ideal 8 (Range 4-10)
  const sleepScore = clamp((habits.sleepHours - 4) / 6, 0, 1); 
  
  // Study: Ideal 15-25 (Range 0-30). Diminishing returns after 25.
  const studyScore = clamp(habits.studyHours / 25, 0, 1.1); 
  
  // Screen: Ideal 0 (Range 0-10). Inverted.
  const screenScore = clamp(1 - (habits.screenTime / 10), 0, 1);
  
  // Exercise: Ideal 5-7 (Range 0-7).
  const exerciseScore = clamp(habits.exerciseDays / 5, 0, 1);
  
  // Stress: Ideal 1 (Range 1-10). Inverted.
  const stressRaw = (habits.stressLevel - 1) / 9;
  const stressScore = 1 - stressRaw; // 1 is low stress, 0 is high stress

  // --- ACADEMIC PERFORMANCE (0-100) ---
  // Heavy weight: Study, Sleep. Negative: High Screen, High Stress.
  let academicBase = 30;
  academicBase += (studyScore * 40); // Max 40
  academicBase += (sleepScore * 20); // Max 20
  academicBase += (screenScore * 5); // Max 5 (Less screen is better)
  academicBase += (stressScore * 5); // Max 5 (Low stress is better)
  
  // Penalty for extremely low sleep or high burnout
  if (habits.sleepHours < 5) academicBase -= 10;
  
  const academicFinal = clamp(Math.round(academicBase), 10, 100);

  // --- BURNOUT RISK (0-100) ---
  // Heavy weight: Stress, High Study, Screen. Mitigation: Sleep, Exercise.
  // Note: Higher score = Higher Risk
  let burnoutBase = 20;
  burnoutBase += (stressRaw * 40); // High stress adds up to 40
  if (habits.studyHours > 20) burnoutBase += ((habits.studyHours - 20) / 10 * 15); // Overworking adds risk
  burnoutBase += ((1 - screenScore) * 15); // High screen adds risk
  burnoutBase -= (sleepScore * 20); // Good sleep reduces risk
  burnoutBase -= (exerciseScore * 15); // Exercise reduces risk
  
  const burnoutFinal = clamp(Math.round(burnoutBase), 5, 98);

  // --- HEALTH STABILITY (0-100) ---
  // Heavy weight: Sleep, Exercise. Negative: Stress, Screen.
  let healthBase = 20;
  healthBase += (sleepScore * 35);
  healthBase += (exerciseScore * 30);
  healthBase += (stressScore * 10);
  healthBase += (screenScore * 5);
  
  const healthFinal = clamp(Math.round(healthBase), 10, 100);

  // --- PROJECTIONS (5 Years) ---
  const projectionData: ProjectionPoint[] = [];
  
  let currentAcad = academicFinal;
  let currentBurn = burnoutFinal;
  let currentHealth = healthFinal;

  for (let year = 0; year <= 5; year++) {
    projectionData.push({
      year: 2024 + year,
      academic: Math.round(currentAcad),
      burnout: Math.round(currentBurn),
      health: Math.round(currentHealth)
    });

    // Simulation Logic for next year
    // If Burnout is high (>70), Academic and Health degrade faster
    const burnoutFactor = currentBurn > 70 ? 1.5 : (currentBurn > 50 ? 1.1 : 1.0);
    
    // Academic trajectory
    if (habits.studyHours > 5 && habits.sleepHours > 6) {
        currentAcad += (2 / burnoutFactor); // Slow growth if healthy
    } else {
        currentAcad -= (3 * burnoutFactor); // Decline if poor habits
    }

    // Burnout trajectory (Compound)
    if (habits.stressLevel > 6 || habits.sleepHours < 6) {
        currentBurn += 2; // Increases over time if unchecked
    } else if (habits.exerciseDays > 3) {
        currentBurn -= 1; // Recovery
    }

    // Health trajectory
    if (habits.exerciseDays < 2 || habits.sleepHours < 6) {
        currentHealth -= 2;
    } else {
        currentHealth += 1;
    }

    // Clamp yearly values
    currentAcad = clamp(currentAcad, 0, 100);
    currentBurn = clamp(currentBurn, 0, 100);
    currentHealth = clamp(currentHealth, 0, 100);
  }

  return {
    academicScore: academicFinal,
    burnoutRisk: burnoutFinal,
    healthScore: healthFinal,
    projectionData,
    biggestImpact: calculateImpact(habits)
  };
};