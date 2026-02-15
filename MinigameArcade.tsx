import React, { useState, useEffect } from 'react';
import { Gamepad2, MousePointer2, Zap, AlertTriangle, Play, RefreshCcw } from 'lucide-react';

interface MinigameArcadeProps {
  level: number;
}

const MinigameArcade: React.FC<MinigameArcadeProps> = ({ level }) => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  // GAMES CONFIG
  const GAMES = [
    { id: 'clicker', name: 'The Button', levelReq: 1, desc: 'A very bad game. Just click it.' },
    { id: 'reflex', name: 'Reflex Tester', levelReq: 3, desc: 'Test your reaction speed.' },
    { id: 'guess', name: 'Guess Number', levelReq: 5, desc: 'Guess a number between 1-100.' },
  ];

  const lockedGames = GAMES.filter(g => g.levelReq > level);
  const unlockedGames = GAMES.filter(g => g.levelReq <= level);

  if (!selectedGame) {
    return (
      <div className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-700">
        <div className="flex items-center gap-2 mb-6">
          <Gamepad2 className="text-purple-500" />
          <h2 className="text-xl font-bold">Retro Arcade</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {unlockedGames.map(game => (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game.id)}
              className="bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-600 text-left transition-all hover:scale-[1.02]"
            >
              <h3 className="font-bold text-emerald-400">{game.name}</h3>
              <p className="text-xs text-slate-400">{game.desc}</p>
              <div className="mt-2 text-xs bg-emerald-900/50 text-emerald-200 inline-block px-2 py-0.5 rounded">Unlocked</div>
            </button>
          ))}
          
          {lockedGames.map(game => (
            <div key={game.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 text-left opacity-60 relative overflow-hidden">
               <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] z-10">
                 <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                   <AlertTriangle size={12} /> Lvl {game.levelReq} Required
                 </span>
               </div>
               <h3 className="font-bold text-slate-500">{game.name}</h3>
               <p className="text-xs text-slate-600">{game.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-700 h-[400px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">{GAMES.find(g => g.id === selectedGame)?.name}</h3>
        <button onClick={() => setSelectedGame(null)} className="text-xs text-slate-400 hover:text-white">Exit Game</button>
      </div>
      <div className="flex-1 bg-black rounded-xl border-4 border-slate-700 relative overflow-hidden flex items-center justify-center">
        {selectedGame === 'clicker' && <ClickerGame />}
        {selectedGame === 'reflex' && <ReflexGame />}
        {selectedGame === 'guess' && <GuessGame />}
      </div>
    </div>
  );
};

// --- MINI GAMES ---

const ClickerGame = () => {
  const [count, setCount] = useState(0);
  return (
    <div className="text-center">
      <div className="text-6xl font-mono mb-8">{count}</div>
      <button 
        onClick={() => setCount(c => c + 1)}
        className="px-8 py-8 bg-red-600 rounded-full active:scale-95 transition-transform shadow-[0_4px_0_rgb(153,27,27)] active:shadow-none active:translate-y-1"
      >
        <MousePointer2 size={32} />
      </button>
      <p className="mt-4 text-slate-500 text-xs">It's a bad game. Just click.</p>
    </div>
  );
};

const ReflexGame = () => {
  const [state, setState] = useState<'waiting' | 'ready' | 'now' | 'result'>('waiting');
  const [time, setTime] = useState(0);
  const startTime = React.useRef(0);
  const timeout = React.useRef<any>(null);

  const start = () => {
    setState('ready');
    setTime(0);
    const delay = 1000 + Math.random() * 3000;
    timeout.current = setTimeout(() => {
      setState('now');
      startTime.current = Date.now();
    }, delay);
  };

  const handleClick = () => {
    if (state === 'ready') {
      clearTimeout(timeout.current);
      setState('result');
      setTime(-1); // Too early
    } else if (state === 'now') {
      const diff = Date.now() - startTime.current;
      setTime(diff);
      setState('result');
    }
  };

  return (
    <div 
      onClick={state !== 'waiting' && state !== 'result' ? handleClick : undefined}
      className={`absolute inset-0 flex flex-col items-center justify-center cursor-pointer select-none
        ${state === 'waiting' ? 'bg-slate-800' : 
          state === 'ready' ? 'bg-red-900' : 
          state === 'now' ? 'bg-green-600' : 'bg-slate-900'}
      `}
    >
      {state === 'waiting' && <button onClick={start} className="px-6 py-2 bg-slate-600 rounded">Start</button>}
      {state === 'ready' && <div className="text-2xl font-bold text-red-200">WAIT FOR GREEN...</div>}
      {state === 'now' && <div className="text-4xl font-bold text-white">CLICK!</div>}
      {state === 'result' && (
        <div className="text-center">
          <div className="text-3xl font-bold mb-4">
            {time === -1 ? "Too Early!" : `${time}ms`}
          </div>
          <button onClick={start} className="px-6 py-2 bg-slate-600 rounded flex items-center gap-2 mx-auto"><RefreshCcw size={16}/> Retry</button>
        </div>
      )}
    </div>
  );
};

const GuessGame = () => {
  const [target, setTarget] = useState(Math.floor(Math.random() * 100) + 1);
  const [guess, setGuess] = useState('');
  const [msg, setMsg] = useState('Guess 1-100');

  const handleGuess = () => {
    const num = parseInt(guess);
    if (isNaN(num)) return;
    if (num < target) setMsg("Higher!");
    else if (num > target) setMsg("Lower!");
    else {
      setMsg("CORRECT! New number generated.");
      setTarget(Math.floor(Math.random() * 100) + 1);
    }
    setGuess('');
  };

  return (
    <div className="text-center w-full max-w-xs p-4">
      <h3 className="text-xl mb-4 text-purple-400">{msg}</h3>
      <div className="flex gap-2">
        <input 
          type="number" 
          value={guess}
          onChange={e => setGuess(e.target.value)}
          className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-center"
        />
        <button onClick={handleGuess} className="bg-purple-600 px-4 rounded font-bold">Go</button>
      </div>
    </div>
  );
};

export default MinigameArcade;
