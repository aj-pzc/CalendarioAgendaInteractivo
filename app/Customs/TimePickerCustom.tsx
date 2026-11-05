'use client';

import { useState, useRef, useEffect, useMemo } from 'react';

interface BusySlot {
  startTime: string;
  endTime: string;
  recurso: 'SALA' | 'OFICINA';
}

interface TimePickerCustomProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  recurso?: 'SALA' | 'OFICINA';
  busySlots?: BusySlot[];
  fechaSeleccionada?: string | Date | null;
}

export default function TimePickerCustom({
  label,
  value,
  onChange,
  recurso = 'SALA',
  busySlots = [],
  fechaSeleccionada = new Date(),
}: TimePickerCustomProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const date = value || new Date();

  const getTimeParts = (d: Date) => {
    let hours = d.getHours();
    const period: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const hourStr = String(hours).padStart(2, '0');
    const minStr = String(d.getMinutes()).padStart(2, '0');
    return { hourStr, minStr, period };
  };

  const { hourStr, minStr, period } = getTimeParts(date);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const timeOptions = useMemo(() => {
    const options = [];
    
    // 1. Obtener la fecha seleccionada de forma segura evitando desfases UTC/zona horaria
    let baseDate: Date;
    if (typeof fechaSeleccionada === 'string') {
      // Tomamos solo la parte de la fecha "YYYY-MM-DD" y le forzamos la hora local T00:00:00
      const cleanDateStr = fechaSeleccionada.split('T')[0];
      baseDate = new Date(`${cleanDateStr}T00:00:00`);
    } else if (fechaSeleccionada instanceof Date) {
      baseDate = new Date(fechaSeleccionada);
    } else {
      baseDate = new Date();
    }

    const ahora = new Date(); // Hora local exacta actual

    // Formatear ambas fechas a YYYY-MM-DD localmente para una comparación limpia
    const pad = (n: number) => String(n).padStart(2, '0');
    const fechaSeleccionadaStr = `${baseDate.getFullYear()}-${pad(baseDate.getMonth() + 1)}-${pad(baseDate.getDate())}`;
    const fechaHoyStr = `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}`;

    // 2. Comprobar estrictamente si es hoy comparando cadenas locales exactas
    const esHoy = fechaSeleccionadaStr === fechaHoyStr;

    // 3. Si es hoy, calculamos los minutos actuales para bloquear el pasado
    let minMinutesHoy = 0;
    if (esHoy) {
      const minBloqueActual = Math.floor(ahora.getMinutes() / 15) * 15;
      minMinutesHoy = ahora.getHours() * 60 + minBloqueActual;
    }

    // Horario laboral: 08:30 AM (510 min) a 07:00 PM (1140 min)
    for (let totalMinutes = 8.5 * 60; totalMinutes <= 19 * 60; totalMinutes += 15) {
      
      // Si es hoy, filtramos las horas que ya pasaron. Si es futuro, pasa de largo y muestra todo.
      if (esHoy && totalMinutes < minMinutesHoy) {
        continue;
      }

      const h24 = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;

      const currentSlotDate = new Date(baseDate);
      currentSlotDate.setHours(h24, m, 0, 0);

      // Validar si está ocupado por otra reserva
      const isOccupied = busySlots.some((slot) => {
        if (slot.recurso !== recurso) return false;
        const start = new Date(slot.startTime).getTime();
        const end = new Date(slot.endTime).getTime();
        const current = currentSlotDate.getTime();
        return current >= start && current < end;
      });

      if (isOccupied) continue;

      let h12 = h24 % 12 || 12;
      const hourString = String(h12).padStart(2, '0');
      const minuteString = String(m).padStart(2, '0');
      const optPeriod: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';

      options.push({
        hour: hourString,
        minute: minuteString,
        period: optPeriod,
        label: `${hourString}:${minuteString} ${optPeriod}`,
        h24,
        m,
      });
    }

    return options;
  }, [fechaSeleccionada, busySlots, recurso]);

  const handleSelectOption = (h24: number, minute: number) => {
    const newDate = new Date(date);
    newDate.setHours(h24, minute, 0, 0);
    onChange(newDate);
    setIsOpen(false);
  };

  const togglePeriod = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newPeriod = period === 'AM' ? 'PM' : 'AM';
    let h = parseInt(hourStr, 10);
    if (newPeriod === 'PM' && h < 12) h += 12;
    if (newPeriod === 'AM' && h === 12) h = 0;

    const newDate = new Date(date);
    newDate.setHours(h, date.getMinutes(), 0, 0);
    onChange(newDate);
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>

      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1.5 shadow-2xs hover:border-slate-300 focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/10 transition">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 text-left px-2 py-1 text-xs font-bold text-slate-900 flex items-center justify-between cursor-pointer"
        >
          <span>
            {hourStr}:{minStr}
          </span>
          <span className="text-[10px] text-slate-400">{isOpen ? '▲' : '▼'}</span>
        </button>

        <button
          type="button"
          onClick={togglePeriod}
          className="px-2.5 py-1 bg-slate-900 text-white font-bold text-[10px] rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          {period}
        </button>
      </div>
      {isOpen && (
        <div className="absolute z-50 bottom-full mb-1 w-full max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg p-1 space-y-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {timeOptions.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-slate-400 text-center">
              Sin horarios disponibles
            </div>
          ) : (
            timeOptions.map((opt) => {
              const isSelected =
                opt.hour === hourStr && opt.minute === minStr && opt.period === period;
              return (
                <button
                  key={`${opt.h24}:${opt.m}`}
                  type="button"
                  onClick={() => handleSelectOption(opt.h24, opt.m)}
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