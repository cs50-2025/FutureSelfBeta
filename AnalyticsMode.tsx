import React from 'react';
import { UserProfile, ActivityLog } from '../types';
import PowerChart from './charts/PowerChart';
import MinigameArcade from './MinigameArcade';
import { Trophy, Star, TrendingUp, Zap, Crown, Brain, Activity, Heart, Shield, Clock, Medal } from 'lucide-react';

interface AnalyticsModeProps {
  currentUser: UserProfile | null;
}

const AnalyticsMode: React.FC<AnalyticsModeProps> = ({ currentUser }) => {

  // Fallback for non-logged in users (preview mode)
  const stats = currentUser?.stats || {
    level: 1, xp: 0, 
    intelligence: 0, vitality: 0, strength: 0, discipline: 0, peace: 0,
    totalStudySessions: 0, totalWorkouts: 0, totalMeditations: 0, currentStress: 10
  };

  const nextLevelXp = stats.level * 100;
  const xpProgress = Math.min(100, (stats.xp / nextLevelXp) * 100);

  // Derive badges from stats
  const badges = [
    { id: 'novice', name: 'New Beginnings', desc: 'Completed first activity', unlocked: stats.totalStudySessions + stats.totalWorkouts + stats.totalMeditations > 0, icon: Star, color: 'text-neon-yellow' },
    { id: 'jack', name: 'Jack of All Trades', desc: 'Tried Study, Training, and Meditation', unlocked: stats.totalStudySessions > 0 && stats.totalWorkouts > 0 && stats.totalMeditations > 0, icon: Crown, color: 'text-neon-purple' },
    { id: 'scholar', name: 'Scholar', desc: '5 Study Sessions', unlocked: stats.totalStudySessions >= 5, icon: Brain, color: 'text-neon-blue' },
    { id: 'athlete', name: 'Athlete', desc: '5 Workouts', unlocked: stats.totalWorkouts >= 5, icon: Activity, color: 'text-neon-green' },
    { id: 'monk', name: 'Zen Master', desc: 'Reduced Stress to 0', unlocked: stats.currentStress === 0 && stats.totalMeditations > 0, icon: Heart, color: 'text-neon-pink' },
    { id: 'pro', name: 'Pro User', desc: 'Reach Level 5', unlocked: stats.level >= 5, icon: Trophy, color: 'text-neon-orange' },
  ];

  const recentLogs = currentUser?.activityLog ? [...currentUser.activityLog].reverse().slice(0, 5) : [];

  return (
    <div className="min-h-screen bg-[#050a14] p-4 lg:p-8 text-white pb-20 font-sans">
      
      {/* HEADER: LEVEL & XP */}
      <header className="mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-neon-blue/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            {/* Level Icon */}
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-neon-orange to-neon-yellow rounded-full flex items-center justify-center text-black shadow-lg shadow-neon-orange/30 border-4 border-slate-800">
                <div className="text-center">
                  <div className="text-xs font-bold uppercase opacity-80">Level</div>
                  <div className="text-4xl font-black">{stats.level}</div>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-neon-blue text-black text-xs font-bold px-3 py-1 rounded-full border-2 border-slate-800">
                {stats.xp} XP
              </div>
            </div>

            {/* XP Bar & Stats */}
            <div className="flex-1 w-full">
               <div className="flex justify-between text-sm font-bold mb-2">
                 <span>Progress to Level {stats.level + 1}</span>
                 <span className="text-neon-blue">{Math.floor(xpProgress)}%</span>
               </div>
               <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner border border-slate-700">
                 <div className="h-full bg-gradient-to-r from-neon-blue to-neon-purple shadow-[0_0_10px_#00f3ff]" style={{ width: `${xpProgress}%` }}></div>
               </div>
               <p className="text-xs text-slate-400 mt-2">
                 Complete activities to earn XP and unlock better games in the Arcade.
               </p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COL: STATS VISUALIZATION */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Power Stats Radar */}
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-sm">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <Zap className="text-neon-yellow" /> Attribute Profile
            </h3>
            <div className="h-64">
              <PowerChart stats={stats} />
            </div>
            <div className="text-center text-xs text-slate-500 mt-2">Attributes grow as you complete sessions</div>
          </div>

          {/* Stress Gauge (Inverted logic visual) */}
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-sm">
             <h3 className="font-bold flex items-center gap-2 mb-4">
              <Shield className="text-neon-pink" /> Stress Monitor
            </h3>
            <div className="relative h-8 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
               {/* 10 is bad (full bar), 0 is good (empty bar) */}
               <div 
                 className={`h-full transition-all duration-500 ${stats.currentStress > 7 ? 'bg-neon-pink shadow-neon-pink' : stats.currentStress > 4 ? 'bg-neon-orange shadow-neon-orange' : 'bg-neon-green shadow-neon-green'}`}
                 style={{ width: `${(stats.currentStress / 10) * 100}%` }}
               ></div>
            </div>
            <div className="flex justify-between text-xs font-bold mt-2">
               <span>Zen (0)</span>
               <span>Current: {stats.currentStress}/10</span>
               <span>Panic (10)</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Meditate to lower stress levels.</p>
          </div>

        </div>

        {/* MIDDLE COL: ACTIVITY & BADGES */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Cumulative Counters */}
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-sm">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <TrendingUp className="text-neon-blue" /> Lifetime Stats
            </h3>
            <div className="space-y-4">
               <div>
                 <div className="flex justify-between text-sm mb-1">
                   <span className="flex items-center gap-2"><Brain size={14} className="text-neon-blue"/> Academic Intelligence</span>
                   <span className="font-bold">{stats.intelligence} pts</span>
                 </div>
                 <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-neon-blue shadow-[0_0_8px_#00f3ff]" style={{ width: `${Math.min(100, stats.intelligence)}%` }}></div>
                 </div>
               </div>

               <div>
                 <div className="flex justify-between text-sm mb-1">
                   <span className="flex items-center gap-2"><Activity size={14} className="text-neon-green"/> Physical Strength</span>
                   <span className="font-bold">{stats.strength} pts</span>
                 </div>
                 <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-neon-green shadow-[0_0_8px_#0aff00]" style={{ width: `${Math.min(100, stats.strength)}%` }}></div>
                 </div>
               </div>

               <div>
                 <div className="flex justify-between text-sm mb-1">
                   <span className="flex items-center gap-2"><Heart size={14} className="text-neon-purple"/> Inner Peace</span>
                   <span className="font-bold">{stats.peace} pts</span>
                 </div>
                 <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-neon-purple shadow-[0_0_8px_#bc13fe]" style={{ width: `${Math.min(100, stats.peace)}%` }}></div>
                 </div>
               </div>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-sm">
             <h3 className="font-bold flex items-center gap-2 mb-4">
              <Medal className="text-neon-yellow" /> Badges
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {badges.map(badge => (
                <div key={badge.id} className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${badge.unlocked ? 'bg-slate-800 border-slate-700 shadow-lg shadow-white/5' : 'bg-slate-900 border-transparent opacity-30 grayscale'}`}>
                   <badge.icon className={`w-8 h-8 mb-2 ${badge.color} drop-shadow-md`} />
                   <div className="text-[10px] font-bold leading-tight">{badge.name}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COL: HISTORY & GAMES */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Minigame Arcade */}
          <MinigameArcade level={stats.level} />

          {/* Recent Activity Log */}
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-sm">
             <h3 className="font-bold flex items-center gap-2 mb-4">
              <Clock className="text-slate-400" /> Recent Activity
            </h3>
            <div className="space-y-4">
              {recentLogs.length > 0 ? recentLogs.map(log => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                   <div className={`mt-1 w-2 h-2 rounded-full ${log.type === 'study' ? 'bg-neon-blue shadow-neon-blue' : log.type === 'workout' ? 'bg-neon-green shadow-neon-green' : 'bg-neon-purple shadow-neon-purple'}`}></div>
                   <div>
                     <p className="text-sm font-semibold">{log.description}</p>
                     <p className="text-xs text-slate-500">+{log.xpEarned} XP • {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                   </div>
                </div>
              )) : (
                <p className="text-sm text-slate-500 text-center py-4">No activity yet. Start studying or training!</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AnalyticsMode;
