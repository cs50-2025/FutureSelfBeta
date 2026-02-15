import React, { useState, useEffect } from 'react';
import { generateStudyCurriculum, generateStudyLesson } from '../services/geminiService';
import { StudyCurriculum, StudyLesson, UserProfile, StudyProfile } from '../types';
import { BookOpen, GraduationCap, Briefcase, ArrowRight, Loader2, Clock, ChevronRight, Check, CheckCircle, HelpCircle } from 'lucide-react';

interface StudyModeProps {
  onBack: () => void;
  onComplete: (unitTitle: string) => void;
  currentUser: UserProfile | null;
  onUpdateUser: (updates: Partial<UserProfile>) => void;
}

const GRADES = ["Pre-K", "Kindergarten", "1st Grade", "2nd Grade", "3rd Grade", "4th Grade", "5th Grade", "6th Grade", "7th Grade", "8th Grade", "9th Grade", "10th Grade", "11th Grade", "12th Grade"];

const StudyMode: React.FC<StudyModeProps> = ({ onBack, onComplete, currentUser, onUpdateUser }) => {
  const [step, setStep] = useState<'role' | 'detail' | 'loading' | 'dashboard' | 'lesson'>('role');
  const [role, setRole] = useState<'School' | 'College' | 'Job'>('School');
  const [detail, setDetail] = useState('');
  
  const [curriculum, setCurriculum] = useState<StudyCurriculum | null>(null);
  const [activeUnit, setActiveUnit] = useState<string | null>(null);
  const [lesson, setLesson] = useState<StudyLesson | null>(null);
  const [lessonLoading, setLessonLoading] = useState(false);
  
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  // Interactive Glossary State
  const [activeTerm, setActiveTerm] = useState<{term: string, def: string, x: number, y: number} | null>(null);

  // Check for saved profile on mount
  useEffect(() => {
    if (currentUser?.studyProfile) {
      setRole(currentUser.studyProfile.role);
      setDetail(currentUser.studyProfile.detail);
      // Auto-generate if we have profile but no curriculum yet
      if (!curriculum && step === 'role') {
         generateCurriculum(currentUser.studyProfile.role, currentUser.studyProfile.detail);
      }
    }
  }, [currentUser]);

  const handleRoleSelect = (r: 'School' | 'College' | 'Job') => {
    setRole(r);
    setDetail('');
    if (r === 'School') setDetail('9th Grade');
    setStep('detail');
  };

  const generateCurriculum = async (selectedRole = role, selectedDetail = detail) => {
    if (!selectedDetail) return;
    setStep('loading');
    
    // Save profile if user exists and doesn't have one
    if (currentUser && !currentUser.studyProfile) {
      onUpdateUser({
        studyProfile: { role: selectedRole, detail: selectedDetail }
      });
    }

    const result = await generateStudyCurriculum(selectedRole, selectedDetail);
    if (result) {
      setCurriculum(result);
      setStep('dashboard');
    } else {
      setStep('detail');
      alert("Could not generate curriculum. Please try again.");
    }
  };

  const openLesson = async (unitTitle: string) => {
    setActiveUnit(unitTitle);
    setLessonLoading(true);
    setLesson(null);
    setStep('lesson');
    
    const context = `${role} - ${detail}`;
    const result = await generateStudyLesson(unitTitle, context);
    
    if (result) {
      setLesson(result);
      setQuizAnswers(new Array(result.quiz.length).fill(-1));
      setShowResults(false);
    }
    setLessonLoading(false);
  };

  const handleQuizAnswer = (qIndex: number, optionIndex: number) => {
    if (showResults) return;
    const newAnswers = [...quizAnswers];
    newAnswers[qIndex] = optionIndex;
    setQuizAnswers(newAnswers);
  };

  const checkQuiz = () => {
    setShowResults(true);
    if (activeUnit) onComplete(activeUnit);
  };

  // Helper to render explanation with clickable terms
  const renderInteractiveExplanation = (text: string, glossary?: Record<string, string>) => {
    if (!glossary) return <p className="text-sm text-slate-300">{text}</p>;

    const terms = Object.keys(glossary).sort((a, b) => b.length - a.length); // Match longest first
    if (terms.length === 0) return <p className="text-sm text-slate-300">{text}</p>;

    // Create a regex that matches terms case-insensitively
    const regex = new RegExp(`\\b(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
    
    const parts = text.split(regex);
    
    return (
      <p className="text-sm text-slate-300 leading-relaxed">
        {parts.map((part, i) => {
          const matchedKey = terms.find(t => t.toLowerCase() === part.toLowerCase());
          if (matchedKey) {
            return (
              <span 
                key={i} 
                className="glossary-term font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTerm({
                    term: matchedKey,
                    def: glossary[matchedKey],
                    x: e.clientX,
                    y: e.clientY
                  });
                }}
              >
                {part}
              </span>
            );
          }
          return part;
        })}
      </p>
    );
  };

  // Close popup on click outside
  useEffect(() => {
    const closePopup = () => setActiveTerm(null);
    window.addEventListener('click', closePopup);
    return () => window.removeEventListener('click', closePopup);
  }, []);

  if (step === 'role') {
    return (
      <div className="min-h-screen bg-[#050a14] p-6 flex flex-col items-center justify-center text-white">
         <button onClick={onBack} className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2 transition-colors"><ArrowRight className="rotate-180" /> Back</button>
        <div className="max-w-xl w-full text-center">
          <h1 className="text-4xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-purple">Personalized Path</h1>
          <p className="text-slate-400 mb-10">Select your current stage to build a custom curriculum.</p>
          <div className="grid gap-4">
            {[{id: 'School', icon: BookOpen, title: 'K-12 Student', sub: 'Pre-K through High School', color: 'text-neon-blue'},
              {id: 'College', icon: GraduationCap, title: 'College / University', sub: 'Undergraduate & Graduate', color: 'text-neon-purple'},
              {id: 'Job', icon: Briefcase, title: 'Professional / Career', sub: 'Upskilling for your job', color: 'text-neon-green'}].map((item: any) => (
              <button key={item.id} onClick={() => handleRoleSelect(item.id)} className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-neon-blue hover:shadow-neon-blue transition-all flex items-center gap-4 text-left group">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-slate-800 group-hover:bg-white/10 transition-colors ${item.color}`}>
                  <item.icon size={24} />
                </div>
                <div><h3 className="font-bold text-lg text-white group-hover:text-neon-blue transition-colors">{item.title}</h3><p className="text-sm text-slate-500">{item.sub}</p></div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'detail') {
    return (
      <div className="min-h-screen bg-[#050a14] p-6 flex flex-col items-center justify-center text-white">
        <button onClick={() => setStep('role')} className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2"><ArrowRight className="rotate-180" /> Back</button>
        <div className="max-w-md w-full">
           <div className="mb-8 text-center">
             <div className="w-16 h-16 mx-auto mb-4 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800 shadow-lg shadow-neon-blue/20">
               {role === 'School' && <BookOpen size={32} className="text-neon-blue" />}
               {role === 'College' && <GraduationCap size={32} className="text-neon-purple" />}
               {role === 'Job' && <Briefcase size={32} className="text-neon-green" />}
             </div>
             <h2 className="text-2xl font-bold">{role === 'School' ? "Which grade are you in?" : role === 'College' ? "What is your Major?" : "What is your Job Title?"}</h2>
           </div>
           <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
             {role === 'School' ? (
               <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                 {GRADES.map(g => <button key={g} onClick={() => setDetail(g)} className={`p-3 rounded-lg text-sm font-medium transition-colors ${detail === g ? 'bg-neon-blue text-black font-bold shadow-neon-blue' : 'bg-slate-800 hover:bg-slate-700'}`}>{g}</button>)}
               </div>
             ) : (
               <input type="text" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder={role === 'College' ? "e.g. Computer Science..." : "e.g. Marketing Manager..."} className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-all"/>
             )}
             <button onClick={() => generateCurriculum()} disabled={!detail} className="w-full mt-6 py-4 bg-neon-blue hover:bg-cyan-400 text-black rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-neon-blue">Start Learning <ArrowRight size={18} /></button>
           </div>
        </div>
      </div>
    );
  }

  if (step === 'loading') return <div className="min-h-screen bg-[#050a14] flex flex-col items-center justify-center text-white"><Loader2 size={48} className="animate-spin text-neon-blue mb-4" /><h2 className="text-xl font-bold">Building Curriculum...</h2><p className="text-slate-500">Designing modules for {detail}</p></div>;

  if (step === 'dashboard' && curriculum) {
    return (
      <div className="min-h-screen bg-[#050a14] flex flex-col text-white">
        <div className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 p-6 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div><div className="text-xs font-bold text-neon-blue uppercase tracking-widest mb-1">{detail} Curriculum</div><h1 className="text-2xl font-bold">{curriculum.title}</h1><p className="text-sm text-slate-400 truncate max-w-xl">{curriculum.description}</p></div>
            <button onClick={() => setStep('role')} className="text-sm font-medium text-slate-500 hover:text-white transition-colors">Change Path</button>
          </div>
        </div>
        <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {curriculum.units.map((unit, idx) => (
               <div key={idx} className="bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-neon-purple transition-all shadow-lg hover:shadow-neon-purple/20 group flex flex-col">
                 <div className="flex justify-between items-start mb-4"><div className="w-10 h-10 rounded-lg bg-slate-800 text-neon-purple flex items-center justify-center font-bold border border-slate-700">{idx + 1}</div><div className="text-xs font-medium text-slate-400 flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-full"><Clock size={12} /> {unit.estimatedTime}</div></div>
                 <h3 className="font-bold text-lg mb-2 text-white group-hover:text-neon-purple transition-colors">{unit.title}</h3>
                 <p className="text-sm text-slate-400 mb-6 flex-1">{unit.description}</p>
                 <button onClick={() => openLesson(unit.title)} className="w-full py-2 bg-slate-800 hover:bg-neon-purple hover:text-white text-slate-300 rounded-xl font-medium transition-all flex items-center justify-center gap-2">Start Lesson <ChevronRight size={16} /></button>
               </div>
             ))}
           </div>
        </div>
      </div>
    );
  }

  if (step === 'lesson') {
    return (
      <div className="min-h-screen bg-[#050a14] text-white flex flex-col">
         {/* Tooltip Popup */}
         {activeTerm && (
            <div 
              className="fixed z-50 bg-slate-900 border border-neon-blue p-4 rounded-xl shadow-neon-blue max-w-xs animate-in zoom-in duration-200"
              style={{ top: activeTerm.y + 10, left: Math.min(activeTerm.x, window.innerWidth - 320) }}
            >
              <h4 className="font-bold text-neon-blue mb-1">{activeTerm.term}</h4>
              <p className="text-sm text-slate-300">{activeTerm.def}</p>
            </div>
         )}

         <div className="h-16 border-b border-slate-800 flex items-center px-4 md:px-8 justify-between sticky top-0 bg-[#050a14]/90 backdrop-blur-md z-20">
           <button onClick={() => setStep('dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white font-medium transition-colors"><ArrowRight className="rotate-180" size={20} /> <span className="hidden md:inline">Back to Curriculum</span></button>
           <div className="font-bold text-neon-blue truncate max-w-xs">{activeUnit}</div><div className="w-8"></div>
         </div>
         <div className="flex-1 max-w-3xl mx-auto w-full p-6 md:p-10">
           {lessonLoading ? <div className="py-20 flex flex-col items-center justify-center"><Loader2 size={40} className="animate-spin text-neon-blue mb-4" /><p className="text-slate-500">Generating lesson content...</p></div> : lesson ? (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="prose prose-invert prose-lg max-w-none mb-12">
                 <h1 className="text-3xl md:text-4xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple">{lesson.title}</h1>
                 <div className="whitespace-pre-wrap leading-relaxed text-slate-300">
                   {lesson.content.split('\n').map((line, i) => { 
                     if (line.startsWith('# ')) return <h2 key={i} className="text-2xl font-bold mt-8 mb-4 text-neon-blue">{line.replace('# ', '')}</h2>; 
                     if (line.startsWith('## ')) return <h3 key={i} className="text-xl font-bold mt-6 mb-3 text-neon-purple">{line.replace('## ', '')}</h3>; 
                     if (line.startsWith('- ')) return <li key={i} className="ml-4 text-slate-400 marker:text-neon-pink">{line.replace('- ', '')}</li>; 
                     return <p key={i} className="mb-4">{line.replace(/\*\*(.*?)\*\*/g, (_, p1) => p1)}</p>; 
                   })}
                 </div>
               </div>
               <hr className="my-10 border-slate-800" />
               <div className="bg-slate-900/50 rounded-3xl p-6 md:p-8 border border-slate-800">
                 <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-neon-green"><CheckCircle className="text-neon-green" /> Knowledge Check</h3>
                 <div className="space-y-8">
                   {lesson.quiz.map((q, qIdx) => (
                     <div key={qIdx} className="bg-[#050a14] p-6 rounded-2xl border border-slate-800">
                       <p className="font-semibold text-lg mb-4 text-white">{qIdx + 1}. {q.question}</p>
                       <div className="space-y-3">
                         {q.options.map((opt, optIdx) => {
                           const isSelected = quizAnswers[qIdx] === optIdx;
                           const isCorrect = q.correctIndex === optIdx;
                           let btnClass = "border-slate-800 hover:bg-slate-800 text-slate-300";
                           if (showResults) {
                             if (isCorrect) btnClass = "bg-neon-green/20 border-neon-green text-neon-green font-bold";
                             else if (isSelected) btnClass = "bg-neon-pink/20 border-neon-pink text-neon-pink";
                           } else if (isSelected) btnClass = "border-neon-blue bg-neon-blue/20 text-neon-blue ring-1 ring-neon-blue font-bold";
                           return <button key={optIdx} onClick={() => handleQuizAnswer(qIdx, optIdx)} disabled={showResults} className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${btnClass}`}><span>{opt}</span>{showResults && isCorrect && <Check size={20} className="text-neon-green" />}</button>;
                         })}
                       </div>
                       {showResults && (
                         <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-700">
                           <div className="flex items-center gap-2 text-neon-yellow font-bold text-sm mb-1">
                             <HelpCircle size={14} /> Explanation (Click highlighted terms)
                           </div>
                           {renderInteractiveExplanation(q.explanation, q.glossary)}
                         </div>
                       )}
                     </div>
                   ))}
                 </div>
                 {!showResults ? <button onClick={checkQuiz} disabled={quizAnswers.includes(-1)} className="w-full mt-8 py-4 bg-neon-blue hover:bg-cyan-400 text-black rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-neon-blue">Submit Quiz</button> : <div className="mt-8 text-center p-6 bg-neon-green/10 rounded-2xl border border-neon-green/30"><h4 className="text-2xl font-bold text-neon-green mb-2">Lesson Complete!</h4><p className="text-emerald-200 mb-6">Stats Updated: +Intelligence +Discipline</p><button onClick={() => setStep('dashboard')} className="px-8 py-3 bg-neon-green hover:bg-green-400 text-black rounded-xl font-bold shadow-neon-green">Next Unit</button></div>}
               </div>
             </div>
           ) : <div className="text-center text-neon-pink">Failed to load lesson. Please try again.</div>}
         </div>
      </div>
    );
  }

  return null;
};

export default StudyMode;
