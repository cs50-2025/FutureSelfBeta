import React, { useState } from 'react';
import { X, User, Lock, Calendar, Smile } from 'lucide-react';
import { loginUser, registerUser } from '../services/authService';
import { UserProfile } from '../types';

interface AuthOverlayProps {
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

const AuthOverlay: React.FC<AuthOverlayProps> = ({ onClose, onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isSignUp) {
        if (!firstName || !lastName || !age || !username || !password) {
          setError('All fields are required');
          return;
        }
        
        const user = registerUser({
          username,
          firstName,
          lastName,
          age: parseInt(age),
          avatarUrl: undefined // Default
        }, password);
        
        onLoginSuccess(user);
      } else {
        const user = loginUser(username, password);
        onLoginSuccess(user);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="bg-indigo-600 p-6 text-white flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
            <p className="text-indigo-200 text-sm mt-1">
              {isSignUp ? 'Join FutureSelf today.' : 'Sign in to continue your journey.'}
            </p>
          </div>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 text-sm rounded-xl text-center">
              {error}
            </div>
          )}

          {isSignUp && (
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase">First Name</label>
                 <div className="relative">
                   <User className="absolute left-3 top-3 text-slate-400" size={16} />
                   <input 
                     type="text" 
                     placeholder="John" 
                     value={firstName}
                     onChange={e => setFirstName(e.target.value)}
                     className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl pl-10 py-2.5 focus:ring-2 focus:ring-indigo-500"
                   />
                 </div>
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase">Last Name</label>
                 <div className="relative">
                   <User className="absolute left-3 top-3 text-slate-400" size={16} />
                   <input 
                     type="text" 
                     placeholder="Doe" 
                     value={lastName}
                     onChange={e => setLastName(e.target.value)}
                     className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl pl-10 py-2.5 focus:ring-2 focus:ring-indigo-500"
                   />
                 </div>
               </div>
            </div>
          )}

          {isSignUp && (
             <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Age</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 text-slate-400" size={16} />
                <input 
                  type="number" 
                  placeholder="25" 
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl pl-10 py-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Username</label>
            <div className="relative">
              <Smile className="absolute left-3 top-3 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="future_you_24" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl pl-10 py-2.5 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={16} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl pl-10 py-2.5 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/30 transition-all mt-4"
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>

          <div className="text-center pt-2">
            <button 
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="text-sm text-slate-500 hover:text-indigo-600 transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AuthOverlay;
