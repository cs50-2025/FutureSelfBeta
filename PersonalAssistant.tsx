import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, Send, Loader2, ArrowRight, User, Zap, Volume2, Save } from 'lucide-react';
import { runGeneralChat } from '../services/geminiService';
import { saveChatHistory } from '../services/authService';
import { Brain } from 'lucide-react';
import { UserProfile, ChatMessage as ChatMessageType } from '../types';

interface PersonalAssistantProps {
  onBack: () => void;
  currentUser: UserProfile | null;
}

// Reuse audio utils from previous (omitted for brevity in change request, but included in full file regen)
function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  const uint8 = new Uint8Array(int16.buffer);
  let binary = '';
  const len = uint8.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return {
    data: btoa(binary),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const CoolBotLogo = () => (
  <div className="relative w-10 h-10 flex items-center justify-center group">
    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
    <div className="relative bg-black rounded-xl w-10 h-10 flex items-center justify-center border border-indigo-500/50 shadow-inner overflow-hidden">
       <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #6366f1 1px, transparent 0)', backgroundSize: '4px 4px' }}></div>
       <Brain size={20} className="text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
       <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500/40 rounded-full blur-md animate-pulse"></div>
    </div>
    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full z-20"></div>
  </div>
);

const PersonalAssistant: React.FC<PersonalAssistantProps> = ({ onBack, currentUser }) => {
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  
  // Initialize messages from history if available, else default welcome
  const [messages, setMessages] = useState<ChatMessageType[]>(() => {
    if (currentUser && currentUser.chatHistory && currentUser.chatHistory.length > 0) {
      return currentUser.chatHistory;
    }
    return [{ role: 'model', text: "Hello! I'm your Personal FutureSelf Assistant. How can I help you optimize your habits today?", timestamp: Date.now() }];
  });

  const [inputText, setInputText] = useState("");
  const [isLoadingText, setIsLoadingText] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Persistence Effect
  useEffect(() => {
    if (currentUser && messages.length > 0) {
      // Debounce saving or just save on every change
      const timer = setTimeout(() => {
        saveChatHistory(currentUser.id, messages);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [messages, currentUser]);

  // Voice Chat State & Refs (Same as before)
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isLiveConnecting, setIsLiveConnecting] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState("");
  
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    const userMsg = inputText;
    setInputText("");
    
    // Optimistic Update
    const newMessages = [...messages, { role: 'user', text: userMsg, timestamp: Date.now() } as ChatMessageType];
    setMessages(newMessages);
    setIsLoadingText(true);

    try {
      const history = newMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      const aiResponse = await runGeneralChat(userMsg, history);
      setMessages(prev => [...prev, { role: 'model', text: aiResponse, timestamp: Date.now() }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting right now.", timestamp: Date.now() }]);
    } finally {
      setIsLoadingText(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- LIVE VOICE LOGIC (Condensed for brevity, kept same logic) ---
  const startLiveSession = async () => {
    if (!process.env.API_KEY) { setLiveError("API Key missing"); return; }
    setIsLiveConnecting(true); setLiveError(null); setCurrentTranscript("Listening...");

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      await inputCtx.resume(); await outputCtx.resume();
      inputContextRef.current = inputCtx; outputContextRef.current = outputCtx;
      nextStartTimeRef.current = 0;

      const analyser = outputCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      startVisualizer();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const inputNode = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: "You are a friendly, concise personal assistant for a habit-tracking app called FutureSelf."
        },
        callbacks: {
          onopen: () => {
            setIsLiveConnected(true); setIsLiveConnecting(false); setCurrentTranscript("Connected. Go ahead.");
            processor.onaudioprocess = (e) => {
              const pcmBlob = createBlob(e.inputBuffer.getChannelData(0));
              sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob })).catch(() => {});
            };
            inputNode.connect(processor); processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputContextRef.current) {
               setCurrentTranscript("AI is speaking...");
               const ctx = outputContextRef.current;
               const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
               const source = ctx.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(analyserRef.current!); 
               analyserRef.current!.connect(ctx.destination);
               source.addEventListener('ended', () => {
                 activeSourcesRef.current.delete(source);
                 if (activeSourcesRef.current.size === 0) setCurrentTranscript("Listening...");
               });
               if (nextStartTimeRef.current < ctx.currentTime) nextStartTimeRef.current = ctx.currentTime;
               source.start(nextStartTimeRef.current);
               nextStartTimeRef.current += audioBuffer.duration;
               activeSourcesRef.current.add(source);
            }
          },
          onclose: () => handleDisconnect(),
          onerror: (e) => { setLiveError("Connection Error"); handleDisconnect(); }
        }
      });
    } catch (e) { setLiveError("Microphone denied."); handleDisconnect(); }
  };

  const startVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    if (!ctx) return;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2;
        ctx.fillStyle = `rgb(${barHeight + 100},50,250)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    draw();
  };

  const handleDisconnect = () => {
    if (scriptProcessorRef.current) { scriptProcessorRef.current.disconnect(); scriptProcessorRef.current.onaudioprocess = null; scriptProcessorRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (inputContextRef.current) { inputContextRef.current.close(); inputContextRef.current = null; }
    if (outputContextRef.current) { outputContextRef.current.close(); outputContextRef.current = null; }
    if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; }
    if (sessionPromiseRef.current) { sessionPromiseRef.current.then(session => { if (session.close) session.close(); }).catch(() => {}); sessionPromiseRef.current = null; }
    setIsLiveConnected(false); setIsLiveConnecting(false); setCurrentTranscript("");
  };

  useEffect(() => { return () => handleDisconnect(); }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center">
      {/* Header */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between shadow-sm z-20">
         <div className="flex items-center gap-4">
           <CoolBotLogo />
           <div>
             <h1 className="text-xl font-bold text-slate-900 dark:text-white">Personal Assistant</h1>
             <p className="text-xs text-slate-500 flex items-center gap-1">
               <Zap size={10} className="text-amber-500 fill-amber-500" /> Powered by Gemini Live
             </p>
           </div>
         </div>
         
         <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
           <button onClick={() => { setMode('text'); handleDisconnect(); }} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'text' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-700'}`}>Text</button>
           <button onClick={() => setMode('voice')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'voice' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-700'}`}>Voice</button>
         </div>
         
         <button onClick={onBack} className="md:hidden text-slate-400">
            <ArrowRight className="rotate-180" />
         </button>
      </div>

      <div className="flex-1 w-full max-w-3xl p-4 flex flex-col h-[calc(100vh-80px)]">
        {mode === 'text' ? (
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {messages.map((msg, idx) => (
                 <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${msg.role === 'user' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-transparent'}`}>
                       {msg.role === 'user' ? <User size={16} /> : <CoolBotLogo />}
                     </div>
                     <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-100 rounded-tr-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'}`}>
                       {msg.text}
                     </div>
                   </div>
                 </div>
               ))}
               {isLoadingText && <div className="ml-12 text-xs text-slate-400 flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin"/> Thinking...</div>}
               <div ref={chatEndRef} />
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 relative">
              <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={currentUser ? "Ask questions (history saved)..." : "Ask questions..."} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button onClick={handleSendMessage} disabled={!inputText.trim() || isLoadingText} className="absolute right-6 top-5 text-indigo-600 hover:text-indigo-700 disabled:opacity-50"><Send size={20} /></button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
             {/* Visualizer & Controls (Simplified for this view) */}
             <div className="relative mb-8 h-40 w-full flex items-end justify-center rounded-xl bg-slate-50 dark:bg-slate-900">
               {isLiveConnected ? <canvas ref={canvasRef} width={400} height={160} className="w-full h-full" /> : <Volume2 className="text-slate-300 w-16 h-16" />}
             </div>
             <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-xl transition-all ${isLiveConnected ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}>
               {isLiveConnected ? <Mic size={32} className="text-white" /> : <MicOff size={32} className="text-slate-400" />}
             </div>
             <p className="text-slate-500 mb-6 h-6">{currentTranscript || "Ready to talk."}</p>
             {!isLiveConnected ? (
               <button onClick={startLiveSession} className="px-6 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-all">Start Session</button>
             ) : (
               <button onClick={handleDisconnect} className="px-6 py-3 bg-rose-500 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-all">End Session</button>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalAssistant;
