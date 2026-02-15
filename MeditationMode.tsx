import React, { useState, useEffect, useRef } from 'react';
import { generateYogaPlan, analyzeYogaPerformance, generatePoseImage, YogaResponse, PerformanceAnalysis } from '../services/geminiService';
import { UserProfile } from '../types';
import { ArrowRight, Loader2, Play, Pause, Heart, Wind, Flower2, Image as ImageIcon, CheckCircle, Camera, Trophy, X, Zap, Youtube } from 'lucide-react';

interface MeditationModeProps {
  onBack: () => void;
  onComplete: (durationMinutes: number) => void;
  currentUser: UserProfile | null;
}

const FOCUS_AREAS = [
  { id: 'Stress Relief', icon: '🍃' },
  { id: 'Better Sleep', icon: '🌙' },
  { id: 'Focus & Clarity', icon: '👁️' },
  { id: 'Flexibility', icon: '🤸' },
  { id: 'Morning Energy', icon: '☀️' },
  { id: 'Anxiety Release', icon: '🌊' },
];

// --- MINI GAME: ZEN DUEL (PONG CLONE) ---
const ZenDuelGame = ({ onEnd }: { onEnd: (result: 'win' | 'lose') => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef({ user: 0, ai: 0 });
  const [scores, setScores] = useState({ user: 0, ai: 0 });
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let ball = { x: 150, y: 200, dx: 3, dy: 3 };
    let userX = 120;
    let aiX = 120;
    const P_W = 60;
    const P_H = 10;
    
    const reset = () => {
       ball = { x: 150, y: 200, dx: (Math.random() > 0.5 ? 3 : -3), dy: (Math.random() > 0.5 ? 3 : -3) };
    };

    const loop = () => {
       ball.x += ball.dx;
       ball.y += ball.dy;

       if (ball.x < 0 || ball.x > canvas.width) ball.dx = -ball.dx;

       // AI (Slightly slower than Training Mode AI to be "Zen")
       const aiCenter = aiX + P_W / 2;
       if (ball.x > aiCenter + 10) aiX += 2.5;
       else if (ball.x < aiCenter - 10) aiX -= 2.5;
       aiX = Math.max(0, Math.min(canvas.width - P_W, aiX));

       // User Hit
       if (ball.y + 5 > canvas.height - 20 && ball.x > userX && ball.x < userX + P_W) {
          ball.dy = -Math.abs(ball.dy);
       }

       // AI Hit
       if (ball.y - 5 < 20 && ball.x > aiX && ball.x < aiX + P_W) {
          ball.dy = Math.abs(ball.dy);
       }

       // Score
       if (ball.y > canvas.height) {
          scoreRef.current.ai += 1;
          setScores({ ...scoreRef.current });
          reset();
       } else if (ball.y < 0) {
          scoreRef.current.user += 1;
          setScores({ ...scoreRef.current });
          reset();
       }

       if (scoreRef.current.user >= 3) { onEnd('win'); return; }
       if (scoreRef.current.ai >= 3) { onEnd('lose'); return; }

       // Draw
       ctx.fillStyle = '#050a14';
       ctx.fillRect(0, 0, canvas.width, canvas.height);
       
       ctx.strokeStyle = '#bc13fe';
       ctx.lineWidth = 2;
       ctx.beginPath(); ctx.arc(150, 200, 50, 0, Math.PI*2); ctx.stroke();

       ctx.fillStyle = '#ff00ff'; // AI
       ctx.fillRect(aiX, 10, P_W, P_H);
       
       ctx.fillStyle = '#0aff00'; // User
       ctx.fillRect(userX, canvas.height - 20, P_W, P_H);

       ctx.beginPath(); ctx.arc(ball.x, ball.y, 6, 0, Math.PI*2);
       ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 10; ctx.shadowColor = '#fff'; ctx.fill(); ctx.shadowBlur = 0;

       requestRef.current = requestAnimationFrame(loop);
    };

    const movePaddle = (clientX: number) => {
       const rect = canvas.getBoundingClientRect();
       const x = clientX - rect.left;
       userX = Math.max(0, Math.min(canvas.width - P_W, x - P_W/2));
    };
    
    const onTouch = (e: TouchEvent) => movePaddle(e.touches[0].clientX);
    const onMouse = (e: MouseEvent) => movePaddle(e.clientX);

    canvas.addEventListener('touchmove', onTouch, { passive: false });
    canvas.addEventListener('mousemove', onMouse);

    loop();

    return () => {
       if (requestRef.current) cancelAnimationFrame(requestRef.current);
       canvas.removeEventListener('touchmove', onTouch);
       canvas.removeEventListener('mousemove', onMouse);
    }
  }, []);

  return (
    <div className="flex flex-col items-center w-full animate-in zoom-in duration-300">
      <div className="flex justify-between w-full px-8 mb-4 font-serif font-bold text-2xl">
         <span className="text-neon-pink">Saboteur: {scores.ai}</span>
         <span className="text-neon-green">You: {scores.user}</span>
      </div>
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={400} 
        className="w-full max-w-[300px] h-auto bg-slate-900 rounded-full border-4 border-neon-purple shadow-2xl cursor-none touch-none"
      />
      <p className="text-slate-400 text-sm mt-4 animate-pulse">Deflect negative energy. First to 3.</p>
    </div>
  );
};

const MeditationMode: React.FC<MeditationModeProps> = ({ onBack, onComplete, currentUser }) => {
  const [focus, setFocus] = useState<string>('');
  const [mode, setMode] = useState<'selection' | 'briefing' | 'active'>('selection');
  
  // Session Data
  const [plan, setPlan] = useState<YogaResponse | null>(null);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  
  // Images Dictionary
  const [poseImages, setPoseImages] = useState<Record<number, string>>({});
  
  const [totalExp, setTotalExp] = useState(0);

  // State
  const [sessionState, setSessionState] = useState<'idle' | 'recording' | 'analyzing' | 'feedback'>('idle');
  const [lastAnalysis, setLastAnalysis] = useState<PerformanceAnalysis | null>(null);
  
  // Game State
  const [showChallenge, setShowChallenge] = useState(false);
  const [isPlayingGame, setIsPlayingGame] = useState(false);
  const [challengeResult, setChallengeResult] = useState<'win' | 'lose' | null>(null);

  // Video
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [loading, setLoading] = useState(false);

  // --- VOICE ENGINE (Softer) ---
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slower for zen
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes('Google US English') || v.lang === 'en-US');
      if (preferred) utterance.voice = preferred;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleFocusSelect = async (selectedFocus: string) => {
    setFocus(selectedFocus);
    setLoading(true);
    try {
      const data = await generateYogaPlan(selectedFocus);
      if (data) {
        setPlan(data);
        setMode('briefing');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    setMode('active');
    setSessionState('idle');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      console.error("Camera denied", e);
    }
    speak(`Breathe in. Let's begin with ${plan?.selected_poses[0].name}.`);
  };

  // --- PRE-FETCH IMAGES (OPTIMIZATION) ---
  useEffect(() => {
    if (plan && mode === 'briefing') {
      plan.selected_poses.forEach((pose, index) => {
        if (!poseImages[index]) {
          generatePoseImage(pose.name).then(img => {
            if (img) {
              setPoseImages(prev => ({ ...prev, [index]: img }));
            }
          });
        }
      });
    }
  }, [plan, mode]);

  const openYouTubeDemo = () => {
    if (!plan) return;
    const poseName = plan.selected_poses[currentPoseIndex].name;
    const query = encodeURIComponent(`${poseName} yoga pose demonstration`);
    window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
  };

  const startRecordingClip = () => {
    setSessionState('recording');
    setRecordingTime(8); 
    setTimeout(() => {
      speak("Hold the pose. Breathe deeply.");
    }, 3000);
  };

  useEffect(() => {
    if (sessionState !== 'recording') return;
    const interval = setInterval(() => {
      setRecordingTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          finishRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionState]);

  const finishRecording = async () => {
    setSessionState('analyzing');
    if (!plan) return;
    const analysis = await analyzeYogaPerformance(focus, plan.selected_poses[currentPoseIndex].name);
    setLastAnalysis(analysis);
    setTotalExp(e => e + analysis.exp_earned);
    setSessionState('feedback');
    speak(analysis.coach_message);
  };

  const nextPose = () => {
    // Challenge Trigger after 2nd pose
    if (currentPoseIndex === 1 && !challengeResult) {
      setShowChallenge(true);
      speak("A distraction appears. Defeat your inner saboteur in a duel to regain focus.");
      return;
    }

    if (!plan) return;
    if (currentPoseIndex < plan.selected_poses.length - 1) {
      setCurrentPoseIndex(prev => prev + 1);
      setSessionState('idle');
      setLastAnalysis(null);
      speak(`Next movement: ${plan.selected_poses[currentPoseIndex + 1].name}.`);
    } else {
      finishWorkout();
    }
  };

  const finishWorkout = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
    }
    onComplete(15);
  };

  // --- ZEN DUEL LOGIC ---
  const playGame = () => {
    setIsPlayingGame(true);
    speak("Deflect the negative energy. First to 3.");
  };

  const handleGameEnd = (result: 'win' | 'lose') => {
    setIsPlayingGame(false);
    setChallengeResult(result);
    if (result === 'win') {
      setTotalExp(e => e + 100);
      speak("You have cleared your mind. Excellent focus.");
    } else {
      speak("Distractions happen. Return to your breath.");
    }
  };

  const closeChallenge = () => {
    setShowChallenge(false);
    if (challengeResult === 'win') {
      finishWorkout(); // Skip remaining if won
    } else {
      setCurrentPoseIndex(2);
      setSessionState('idle');
      setLastAnalysis(null);
    }
  };

  // --- VISUAL LOOP ---
  useEffect(() => {
    if (mode !== 'active') return;
    let animId: number;
    const draw = () => {
      if (!canvasRef.current || !videoRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      const w = canvasRef.current.width = videoRef.current.videoWidth || 300;
      const h = canvasRef.current.height = videoRef.current.videoHeight || 150;
      ctx.clearRect(0,0,w,h);
      
      if (sessionState === 'recording') {
        // Soft aura effect instead of sci-fi scan
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff00ff';
        const time = Date.now() / 1000;
        const scale = 1 + Math.sin(time) * 0.05;
        
        ctx.beginPath();
        ctx.ellipse(w/2, h/2, (h/2.5)*scale, (h/2)*scale, 0, 0, Math.PI*2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [mode, sessionState]);


  if (loading) {
     return <div className="min-h-screen bg-[#050a14] flex flex-col items-center justify-center text-white"><Loader2 size={48} className="animate-spin text-neon-pink mb-4" /><h2 className="text-xl font-bold">Designing Flow...</h2></div>;
  }

  // 1. BRIEFING
  if (mode === 'briefing' && plan) {
    return (
      <div className="min-h-screen bg-[#050a14] p-6 text-white flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full">
           <div className="text-center mb-8">
             <h1 className="text-4xl font-serif font-bold mb-2 text-neon-pink">{plan.focus} Flow</h1>
             <p className="text-slate-400">{plan.purpose}</p>
           </div>
           
           <div className="space-y-4 mb-8">
             {plan.selected_poses.map((pose, idx) => (
               <div key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
                 <div className="w-8 h-8 rounded-full bg-slate-800 text-neon-pink flex items-center justify-center font-bold border border-slate-700">{idx+1}</div>
                 <div>
                   <div className="font-bold text-lg">{pose.name}</div>
                   <div className="text-xs text-slate-500">{pose.instruction}</div>
                 </div>
               </div>
             ))}
           </div>

           <button onClick={startSession} className="w-full py-4 bg-neon-pink hover:bg-fuchsia-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-neon-pink/20">
             <Flower2 size={20} /> Begin Session
           </button>
        </div>
      </div>
    );
  }

  // 2. ACTIVE
  if (mode === 'active' && plan) {
    const pose = plan.selected_poses[currentPoseIndex];
    const currentImage = poseImages[currentPoseIndex];

    return (
      <div className="min-h-screen bg-[#050a14] text-white flex flex-col relative overflow-hidden font-serif">
        
        {/* HEADER */}
        <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center z-10 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-neon-pink rounded-lg flex items-center justify-center text-white font-bold shadow-neon-pink">
               {currentPoseIndex + 1}/4
             </div>
             <div>
               <h2 className="font-bold text-lg leading-tight">{pose.name}</h2>
               <p className="text-xs text-slate-400">Target: {pose.duration}</p>
             </div>
          </div>
          <div className="text-right">
             <div className="text-xs text-slate-500 font-bold uppercase">Zen EXP</div>
             <div className="text-2xl font-black text-neon-purple">{totalExp}</div>
          </div>
        </div>

        {/* SPLIT SCREEN MAIN CONTENT */}
        <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 relative overflow-hidden">
           
           {/* LEFT: VISUAL GUIDE */}
           <div className="flex-1 flex flex-col justify-center items-center bg-slate-900/50 rounded-3xl border border-slate-800 relative overflow-hidden">
             <div className="w-full h-full flex items-center justify-center p-6 relative">
                 {currentImage ? (
                   <>
                    <img src={currentImage} alt={pose.name} className="max-w-full max-h-full object-contain animate-in fade-in" />
                    <button 
                       onClick={openYouTubeDemo}
                       className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-red-600 text-white/80 hover:text-white rounded-full backdrop-blur-md transition-all border border-white/10"
                       title="Watch video demonstration"
                     >
                       <Youtube size={20} />
                     </button>
                   </>
                 ) : (
                   <div className="flex flex-col items-center justify-center w-full h-full">
                     <div className="flex flex-col items-center text-slate-500 mb-3">
                       <Loader2 className="animate-spin mb-2 text-neon-pink" />
                       <span className="text-xs font-sans">Visualizing Pose...</span>
                     </div>
                     <button 
                        onClick={openYouTubeDemo}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-red-950/30 border border-slate-700 hover:border-red-900/50 rounded-lg text-xs font-bold text-slate-400 hover:text-red-400 transition-all"
                     >
                        <Youtube size={14} /> Watch Demo Instead
                     </button>
                   </div>
                 )}
             </div>
             <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
               <p className="text-center text-lg md:text-xl font-medium text-slate-200 font-sans">{pose.instruction}</p>
             </div>
           </div>

           {/* RIGHT: USER CAMERA (LARGE) */}
           <div className="flex-1 relative bg-black rounded-3xl border-2 border-slate-700 overflow-hidden shadow-2xl">
              <video ref={videoRef} className="w-full h-full object-cover transform scale-x-[-1]" playsInline muted />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
              
              <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-2 backdrop-blur-md font-sans">
                <div className={`w-3 h-3 rounded-full ${sessionState === 'recording' ? 'bg-neon-pink animate-pulse' : 'bg-green-500'}`}></div>
                {sessionState === 'recording' ? 'RECORDING' : 'LIVE FEED'}
              </div>

               {/* ACTION BUTTONS OVERLAY */}
               <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20">
                 {sessionState === 'feedback' ? (
                   <button onClick={nextPose} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-slate-200 flex items-center gap-2 shadow-lg shadow-white/20 font-sans">
                      {currentPoseIndex < 3 ? 'Next Pose' : 'Finish'} <ArrowRight size={18} />
                   </button>
                 ) : sessionState === 'recording' ? (
                   <div className="w-20 h-20 rounded-full border-4 border-neon-pink flex items-center justify-center animate-pulse bg-black/50 backdrop-blur-sm">
                     <span className="text-3xl font-black text-neon-pink font-sans">{recordingTime}</span>
                   </div>
                 ) : sessionState === 'analyzing' ? (
                   <div className="px-6 py-3 bg-black/80 rounded-full text-white flex items-center gap-2 border border-slate-700 font-sans">
                     <Loader2 className="animate-spin text-neon-purple" /> Sensing Energy...
                   </div>
                 ) : (
                   <button onClick={startRecordingClip} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-bold shadow-lg border border-slate-700 font-sans transition-all flex items-center gap-3">
                     <div className="w-4 h-4 bg-neon-pink rounded-full animate-pulse"></div> Analyze Pose (8s)
                   </button>
                 )}
              </div>
           </div>

           {/* FEEDBACK OVERLAY (CENTERED) */}
           {sessionState === 'feedback' && lastAnalysis && (
             <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
               <div className="max-w-md w-full bg-slate-900 border-2 border-neon-purple rounded-3xl p-6 shadow-[0_0_50px_rgba(188,19,254,0.2)]">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-neon-purple/20 rounded-full text-neon-purple">
                      <CheckCircle size={32} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-white">Insight</h3>
                      <p className="text-neon-purple font-bold">Harmony: {lastAnalysis.score}/100</p>
                    </div>
                  </div>
                  
                  <div className="bg-black/40 p-4 rounded-xl mb-4 border border-white/5">
                    <p className="text-slate-300 italic">"{lastAnalysis.coach_message}"</p>
                  </div>

                  <button onClick={nextPose} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 flex items-center justify-center gap-2 font-sans">
                     Continue <ArrowRight size={18} />
                  </button>
               </div>
             </div>
           )}

        </div>

        {showChallenge && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
             <div className="max-w-md w-full bg-slate-900 border-2 border-neon-pink rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(255,0,255,0.3)] flex flex-col items-center">
               
               {isPlayingGame ? (
                 <ZenDuelGame onEnd={handleGameEnd} />
               ) : !challengeResult ? (
                 <>
                   <div className="w-20 h-20 bg-neon-pink/20 rounded-full flex items-center justify-center mx-auto mb-6">
                     <Zap size={40} className="text-neon-pink" />
                   </div>
                   <h2 className="text-3xl font-black text-white mb-2 font-sans">ZEN DUEL</h2>
                   <p className="text-slate-300 mb-8 font-sans">
                     Defeat the Inner Saboteur (AI) in a match of focus. Win to instantly clear your mind and gain <span className="text-neon-yellow font-bold">+100 EXP</span>.
                   </p>
                   <div className="grid grid-cols-2 gap-4 w-full font-sans">
                     <button onClick={() => { setShowChallenge(false); nextPose(); }} className="py-3 bg-slate-800 text-slate-400 font-bold rounded-xl hover:bg-slate-700">Decline</button>
                     <button onClick={playGame} className="py-3 bg-neon-pink text-white font-bold rounded-xl hover:bg-fuchsia-600 shadow-lg shadow-neon-pink/30">START MATCH</button>
                   </div>
                 </>
               ) : (
                 <>
                   <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                     {challengeResult === 'win' ? <Trophy size={40} className="text-neon-yellow" /> : <X size={40} className="text-red-500" />}
                   </div>
                   <h2 className="text-3xl font-black text-white mb-2 font-sans">{challengeResult === 'win' ? 'CLARITY ACHIEVED' : 'TRY AGAIN'}</h2>
                   <p className="text-slate-300 mb-8 font-sans">
                     {challengeResult === 'win' ? "Your mind is sharp. Bonus XP awarded." : "Distractions won this time. Return to the breath."}
                   </p>
                   <button onClick={closeChallenge} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 font-sans">
                     Continue Flow
                   </button>
                 </>
               )}
             </div>
          </div>
        )}

      </div>
    );
  }

  // 0. SELECTION
  return (
    <div className="min-h-screen bg-[#050a14] p-6 flex flex-col items-center justify-center text-white font-serif">
      <button onClick={onBack} className="absolute top-6 left-6 text-slate-500 hover:text-white flex items-center gap-2 transition-colors font-sans">
        <ArrowRight className="rotate-180" /> Back
      </button>
      
      <div className="max-w-4xl w-full text-center">
        <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-neon-pink border border-slate-800">
            <Flower2 className="w-10 h-10 text-neon-pink" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Mindful Movement</h1>
        <p className="text-slate-400 mb-10 text-lg max-w-xl mx-auto font-sans">
          Select your focus area. AI will guide your flow.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 font-sans">
          {FOCUS_AREAS.map((f) => (
            <button 
              key={f.id}
              onClick={() => handleFocusSelect(f.id)}
              className="bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-neon-pink p-6 rounded-2xl transition-all flex flex-col items-center gap-3 hover:-translate-y-1"
            >
              <span className="text-3xl">{f.icon}</span>
              <span className="text-sm font-bold text-slate-300">{f.id}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MeditationMode;