import React, { useState, useEffect, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  colorClass?: string;
  icon?: React.ReactNode;
}

const Slider: React.FC<SliderProps> = ({ 
  label, 
  value, 
  min, 
  max, 
  step = 1, 
  unit = '', 
  onChange,
  colorClass = 'accent-indigo-600',
  icon
}) => {
  // Local state to manage input field typing (allows temporary invalid values like empty string or partial numbers)
  const [inputValue, setInputValue] = useState(value.toString());
  const percentage = ((value - min) / (max - min)) * 100;

  // Sync local input state when parent value changes (e.g. from buttons or slider drag)
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Just update the text, don't enforce validation yet
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    let newVal = parseFloat(inputValue);
    
    if (isNaN(newVal)) {
      // Revert to current prop value if invalid
      setInputValue(value.toString());
      return;
    }

    // Clamp value
    if (newVal < min) newVal = min;
    if (newVal > max) newVal = max;

    // Update parent and local state
    onChange(newVal);
    setInputValue(newVal.toString());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="mb-6 select-none">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
          {icon && <span className="text-slate-400">{icon}</span>}
          {label}
        </div>
        
        <div className="flex items-center bg-slate-200 dark:bg-slate-800 rounded-md overflow-hidden min-w-[4rem] border border-transparent focus-within:border-indigo-500 transition-colors">
           <input 
             type="text" 
             inputMode="decimal"
             value={inputValue}
             onChange={handleInputChange}
             onBlur={handleInputBlur}
             onKeyDown={handleKeyDown}
             className="w-full bg-transparent text-center font-bold text-slate-900 dark:text-white text-sm py-1 focus:outline-none"
           />
           <span className="text-xs font-medium text-slate-500 pr-2 pointer-events-none select-none">{unit}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={handleDecrement}
          className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors active:scale-95 flex-shrink-0"
          aria-label="Decrease value"
        >
          <Minus size={16} />
        </button>

        {/* Container for the slider track and input */}
        <div className="relative flex-1 h-8 flex items-center touch-none">
          
          {/* The actual input - invisible but clickable overlay */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute inset-0 z-30 w-full h-full opacity-0 cursor-pointer"
          />

          {/* Visual Track Background */}
          <div className="absolute left-0 right-0 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden pointer-events-none z-10">
            <div 
              className={`h-full ${colorClass} transition-all duration-75 ease-out`} 
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Visual Thumb */}
          <div 
            className="absolute h-5 w-5 bg-white border-2 border-slate-300 dark:border-slate-600 rounded-full shadow-md pointer-events-none z-20 transition-all duration-75 ease-out"
            style={{ left: `calc(${percentage}% - 10px)` }}
          />
        </div>

        <button 
          onClick={handleIncrement}
          className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors active:scale-95 flex-shrink-0"
          aria-label="Increase value"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

export default Slider;