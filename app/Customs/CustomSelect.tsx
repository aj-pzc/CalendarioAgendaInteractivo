'use client';

import { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  label?: string;
  name?: string; 
  value: string;
  onChange?: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string; 
}

export default function CustomSelect({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = 'Selecciona una opción...',
  className = '',
  buttonClassName = '',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const selectedOption = options.find((opt) => opt.value === internalValue);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    setInternalValue(val);
    if (onChange) onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="block text-[10px] font-bold text-slate-400 mb-1">{label}</label>}

      {name && <input type="hidden" name={name} value={internalValue} />}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-2xs transition cursor-pointer ${
          buttonClassName || 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300'
        }`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="text-[10px] opacity-60 ml-2">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full mt-1 w-full min-w-[140px] max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg p-1 space-y-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-slate-400 text-center">
              Sin opciones
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === internalValue;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}