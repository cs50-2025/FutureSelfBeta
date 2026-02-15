import React, { useState } from 'react';
import { UserHabits, SimulationMetrics } from '../types';
import { generateFutureMessage } from '../services/geminiService';
import { MessageSquare, Loader2, Sparkles } from 'lucide-react';

interface FutureMessageProps {
  habits: UserHabits;
  metrics: SimulationMetrics;
}

const FutureMessage: React.FC<FutureMessageProps> = ({ habits, metrics }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await generateFutureMessage(habits, metrics);
      setMessage(result);
    } catch (e) {
      setMessage("Connection to the future interrupted.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-6 relative overflow-hidden">
      
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
      
      <div className="relative z-10">
        <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          Message from Your Future Self (2029)
        </h3>
        
        {!message && !loading && (
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Unlock a personalized reflection based on your current trajectory. 
            See what your future self thinks about your habits.
          </div>
        )}

        {message && (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 mb-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <p className="text-slate-800 dark:text-slate-200 italic leading-relaxed text-sm md:text-base font-medium">
              "{message}"
            </p>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`
            w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all
            ${loading 
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-[0.98]'
            }
          `}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Establishing Temporal Link...
            </>
          ) : (
            <>
              <MessageSquare className="w-4 h-4" />
              {message ? 'Regenerate Message' : 'Generate Message'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FutureMessage;