  'use client';

  import { useState, useEffect } from 'react';
  import TimePickerCustom from'@/app/Customs/TimePickerCustom';
  import DatePickerCustom from '@/app/Customs/DatePickerCustom';
  import { createReservation } from '@/app/actions/reservations';
  import CustomSelect from '../Customs/CustomSelect';

  interface ReservationFormProps {
    isMaster?: boolean;
    companies?: { id: string; nombre: string }[];
    busySlots?: { startTime: string; endTime: string; recurso: string }[];
  }

  export default function ReservationForm({
    isMaster = false,
    companies = [],
    busySlots = [],
  }: ReservationFormProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [feedback, setFeedback] = useState<{
      type: 'success' | 'error';
      message: string;
    } | null>(null);

    // Campos del Formulario
    const [titulo, setTitulo] = useState('');
    const [recurso, setRecurso] = useState<'SALA' | 'OFICINA'>('SALA');
    const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(new Date());

    const getInitialStartAndEndTimes = (fechaBase: Date | null) => {
      const base = fechaBase ? new Date(fechaBase) : new Date();
      const ahora = new Date();

      const esHoy =
        base.getFullYear() === ahora.getFullYear() &&
        base.getMonth() === ahora.getMonth() &&
        base.getDate() === ahora.getDate();

      let startTotalMinutes = 8.5 * 60; // 08:30 AM

      if (esHoy) {
        const minBloqueActual = Math.floor(ahora.getMinutes() / 15) * 15;
        const currentMinutes = ahora.getHours() * 60 + minBloqueActual;
        if (currentMinutes >= 8.5 * 60 && currentMinutes < 19 * 60) {
          startTotalMinutes = currentMinutes;
        }
      }

      const start = new Date(base);
      start.setHours(Math.floor(startTotalMinutes / 60), startTotalMinutes % 60, 0, 0);

      const endTotalMinutes = Math.min(19 * 60, startTotalMinutes + 30);
      const end = new Date(base);
      end.setHours(Math.floor(endTotalMinutes / 60), endTotalMinutes % 60, 0, 0);

      return { start, end };
    };

    const initialTimes = getInitialStartAndEndTimes(fechaSeleccionada);
    const [startTime, setStartTime] = useState<Date | null>(initialTimes.start);
    const [endTime, setEndTime] = useState<Date | null>(initialTimes.end);

    const handleDateChange = (date: Date | null) => {
      setFechaSeleccionada(date);
      const { start, end } = getInitialStartAndEndTimes(date);
      setStartTime(start);
      setEndTime(end);
    };

    useEffect(() => {
      if (feedback) {
        const timer = setTimeout(() => setFeedback(null), 5000);
        return () => clearTimeout(timer);
      }
    }, [feedback]);

    const esDiaPasado = (fecha: Date) => {
      if (isMaster) return false;
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const fechaEvaluada = new Date(fecha);
      fechaEvaluada.setHours(0, 0, 0, 0);

      return fechaEvaluada < hoy;
    };

    const esFechaHoraPasada = (fechaBase: Date, horaSeleccionada: Date) => {
      if (isMaster) return false;

      const ahora = new Date();
      const esHoy =
        fechaBase.getFullYear() === ahora.getFullYear() &&
        fechaBase.getMonth() === ahora.getMonth() &&
        fechaBase.getDate() === ahora.getDate();

      if (!esHoy) return false;

      const minBloqueActual = Math.floor(ahora.getMinutes() / 15) * 15;
      const limiteMinimoBloque = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate(),
        ahora.getHours(),
        minBloqueActual,
        0,
        0
      );

      const fechaEvaluada = new Date(
        fechaBase.getFullYear(),
        fechaBase.getMonth(),
        fechaBase.getDate(),
        horaSeleccionada.getHours(),
        horaSeleccionada.getMinutes(),
        0,
        0
      );

      return fechaEvaluada < limiteMinimoBloque;
    };

    const calcularHoras = () => {
      if (!startTime || !endTime) return 0;
      const diffMs = endTime.getTime() - startTime.getTime();
      return Math.max(0, diffMs / (1000 * 60 * 60));
    };

    const horasSolicitadas = calcularHoras();

    const handleNextStep = (e: React.FormEvent) => {
      e.preventDefault();

      if (!titulo.trim() || !fechaSeleccionada) {
        setFeedback({
          type: 'error',
          message: 'Por favor, completa el título y selecciona una fecha.',
        });
        return;
      }

      if (esDiaPasado(fechaSeleccionada)) {
        setFeedback({
          type: 'error',
          message: 'No puedes agendar citas en días anteriores al día de hoy.',
        });
        return;
      }

      setFeedback(null);
      setStep(2);
    };

    const handleOpenConfirmation = (e: React.FormEvent) => {
      e.preventDefault();
      if (!startTime || !endTime || !fechaSeleccionada) return;

      if (horasSolicitadas <= 0) {
        setFeedback({
          type: 'error',
          message: 'La hora de fin debe ser posterior a la hora de inicio.',
        });
        return;
      }

      if (esFechaHoraPasada(fechaSeleccionada, startTime)) {
        setFeedback({
          type: 'error',
          message: 'El horario seleccionado ya ha transcurrido.',
        });
        return;
      }

      setFeedback(null);
      setShowModal(true);
    };

    const handleConfirmReservation = async () => {
    if (!fechaSeleccionada || !startTime || !endTime) return;
    
    if (isMaster && !selectedCompanyId) {
      setFeedback({ type: 'error', message: 'Por favor selecciona la empresa a la que se le descontarán las horas.' });
      return;
    }

    setLoading(true);

    const fullStart = new Date(fechaSeleccionada);
    fullStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

    const fullEnd = new Date(fechaSeleccionada);
    fullEnd.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

    const res = await createReservation({
      titulo,
      recurso,
      startTime: fullStart.toISOString(),
      endTime: fullEnd.toISOString(),
      targetCompanyId: isMaster ? selectedCompanyId : undefined, 
    });

    setLoading(false);
    setShowModal(false);

    if (res.success) {
      setFeedback({
        type: 'success',
        message: '¡Reserva confirmada con éxito!',
      });
      setTitulo('');
      setRecurso('SALA');
      setSelectedCompanyId(''); // <--- Limpiamos el select
      handleDateChange(new Date());
      setStep(1);
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Ocurrió un error al procesar la reserva.',
      });
    }
  };

    return (
      <div className="space-y-4">
        {feedback && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="ml-2 font-bold opacity-60 hover:opacity-100 transition"
            >
              ✕
            </button>
          </div>
        )}

        {/* Indicador de Pasos Interactivo */}
        <div className="grid grid-cols-2 gap-2 border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
              step === 1
                ? 'bg-slate-100/80 font-bold'
                : 'bg-transparent hover:bg-slate-50 opacity-70 hover:opacity-100'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center transition-colors ${
                step === 1 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              1
            </span>
            <span className={`text-xs ${step === 1 ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
              General
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!titulo.trim() || !fechaSeleccionada) {
                setFeedback({
                  type: 'error',
                  message: 'Completa el título y la fecha en el Paso 1 antes de seleccionar horario.',
                });
                return;
              }
              setFeedback(null);
              setStep(2);
            }}
            className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
              step === 2
                ? 'bg-slate-100/80 font-bold'
                : 'bg-transparent hover:bg-slate-50 opacity-70 hover:opacity-100'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center transition-colors ${
                step === 2 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              2
            </span>
            <span className={`text-xs ${step === 2 ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
              Horario
            </span>
          </button>
        </div>

        {step === 1 ? (
          <form onSubmit={handleNextStep} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Título / Motivo de la Reunión
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Revisión Trimestral de Proyecto"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selecciona el Espacio
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRecurso('SALA')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                    recurso === 'SALA'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Sala de Juntas
                </button>
                <button
                  type="button"
                  onClick={() => setRecurso('OFICINA')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                    recurso === 'OFICINA'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Oficina
                </button>
              </div>
            </div>

            {isMaster && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Asignar a Empresa
              </label>
              <CustomSelect
                value={selectedCompanyId}
                onChange={(val) => setSelectedCompanyId(val)}
                options={companies.map(c => ({ value: c.id, label: c.nombre }))}
                placeholder="Selecciona la empresa destino..."
              />
            </div>
             )}

            <DatePickerCustom
              label="Fecha de Reserva"
              value={fechaSeleccionada}
              onChange={handleDateChange}
              minDate={isMaster ? undefined : new Date()}
            />

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-3 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Siguiente</span>
              <span>→</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleOpenConfirmation} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="text-[11px] text-slate-500">Resumen parcial:</p>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900 truncate">{titulo}</p>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-800 rounded-md">
                  {recurso === 'SALA' ? 'Sala' : 'Oficina'}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {fechaSeleccionada?.toLocaleDateString('es-MX', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <TimePickerCustom
                label="Hora de Inicio"
                value={startTime}
                onChange={(date) => {
                  setStartTime(date);
                  if (endTime && date.getTime() >= endTime.getTime()) {
                    const nextEnd = new Date(date);
                    nextEnd.setMinutes(nextEnd.getMinutes() + 30);
                    setEndTime(nextEnd);
                  }
                }}
                recurso={recurso}
                busySlots={busySlots}
                fechaSeleccionada={fechaSeleccionada}
                allowPastTimes={isMaster}
              />
              <TimePickerCustom
                label="Hora de Fin"
                value={endTime}
                onChange={(date) => setEndTime(date)}
                recurso={recurso}
                busySlots={busySlots}
                fechaSeleccionada={fechaSeleccionada}
                allowPastTimes={isMaster}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-3 rounded-xl transition cursor-pointer"
              >
                ← Volver
              </button>
              <button
                type="submit"
                className="w-2/3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-3 rounded-xl transition shadow-xs cursor-pointer"
              >
                Revisar y Confirmar
              </button>
            </div>
          </form>
        )}

        {/* Modal de Confirmación */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Confirmar Reserva</h3>
                <p className="text-xs text-slate-500">Verifica el desglose de horas antes de agendar.</p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Motivo:</span>
                  <span className="font-semibold text-slate-900 truncate max-w-[180px]">{titulo}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Espacio:</span>
                  <span className="font-semibold text-slate-900">
                    {recurso === 'SALA' ? 'Sala de Juntas' : 'Oficina'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Fecha:</span>
                  <span className="font-semibold text-slate-900">
                    {fechaSeleccionada?.toLocaleDateString('es-MX')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Horario:</span>
                  <span className="font-semibold text-slate-900">
                    {startTime?.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })} -{' '}
                    {endTime?.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                </div>
                <div className="flex justify-between py-2 bg-slate-50 px-3 rounded-xl border border-slate-100 mt-2">
                  <span className="font-bold text-slate-700">Horas a descontar:</span>
                  <span className="font-black text-slate-900">{horasSolicitadas} hr(s)</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReservation}
                  disabled={loading}
                  className="w-1/2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold text-xs py-2.5 rounded-xl transition shadow-xs cursor-pointer"
                >
                  {loading ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }