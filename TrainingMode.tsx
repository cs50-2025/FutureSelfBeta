import React, { useState, useRef, useEffect } from 'react';
import { generateDrillPlan, analyzeDrillPerformance, generateDrillImage, DrillResponse, PerformanceAnalysis } from '../services/geminiService';
import { ArrowRight, Loader2, Activity, Camera, Zap, CheckCircle, Play, Trophy, Pause, RotateCcw, Swords, X } from 'lucide-react';

interface TrainingModeProps {
  onBack: () => void;
  onComplete: (sport: string) => void;
}

const SPORTS = [
  { id: 'Basketball', icon: '🏀' },
  { id: 'Soccer', icon: '⚽' },
  { id: 'Tennis', icon: '🎾' },
  { id: 'Boxing', icon: '🥊' },
  { id: 'Volleyball', icon: '🏐' },
  { id: 'Track & Field', icon: '🏃' },
  { id: 'Swimming', icon: '🏊' },
  { id: 'Martial Arts', icon: '🥋' },
  { id: 'Baseball', icon: '⚾' },
  { id: 'Football', icon: '🏈' },
  { id: 'Yoga', icon: '🧘' },
  { id: 'General Fitness', icon: '💪' },
];

// --- MINI GAME COMPONENT ---
const PingPongGame = ({ onEnd }: { onEnd: (result: 'win' | 'lose') => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef({ user: 0, ai: 0 });
  const [scores, setScores] = useState({ user: 0, ai: 0 });
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Game State
    let ball = { x: 150, y: 200, dx: 4, dy: 4 };
    let userX = 120;
    let aiX = 120;
    const P_W = 60; // Paddle Width
    const P_H = 10;
    
    // Reset Ball
    const reset = () => {
       ball = { x: 150, y: 200, dx: (Math.random() > 0.5 ? 4 : -4), dy: (Math.random() > 0.5 ? 4 : -4) };
    };

    const loop = () => {
       // Move
       ball.x += ball.dx;
       ball.y += ball.dy;

       // Wall Bounce
       if (ball.x < 0 || ball.x > canvas.width) ball.dx = -ball.dx;

       // AI Movement (Simple tracking with speed limit)
       const aiCenter = aiX + P_W / 2;
       if (ball.x > aiCenter + 15) aiX += 3.5;
       else if (ball.x < aiCenter - 15) aiX -= 3.5;
       // Keep in bounds
       aiX = Math.max(0, Math.min(canvas.width - P_W, aiX));

       // User Paddle Hit (Bottom)
       if (ball.y + 5 > canvas.height - 20 && ball.x > userX && ball.x < userX + P_W) {
          ball.dy = -Math.abs(ball.dy) * 1.05; // Bounce up and speed up slightly
       }

       // AI Paddle Hit (Top)
       if (ball.y - 5 < 20 && ball.x > aiX && ball.x < aiX + P_W) {
          ball.dy = Math.abs(ball.dy); // Bounce down
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

       // Check Win (First to 3)
       if (scoreRef.current.user >= 3) {
          onEnd('win');
          return; // Stop loop
       }
       if (scoreRef.current.ai >= 3) {
          onEnd('lose');
          return; // Stop loop
       }

       // Draw
       ctx.fillStyle = '#0f172a'; // Slate 900
       ctx.fillRect(0, 0, canvas.width, canvas.height);
       
       // Center Line
       ctx.strokeStyle = '#334155';
       ctx.setLineDash([5, 5]);
       ctx.beginPath(); ctx.moveTo(0, 200); ctx.lineTo(300, 200); ctx.stroke();

       // Paddles
       ctx.fillStyle = '#f0f'; // AI (Pink)
       ctx.fillRect(aiX, 10, P_W, P_H);
       
       ctx.fillStyle = '#0f0'; // User (Green)
       ctx.fillRect(userX, canvas.height - 20, P_W, P_H);

       // Ball
       ctx.beginPath(); ctx.arc(ball.x, ball.y, 6, 0, Math.PI*2);
       ctx.fillStyle = '#0ff'; ctx.fill();

       requestRef.current = requestAnimationFrame(loop);
    };

    // Input Handling
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
  }, []); // Run once on mount

  return (
    <div className="flex flex-col items-center w-full animate-in zoom-in duration-300">
      <div className="flex justify-between w-full px-8 mb-4 font-mono font-bold text-2xl">
         <span className="text-neon-pink drop-shadow-[0_0_5px_rgba(255,0,255,0.5)]">AI: {scores.ai}</span>
         <span className="text-neon-green drop-shadow-[0_0_5px_rgba(10,255,0,0.5)]">YOU: {scores.user}</span>
      </div>
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={400} 
        className="w-full max-w-[300px] h-auto bg-slate-900 rounded-xl border-4 border-slate-700 shadow-2xl cursor-none touch-none"
      />
      <p className="text-slate-400 text-sm mt-4 animate-pulse">First to 3 wins! Move to control the green paddle.</p>
    </div>
  );
};

const TrainingMode: React.FC<TrainingModeProps> = ({ onBack, onComplete }) => {
  const [sport, setSport] = useState<string>('');
  const [mode, setMode] = useState<'selection' | 'briefing' | 'active'>('selection');
  
  // Session Data
  const [plan, setPlan] = useState<DrillResponse | null>(null);
  const [currentDrillIndex, setCurrentDrillIndex] = useState(0);
  
  // Images Dictionary: Index -> DataURL
  const [drillImages, setDrillImages] = useState<Record<number, string>>({});
  
  const [totalScore, setTotalScore] = useState(0);
  const [totalExp, setTotalExp] = useState(0);
  
  // State: 'idle' = waiting to start drill, 'recording' = 5-8s clip, 'analyzing' = talking to AI, 'feedback' = showing results
  const [sessionState, setSessionState] = useState<'idle' | 'recording' | 'analyzing' | 'feedback'>('idle');
  const [lastAnalysis, setLastAnalysis] = useState<PerformanceAnalysis | null>(null);
  
  // Ping Pong Challenge State
  const [showChallenge, setShowChallenge] = useState(false);
  const [isPlayingPong, setIsPlayingPong] = useState(false);
  const [challengeResult, setChallengeResult] = useState<'win' | 'lose' | null>(null);
  
  // Video & Canvas
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const [loading, setLoading] = useState(false);

  // --- VOICE ENGINE ---
  const speak = (text: string, rate = 1.1) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate; 
      utterance.pitch = 1.0; 
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes('Google US English') || v.lang === 'en-US');
      if (preferred) utterance.voice = preferred;
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- SELECTION ---
  const handleSportSelect = async (selectedSport: string) => {
    setSport(selectedSport);
    setLoading(true);
    try {
      const data = await generateDrillPlan(selectedSport);
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
    speak(`Let's begin. First up is ${plan?.selected_drills[0].name}.`);
  };

  // --- PRE-FETCH IMAGES (OPTIMIZATION) ---
  // Start generating images as soon as we have a plan (Briefing Phase)
  useEffect(() => {
    if (plan && mode === 'briefing') {
      plan.selected_drills.forEach((drill, index) => {
        // Only fetch if not already present
        if (!drillImages[index]) {
          generateDrillImage(drill.name, plan.sport).then(img => {
            if (img) {
              setDrillImages(prev => ({ ...prev, [index]: img }));
            }
          });
        }
      });
    }
  }, [plan, mode]);

  // --- RECORDING & ANALYSIS FLOW ---
  const startRecordingClip = () => {
    setSessionState('recording');
    setRecordingTime(8); // 8 seconds clip
    
    // Simulating Live Cues during recording
    const cues = [
      "Keep your back straight.",
      "Engage that core!",
      "Nice tempo, hold it.",
      "Breathe through the movement.",
      "Focus on stability.",
      "Drive with power!"
    ];
    
    // Speak a random cue halfway through
    setTimeout(() => {
      speak(cues[Math.floor(Math.random() * cues.length)]);
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
    
    // Call Gemini API Simulation
    const analysis = await analyzeDrillPerformance(sport, plan.selected_drills[currentDrillIndex].name, currentDrillIndex);
    
    setLastAnalysis(analysis);
    setTotalScore(s => s + analysis.score);
    setTotalExp(e => e + analysis.exp_earned);
    
    setSessionState('feedback');
    speak(analysis.coach_message);
  };

  const nextDrill = () => {
    // Check for Ping Pong Challenge trigger (After Drill 2, index 1)
    if (currentDrillIndex === 1 && !challengeResult) {
      setShowChallenge(true);
      speak("Hold up! I'm challenging you to a Ping Pong match. Win, and you skip the rest with bonus XP.");
      return;
    }

    if (!plan) return;
    if (currentDrillIndex < plan.selected_drills.length - 1) {
      setCurrentDrillIndex(prev => prev + 1);
      setSessionState('idle');
      setLastAnalysis(null);
      speak(`Next up: ${plan.selected_drills[currentDrillIndex + 1].name}.`);
    } else {
      finishWorkout();
    }
  };

  const finishWorkout = (bonusExp = 0) => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
    }
    onComplete(sport);
  };

  // --- PING PONG MINIGAME ---
  const playPingPong = () => {
    setIsPlayingPong(true);
    speak("Okay, get ready. First to 3 points wins.");
  };

  const handleGameEnd = (result: 'win' | 'lose') => {
    setIsPlayingPong(false);
    setChallengeResult(result);
    if (result === 'win') {
      setTotalExp(e => e + 100);
      speak("Wow! You actually beat me. I'm impressed. Taking the win and the bonus XP.");
    } else {
      speak("Nice try, but I'm the coach for a reason. Back to training.");
    }
  };

  const closeChallenge = () => {
    setShowChallenge(false);
    if (challengeResult === 'win') {
      finishWorkout();
    } else {
      // Continue to drill 3
      setCurrentDrillIndex(2);
      setSessionState('idle');
      setLastAnalysis(null);
    }
  };

  // --- SKELETON RENDER LOOP (Visual FX) ---
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
      
      // Simple overlay for "Scanning" effect if recording
      if (sessionState === 'recording') {
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 4; // Thicker line
        ctx.strokeRect(w*0.2, h*0.1, w*0.6, h*0.8); // Face frame
        
        // Scan line
        const time = Date.now() / 1000;
        const y = (Math.sin(time * 2) + 1) / 2 * h;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [mode, sessionState]);


  // --- VIEWS ---

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050a14] flex flex-col items-center justify-center text-white">
        <Loader2 size={48} className="animate-spin text-neon-blue mb-4" />
        <h2 className="text-xl font-bold">Coach is prepping the plan...</h2>
      </div>
    );
  }

  // 1. BRIEFING
  if (mode === 'briefing' && plan) {
    return (
      <div className="min-h-screen bg-[#050a14] p-6 text-white flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full">
           <div className="text-center mb-8">
             <h1 className="text-4xl font-black mb-2">{plan.sport} Session</h1>
             <p className="text-slate-400">{plan.purpose}</p>
           </div>
           
           <div className="space-y-4 mb-8">
             {plan.selected_drills.map((drill, idx) => (
               <div key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
                 <div className="w-8 h-8 rounded-full bg-slate-800 text-neon-blue flex items-center justify-center font-bold border border-slate-700">{idx+1}</div>
                 <div>
                   <div className="font-bold text-lg">{drill.name}</div>
                   <div className="text-xs text-slate-500">{drill.instruction} • {drill.duration}</div>
                 </div>
               </div>
             ))}
           </div>

           <button onClick={startSession} className="w-full py-4 bg-neon-blue hover:bg-cyan-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-neon-blue/20">
             <Camera size={20} /> Enter Live Dojo
           </button>
        </div>
      </div>
    );
  }

  // 2. ACTIVE LIVE SESSION
  if (mode === 'active' && plan) {
    const drill = plan.selected_drills[currentDrillIndex];
    const currentImage = drillImages[currentDrillIndex];

    return (
      <div className="min-h-screen bg-[#050a14] text-white flex flex-col relative overflow-hidden font-sans">
        
        {/* TOP BAR */}
        <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center z-10 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-neon-blue rounded-lg flex items-center justify-center text-black font-bold shadow-neon-blue">
               {currentDrillIndex + 1}/4
             </div>
             <div>
               <h2 className="font-bold text-lg leading-tight">{drill.name}</h2>
               <p className="text-xs text-slate-400">Target: {drill.duration}</p>
             </div>
          </div>
          <div className="text-right">
             <div className="text-xs text-slate-500 font-bold uppercase">Total EXP</div>
             <div className="text-2xl font-black text-neon-purple">{totalExp}</div>
          </div>
        </div>

        {/* SPLIT SCREEN CONTENT AREA */}
        <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 relative overflow-hidden">
           
           {/* LEFT: AI DEMO */}
           <div className="flex-1 flex flex-col justify-center items-center bg-slate-900/50 rounded-3xl border border-slate-800 relative overflow-hidden">
             <div className="w-full h-full flex items-center justify-center p-6">
                {currentImage ? (
                   <img src={currentImage} alt={drill.name} className="max-w-full max-h-full object-contain animate-in fade-in" />
                 ) : (
                   <div className="flex flex-col items-center text-slate-500">
                     <Loader2 className="animate-spin mb-2 text-neon-blue" />
                     <span className="text-xs">Visualizing Drill...</span>
                   </div>
                 )}
             </div>
             <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
               <p className="text-center text-lg md:text-xl font-medium text-slate-200">{drill.instruction}</p>
             </div>
           </div>

           {/* RIGHT: USER CAMERA (LARGE) */}
           <div className="flex-1 relative bg-black rounded-3xl border-2 border-slate-700 overflow-hidden shadow-2xl">
              <video ref={videoRef} className="w-full h-full object-cover transform scale-x-[-1]" playsInline muted />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
              
              <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-2 backdrop-blur-md">
                <div className={`w-3 h-3 rounded-full ${sessionState === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                {sessionState === 'recording' ? 'RECORDING' : 'LIVE FEED'}
              </div>

              {/* ACTION BUTTONS OVERLAY */}
              <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20">
                 {sessionState === 'feedback' ? (
                   <button onClick={nextDrill} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-slate-200 flex items-center gap-2 shadow-lg shadow-white/20">
                     {currentDrillIndex < 3 ? 'Next Drill' : 'Finish Workout'} <ArrowRight size={18} />
                   </button>
                 ) : sessionState === 'recording' ? (
                   <div className="w-20 h-20 rounded-full border-4 border-red-500 flex items-center justify-center animate-pulse bg-black/50 backdrop-blur-sm">
                     <span className="text-3xl font-black text-red-500">{recordingTime}</span>
                   </div>
                 ) : sessionState === 'analyzing' ? (
                   <div className="px-6 py-3 bg-black/80 rounded-full text-white flex items-center gap-2 border border-slate-700">
                     <Loader2 className="animate-spin text-neon-blue" /> Coach is analyzing...
                   </div>
                 ) : (
                   <button onClick={startRecordingClip} className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold shadow-lg shadow-red-600/30 transition-transform active:scale-95 flex items-center gap-3">
                     <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div> Analyze Form (8s)
                   </button>
                 )}
              </div>
           </div>

           {/* FEEDBACK OVERLAY (CENTERED) */}
           {sessionState === 'feedback' && lastAnalysis && (
             <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
               <div className="max-w-md w-full bg-slate-900 border-2 border-neon-green rounded-3xl p-6 shadow-[0_0_50px_rgba(10,255,0,0.2)]">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-neon-green/20 rounded-full text-neon-green">
                      <CheckCircle size={32} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-white">Analysis Complete</h3>
                      <p className="text-neon-green font-bold">Score: {lastAnalysis.score}/100</p>
                    </div>
                  </div>
                  
                  <div className="bg-black/40 p-4 rounded-xl mb-4 border border-white/5">
                    <p className="text-slate-300 italic">"{lastAnalysis.coach_message}"</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-6">
                    <div className="bg-black/30 p-2 rounded-lg text-center">
                      <span className="block text-xs text-slate-500 uppercase">EXP Earned</span>
                      <span className="block text-xl font-bold text-neon-purple">+{lastAnalysis.exp_earned}</span>
                    </div>
                    <div className="bg-black/30 p-2 rounded-lg text-center">
                      <span className="block text-xs text-slate-500 uppercase">Focus Area</span>
                      <span className="block text-sm font-bold text-white truncate">{lastAnalysis.areas_to_improve[0]}</span>
                    </div>
                  </div>

                  <button onClick={nextDrill} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 flex items-center justify-center gap-2">
                     Continue <ArrowRight size={18} />
                  </button>
               </div>
             </div>
           )}

        </div>

        {/* PING PONG CHALLENGE OVERLAY */}
        {showChallenge && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
             <div className="max-w-md w-full bg-slate-900 border-2 border-neon-purple rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(188,19,254,0.3)] flex flex-col items-center">
               
               {isPlayingPong ? (
                 <PingPongGame onEnd={handleGameEnd} />
               ) : !challengeResult ? (
                 <>
                   <div className="w-20 h-20 bg-neon-purple/20 rounded-full flex items-center justify-center mx-auto mb-6">
                     <Swords size={40} className="text-neon-purple" />
                   </div>
                   <h2 className="text-3xl font-black text-white mb-2">BONUS CHALLENGE!</h2>
                   <p className="text-slate-300 mb-8">
                     Beat the Coach at Ping Pong to instantly finish the workout with <span className="text-neon-yellow font-bold">+100 EXP</span>.
                   </p>
                   <div className="grid grid-cols-2 gap-4 w-full">
                     <button onClick={() => { setShowChallenge(false); nextDrill(); }} className="py-3 bg-slate-800 text-slate-400 font-bold rounded-xl hover:bg-slate-700">Decline</button>
                     <button onClick={playPingPong} className="py-3 bg-neon-purple text-white font-bold rounded-xl hover:bg-fuchsia-600 shadow-lg shadow-neon-purple/30">START MATCH</button>
                   </div>
                 </>
               ) : (
                 <>
                   <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                     {challengeResult === 'win' ? <Trophy size={40} className="text-neon-yellow" /> : <X size={40} className="text-red-500" />}
                   </div>
                   <h2 className="text-3xl font-black text-white mb-2">{challengeResult === 'win' ? 'YOU WON!' : 'NICE TRY!'}</h2>
                   <p className="text-slate-300 mb-8">
                     {challengeResult === 'win' ? "Coach is impressed. Bonus XP awarded." : "Coach returned your smash. Back to training!"}
                   </p>
                   <button onClick={closeChallenge} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200">
                     Continue
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
    <div className="min-h-screen bg-[#050a14] p-6 flex flex-col items-center justify-center text-white font-sans">
      <button onClick={onBack} className="absolute top-6 left-6 text-slate-500 hover:text-white flex items-center gap-2 transition-colors">
        <ArrowRight className="rotate-180" /> Back
      </button>
      
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">AI Performance Coach</h1>
        <p className="text-slate-400 mb-10 text-lg max-w-xl mx-auto">
          Select a sport. I'll build a home-based technical session for you.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SPORTS.map((s) => (
            <button 
              key={s.id}
              onClick={() => handleSportSelect(s.id)}
              className="bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-neon-blue p-6 rounded-2xl transition-all flex flex-col items-center gap-3 hover:-translate-y-1"
            >
              <span className="text-3xl">{s.icon}</span>
              <span className="text-sm font-bold text-slate-300">{s.id}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrainingMode;