import React from 'react';
import { UserProfile } from '../types';
import { Users, Trophy, Swords, ArrowLeft, Lock, Zap } from 'lucide-react';

interface SocialModeProps {
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onBack: () => void;
}

const SocialMode: React.FC<SocialModeProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#050a14] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden font-sans">
      
      {/* Back Button */}
      <button onClick={onBack} className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2 transition-colors z-20 font-medium">
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      {/* Background FX */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-purple/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-neon-blue/5 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl w-full">
        
        <div className="flex flex-col items-center mb-12">
          <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center mb-8 border border-slate-800 shadow-neon-blue shadow-[0_0_40px_rgba(0,243,255,0.15)] transform rotate-6 hover:rotate-0 transition-transform duration-500">
            <Users size={48} className="text-neon-blue drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]" />
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-neon-blue via-white to-neon-purple tracking-tighter drop-shadow-sm">
            COMING SOON
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
            The <span className="text-white font-bold">Social Hub</span> is currently under construction. 
            Prepare to connect, compete, and evolve together.
          </p>
        </div>

        {/* Feature Teasers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Feature 1 */}
          <div className="bg-slate-900/40 p-8 rounded-3xl border border-slate-800 backdrop-blur-md hover:border-neon-yellow/50 transition-colors group">
            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Trophy className="text-neon-yellow" size={24} />
            </div>
            <h3 className="text-white font-bold text-xl mb-3 group-hover:text-neon-yellow transition-colors">Global Leaderboards</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Rank against friends and the world based on your XP, consistency, and habit streaks. Prove your discipline.</p>
          </div>

          {/* Feature 2 */}
          <div className="bg-slate-900/40 p-8 rounded-3xl border border-slate-800 backdrop-blur-md hover:border-neon-pink/50 transition-colors group">
            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Swords className="text-neon-pink" size={24} />
            </div>
            <h3 className="text-white font-bold text-xl mb-3 group-hover:text-neon-pink transition-colors">PvP Challenges</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Wager XP on 1v1 habit duels. Challenge a friend to a 7-day meditation streak. Winner takes all.</p>
          </div>

           {/* Feature 3 */}
           <div className="bg-slate-900/40 p-8 rounded-3xl border border-slate-800 backdrop-blur-md hover:border-neon-green/50 transition-colors group">
            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap className="text-neon-green" size={24} />
            </div>
            <h3 className="text-white font-bold text-xl mb-3 group-hover:text-neon-green transition-colors">Squad Buffs</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Form a Tribe with 3 friends. If everyone hits their daily goals, the whole squad gets a 2x XP multiplier.</p>
          </div>
        </div>

        <div className="mt-16">
          <button onClick={onBack} className="px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform shadow-lg shadow-white/10">
            Notify Me When Ready
          </button>
        </div>

      </div>
    </div>
  );
};

export default SocialMode;