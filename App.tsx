import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import TrainingMode from './components/TrainingMode';
import MeditationMode from './components/MeditationMode';
import PersonalAssistant from './components/PersonalAssistant';
import StudyMode from './components/StudyMode';
import SocialMode from './components/SocialMode';
import AnalyticsMode from './components/AnalyticsMode';
import AuthOverlay from './components/AuthOverlay';
import ProfileEditor from './components/ProfileEditor';
import { UserHabits, UserProfile, UserStats, ActivityLog } from './types';
import { updateUser } from './services/authService';
import { Dumbbell, LayoutDashboard, Activity, Moon, Sun, Flower2, Bot, BookOpen, Users, User, LogOut, Edit3, Image as ImageIcon, Menu, X, BarChart2, Zap } from 'lucide-react';

type View = 'dashboard' | 'analytics' | 'training' | 'meditation' | 'assistant' | 'study' | 'social' | 'profile-name' | 'profile-icon';

// --- LANDING PAGE COMPONENT (For mandatory auth) ---
const LandingPage = ({ onLoginClick }: { onLoginClick: () => void }) => {
  return (
    <div className="min-h-screen bg-[#050a14] flex flex-col items-center justify-center relative overflow-hidden font-sans">
       {/* Background Effects */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon-blue/5 rounded-full blur-[100px]"></div>
       <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-neon-purple/5 rounded-full blur-[80px]"></div>
       
       <div className="relative z-10 text-center px-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-full border border-slate-800 mb-8 backdrop-blur-md">
             <span className="relative flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-green"></span>
             </span>
             <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">AI Coach Online</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tight leading-none">
            FUTURE<span className="text-neon-blue">SELF</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            The AI-powered behavioral trajectory simulator. Visualize the long-term impact of your daily habits and train your mind and body.
          </p>
          
          <button 
            onClick={onLoginClick}
            className="group relative px-10 py-5 bg-white text-black font-bold text-lg rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-all"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-neon-blue via-white to-neon-purple opacity-0 group-hover:opacity-20 transition-opacity"></div>
            <span className="relative flex items-center gap-3">
               Start Journey <User size={20} />
            </span>
          </button>
          
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center opacity-60">
             <div><div className="font-bold text-white text-xl">Study</div><div className="text-xs text-slate-500">Adaptive Plans</div></div>
             <div><div className="font-bold text-white text-xl">Train</div><div className="text-xs text-slate-500">AI Form Check</div></div>
             <div><div className="font-bold text-white text-xl">Meditate</div><div className="text-xs text-slate-500">Mindfulness</div></div>
             <div><div className="font-bold text-white text-xl">Grow</div><div className="text-xs text-slate-500">Level Up Stats</div></div>
          </div>
       </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false); // Can trigger overlay
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  
  // Lifted State for Dashboard Simulation
  const [darkMode, setDarkMode] = useState(true);
  const [habits, setHabits] = useState<UserHabits>({
    sleepHours: 7,
    studyHours: 10,
    screenTime: 4,
    exerciseDays: 3,
    stressLevel: 5
  });

  // Always force dark mode for Neon theme consistency
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleUpdateUser = (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = updateUser(currentUser.id, updates);
    setCurrentUser(updated);
  };

  // -- ACTIVITY COMPLETION HANDLER --
  const handleActivityComplete = (type: 'study' | 'workout' | 'meditate', description: string) => {
    if (!currentUser) return;

    const stats = { ...currentUser.stats };
    const xpGain = type === 'study' ? 50 : type === 'workout' ? 60 : 40;
    
    // 1. Update Cumulative Stats
    stats.xp += xpGain;
    
    // Level Up Logic
    const nextLevelXp = stats.level * 100;
    if (stats.xp >= nextLevelXp) {
      stats.level += 1;
      stats.xp = stats.xp - nextLevelXp;
      // Could trigger a toast here: "Level Up!"
      alert(`LEVEL UP! You are now Level ${stats.level}`);
    }

    // Stat Growth
    if (type === 'study') {
      stats.totalStudySessions += 1;
      stats.intelligence = Math.min(100, stats.intelligence + 5);
      stats.discipline = Math.min(100, stats.discipline + 2);
    } else if (type === 'workout') {
      stats.totalWorkouts += 1;
      stats.strength = Math.min(100, stats.strength + 5);
      stats.vitality = Math.min(100, stats.vitality + 3);
    } else if (type === 'meditate') {
      stats.totalMeditations += 1;
      stats.peace = Math.min(100, stats.peace + 5);
      // Reduce stress (Starts at 10, min 0)
      stats.currentStress = Math.max(0, stats.currentStress - 2); 
    }

    // 2. Add Log
    const newLog: ActivityLog = {
      id: crypto.randomUUID(),
      type,
      description,
      timestamp: Date.now(),
      xpEarned: xpGain
    };

    const updatedUser = {
      ...currentUser,
      stats,
      activityLog: [...(currentUser.activityLog || []), newLog]
    };

    // 3. Persist
    setCurrentUser(updatedUser);
    updateUser(updatedUser.id, { stats, activityLog: updatedUser.activityLog });
  };


  const handleNavClick = (view: View) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  const NavLink = ({ view, label, icon: Icon }: { view: View, label: string, icon: any }) => (
    <button 
      onClick={() => handleNavClick(view)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all ${
        currentView === view 
          ? 'bg-neon-blue text-black shadow-lg shadow-neon-blue/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  // --- FORCE AUTHENTICATION CHECK ---
  if (!currentUser) {
    return (
      <>
        {showAuthModal && (
          <AuthOverlay 
            onClose={() => setShowAuthModal(false)} 
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              setShowAuthModal(false);
            }} 
          />
        )}
        <LandingPage onLoginClick={() => setShowAuthModal(true)} />
      </>
    );
  }

  // --- MAIN APP (Only renders if currentUser exists) ---
  return (
    <div className="min-h-screen bg-[#050a14] text-slate-100 font-sans transition-colors duration-300 flex flex-col">
      
      {/* Auth Modal (For consistency if re-triggered) */}
      {showAuthModal && (
        <AuthOverlay 
          onClose={() => setShowAuthModal(false)} 
          onLoginSuccess={(user) => setCurrentUser(user)}
        />
      )}

      {/* TOP NAVIGATION BAR */}
      <nav className="sticky top-0 z-50 w-full bg-[#050a14]/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2 font-bold text-xl text-white cursor-pointer" onClick={() => setCurrentView('dashboard')}>
            <div className="w-8 h-8 bg-neon-blue rounded-lg flex items-center justify-center text-black shadow-lg shadow-neon-blue/20">
              <Activity size={18} />
            </div>
            <span className="tracking-tight">Future<span className="text-neon-blue">Self</span></span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink view="dashboard" label="Dashboard" icon={LayoutDashboard} />
            <NavLink view="analytics" label="Analytics" icon={BarChart2} />
            <NavLink view="study" label="Study" icon={BookOpen} />
            <NavLink view="training" label="Training" icon={Dumbbell} />
            <NavLink view="meditation" label="Meditate" icon={Flower2} />
            <NavLink view="assistant" label="AI Coach" icon={Bot} />
            <NavLink view="social" label="Social" icon={Users} />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
              {/* User Profile Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 bg-slate-800 rounded-full border border-slate-700 hover:border-neon-blue transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden border border-slate-600">
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={16} /></div>
                    )}
                  </div>
                  {/* Level Badge Mini */}
                  <div className="absolute -bottom-1 -right-1 bg-neon-yellow text-black text-[10px] font-bold px-1.5 rounded-full border border-slate-900">
                    {currentUser.stats.level}
                  </div>
                  <span className="text-sm font-semibold hidden lg:block ml-1">{currentUser.firstName}</span>
                </button>

                {/* Dropdown */}
                {isProfileDropdownOpen && (
                   <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900 rounded-2xl shadow-xl shadow-black/50 border border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right z-50">
                     <div className="p-3 border-b border-slate-800">
                        <p className="text-sm font-bold text-white">{currentUser.firstName} {currentUser.lastName}</p>
                        <p className="text-xs text-slate-500">Lvl {currentUser.stats.level} • {currentUser.stats.xp} XP</p>
                     </div>
                     <div className="p-2 space-y-1">
                       <button onClick={() => { setCurrentView('profile-icon'); setIsProfileDropdownOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-sm font-medium flex items-center gap-2 text-slate-300 hover:text-white"><ImageIcon size={14} /> Change Icon</button>
                       <button onClick={() => { setCurrentView('profile-name'); setIsProfileDropdownOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-sm font-medium flex items-center gap-2 text-slate-300 hover:text-white"><Edit3 size={14} /> Change Name</button>
                       <div className="h-px bg-slate-800 my-1"></div>
                       <button onClick={() => { setCurrentUser(null); setIsProfileDropdownOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-900/20 text-rose-500 text-sm font-medium flex items-center gap-2"><LogOut size={14} /> Sign Out</button>
                     </div>
                   </div>
                 )}
              </div>

              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-slate-300 hover:bg-slate-800 rounded-lg"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-[#050a14] p-4 space-y-2 animate-in slide-in-from-top-2">
            <NavLink view="dashboard" label="Dashboard" icon={LayoutDashboard} />
            <NavLink view="analytics" label="Analytics" icon={BarChart2} />
            <NavLink view="study" label="Study" icon={BookOpen} />
            <NavLink view="training" label="Training" icon={Dumbbell} />
            <NavLink view="meditation" label="Meditate" icon={Flower2} />
            <NavLink view="assistant" label="AI Coach" icon={Bot} />
            <NavLink view="social" label="Social" icon={Users} />
          </div>
        )}
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full max-w-7xl mx-auto pt-6">
          {currentView === 'dashboard' ? (
            <Dashboard 
              habits={habits} 
              setHabits={setHabits} 
              darkMode={darkMode}
              toggleDarkMode={() => setDarkMode(!darkMode)}
            />
          ) : currentView === 'analytics' ? (
            <AnalyticsMode 
              currentUser={currentUser}
            />
          ) : currentView === 'training' ? (
            <TrainingMode 
              onBack={() => setCurrentView('dashboard')} 
              onComplete={(sport) => handleActivityComplete('workout', `Completed ${sport} session`)}
            />
          ) : currentView === 'meditation' ? (
            <MeditationMode 
              onBack={() => setCurrentView('dashboard')} 
              onComplete={(mins) => handleActivityComplete('meditate', `${mins}m Meditation`)}
              currentUser={currentUser}
            />
          ) : currentView === 'study' ? (
            <StudyMode 
              onBack={() => setCurrentView('dashboard')} 
              onComplete={(lesson) => handleActivityComplete('study', `Learned ${lesson}`)}
              currentUser={currentUser}
              onUpdateUser={handleUpdateUser}
            />
          ) : currentView === 'social' ? (
            <SocialMode 
              currentUser={currentUser} 
              onOpenAuth={() => setShowAuthModal(true)} 
              onBack={() => setCurrentView('dashboard')}
            />
          ) : currentView === 'profile-name' && currentUser ? (
            <ProfileEditor 
              mode="name" 
              currentUser={currentUser} 
              onUpdate={setCurrentUser} 
              onBack={() => setCurrentView('dashboard')} 
            />
          ) : currentView === 'profile-icon' && currentUser ? (
             <ProfileEditor 
              mode="icon" 
              currentUser={currentUser} 
              onUpdate={setCurrentUser} 
              onBack={() => setCurrentView('dashboard')} 
            />
          ) : (
            <PersonalAssistant 
              onBack={() => setCurrentView('dashboard')} 
              currentUser={currentUser}
            />
          )}
      </main>
    </div>
  );
};

export default App;