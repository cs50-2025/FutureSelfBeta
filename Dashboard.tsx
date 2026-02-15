import React, { useMemo } from 'react';
import Slider from './ui/Slider';
import TrendChart from './charts/TrendChart';
import FutureMessage from './FutureMessage';
import { UserHabits } from '../types';
import { calculateMetrics } from '../utils/calculations';
import { Brain, Battery, Activity, AlertTriangle, TrendingUp } from 'lucide-react';

interface DashboardProps {
  habits: UserHabits;
  setHabits: React.Dispatch<React.SetStateAction<UserHabits>>;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ habits, setHabits, darkMode, toggleDarkMode }) => {
  // Derived Metrics (Memoized for performance)
  const metrics = useMemo(() => calculateMetrics(habits), [habits]);

  const updateHabit = (key: keyof UserHabits, value: number) => {
    setHabits(prev => ({ ...prev, [key]: value }));
  };

  const getRiskColor = (val: number, inverse = false) => {
    const isBad = inverse ? val > 60 : val < 40;
    const isWarn = inverse ? val > 40 && val <= 60 : val >= 40 && val < 70;
    
    if (isBad) return 'text-neon-pink';
    if (isWarn) return 'text-neon-orange';
    return 'text-neon-green';
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto font-sans text-white">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 md:mb-12">
        <div>
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-purple drop-shadow-sm">
            Trajectory Dashboard
          </h1>
          <p className="text-slate-400 mt-2">
            Simulate the long-term impact of your daily habits.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Inputs */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900/80 rounded-2xl p-6 shadow-lg shadow-neon-blue/5 border border-slate-800 backdrop-blur-md">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
              <Activity className="w-5 h-5 text-neon-blue" /> 
              Current Habits
            </h2>
            
            <Slider 
              label="Sleep per Night" 
              value={habits.sleepHours} 
              min={4} max={10} unit="h"
              onChange={(v) => updateHabit('sleepHours', v)}
              colorClass="bg-neon-blue"
              icon={<span className="text-neon-blue">☾</span>}
            />
            
            <Slider 
              label="Study per Week" 
              value={habits.studyHours} 
              min={0} max={30} unit="h"
              onChange={(v) => updateHabit('studyHours', v)}
              colorClass="bg-neon-purple"
              icon={<span className="text-neon-purple">✎</span>}
            />
            
            <Slider 
              label="Screen Time / Day" 
              value={habits.screenTime} 
              min={0} max={10} unit="h"
              onChange={(v) => updateHabit('screenTime', v)}
              colorClass="bg-neon-pink"
              icon={<span className="text-neon-pink">📺</span>}
            />

            <Slider 
              label="Exercise Days / Week" 
              value={habits.exerciseDays} 
              min={0} max={7}
              onChange={(v) => updateHabit('exerciseDays', v)}
              colorClass="bg-neon-green"
              icon={<span className="text-neon-green">⚡</span>}
            />

            <Slider 
              label="Stress Level" 
              value={habits.stressLevel} 
              min={1} max={10}
              onChange={(v) => updateHabit('stressLevel', v)}
              colorClass="bg-neon-orange"
              icon={<span className="text-neon-orange">⚠</span>}
            />
          </div>

          <div className="bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30 rounded-2xl p-6 text-white shadow-neon-blue/20">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-6 h-6 mt-1 text-neon-blue" />
              <div>
                <h3 className="font-semibold text-lg text-neon-blue">Biggest Impact Habit</h3>
                <p className="text-slate-300 text-sm mt-1 mb-3">
                  Adjusting this one factor yields the highest ROI on your future well-being.
                </p>
                <div className="inline-block bg-neon-blue text-black px-3 py-1 rounded-full text-sm font-bold shadow-neon-blue">
                  {metrics.biggestImpact}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Outputs */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Score Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Academic Card */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-neon-purple shadow-[0_0_15px_#bc13fe]"></div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-slate-400 font-medium text-sm flex items-center gap-2">
                  <Brain size={16} className="text-neon-purple" /> Academic
                </span>
              </div>
              <div className={`text-3xl font-bold ${getRiskColor(metrics.academicScore)}`}>
                {metrics.academicScore}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Driven by study consistency and sleep quality.
              </p>
            </div>

            {/* Burnout Card */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-neon-pink shadow-[0_0_15px_#ff00ff]"></div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-slate-400 font-medium text-sm flex items-center gap-2">
                  <AlertTriangle size={16} className="text-neon-pink" /> Burnout Risk
                </span>
              </div>
              <div className={`text-3xl font-bold ${getRiskColor(metrics.burnoutRisk, true)}`}>
                {metrics.burnoutRisk}%
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Increases with stress and screen time.
              </p>
            </div>

            {/* Health Card */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-neon-green shadow-[0_0_15px_#0aff00]"></div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-slate-400 font-medium text-sm flex items-center gap-2">
                  <Battery size={16} className="text-neon-green" /> Health
                </span>
              </div>
              <div className={`text-3xl font-bold ${getRiskColor(metrics.healthScore)}`}>
                {metrics.healthScore}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Vitality projection based on physical habits.
              </p>
            </div>

          </div>

          {/* Chart Section */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-sm">
            <h3 className="font-semibold text-white mb-4">5-Year Trajectory Projection</h3>
            <TrendChart data={metrics.projectionData} />
          </div>

          {/* AI Message Section */}
          <FutureMessage habits={habits} metrics={metrics} />

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
