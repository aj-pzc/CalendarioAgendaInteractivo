'use client';

import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale/es';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('es', es);

interface DatePickerCustomProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  openUp?: boolean; 
  recurso?: 'SALA' | 'OFICINA';
}

export default function DatePickerCustom({
  label,
  value,
  onChange,
  minDate,
  openUp = false, 
  recurso = 'SALA',
}: DatePickerCustomProps) {
  const resourceAccentClasses = recurso === 'SALA'
    ? 'focus:ring-slate-900/10 focus:border-amber-400'
    : 'focus:ring-amber-700/10 focus:border-amber-700';

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
      <DatePicker
        selected={value}
        onChange={onChange}
        locale="es"
        dateFormat="dd/MM/yyyy"
        minDate={minDate}
        popperPlacement={openUp ? "top-start" : "bottom-start"} 
        wrapperClassName="w-full"
        className={`w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 transition bg-white cursor-pointer shadow-2xs ${resourceAccentClasses}`}
      />
    </div>
  );
}