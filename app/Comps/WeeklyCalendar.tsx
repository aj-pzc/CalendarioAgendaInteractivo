'use client';

import { useState } from 'react';

interface ReservationItem {
  id: string;
  titulo: string;
  startTime: Date | string;
  endTime: Date | string;
  horasSolicitadas?: number;
  recurso?: string | null;
  userId: string;
  companyId: string;
  user?: {
    id: string;
    nombre: string;
    departamento?: string | null;
    companyId?: string | null;
    role?: string;
  };
}

interface WeeklyCalendarProps {
  reservations: ReservationItem[];
  currentUserId: string;
  currentUserCompanyId: string | null;
  currentUserRole: string; // "USER", "ADMIN", o "MASTER"
}

// Helper independiente de Locale para evitar Hydration Mismatch en horas
const formatTime = (dateIso: string | Date) => {
  const d = new Date(dateIso);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12 || 12;
  const hourStr = String(hours).padStart(2, '0');

  return `${hourStr}:${minutes} ${period}`;
};

// Helper independiente para la fecha del encabezado
const formatDateHeader = (d: Date) => {
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
};

export default function WeeklyCalendar({
  reservations,
  currentUserId,
  currentUserCompanyId,
  currentUserRole,
}: WeeklyCalendarProps) {
  const [semanaOffset, setSemanaOffset] = useState(0);

  // Definición del horario de oficina
  const HORARIO_INICIO = 8.5; // 08:30 AM
  const HORARIO_FIN = 19.0;  // 07:00 PM
  const DURACION_TOTAL_HORAS = HORARIO_FIN - HORARIO_INICIO; // 10.5 horas

  // Tramos horarios para la columna lateral
  const bloquesHorarios = [
    '08:30', '09:30', '10:30', '11:30', '12:30',
    '13:30', '14:30', '15:30', '16:30', '17:30', '18:30'
  ];

  // Cálculo de fechas
  const hoy = new Date();
  hoy.setDate(hoy.getDate() + semanaOffset * 7);

  const diaSemana = hoy.getDay();
  const diffLunes = hoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
  const lunesReferencia = new Date(hoy.setDate(diffLunes));
  lunesReferencia.setHours(0, 0, 0, 0);

  const diasSemana = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(lunesReferencia);
    d.setDate(lunesReferencia.getDate() + i);
    return d;
  });

  const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  // Lógica exacta de visibilidad para los tres perfiles
  const canViewDetails = (reservation: ReservationItem) => {
    // 1. MASTER (Admin Global): Ve absolutamente todo sin restricciones
    if (currentUserRole === 'MASTER') return true;

    // 2. ADMIN (Administrador de Empresa): Ve sus reservas y las de todos los usuarios de su misma empresa
    if (currentUserRole === 'ADMIN') {
      if (currentUserCompanyId && reservation.companyId === currentUserCompanyId) {
        return true;
      }
      return false;
    }

    // 3. USER (Usuario Estándar): Únicamente ve los detalles de sus propias reservaciones
    if (currentUserRole === 'USER') {
      return reservation.userId === currentUserId;
    }

    return false;
  };

  // Cálculo de posición y altura porcentual
  function getPositionStyle(start: Date | string, end: Date | string) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const startHour = startDate.getHours() + startDate.getMinutes() / 60;
    const endHour = endDate.getHours() + endDate.getMinutes() / 60;

    const startMin = startHour * 60;
    const endMin = endHour * 60;

    return {
      startMin,
      endMin,
    };
  }

  // Algoritmo para calcular columnas paralelas cuando hay solapamientos
  const processDayReservations = (reservasDelDia: ReservationItem[]) => {
    const mapped = reservasDelDia.map((res) => {
      const pos = getPositionStyle(res.startTime, res.endTime);
      return { ...res, ...pos, colIndex: 0, totalCols: 1 };
    });

    // Ordenar por hora de inicio
    mapped.sort((a, b) => a.startMin - b.startMin);

    // Agrupar solapamientos
    for (let i = 0; i < mapped.length; i++) {
      const current = mapped[i];
      const concurrentGroup = [current];

      for (let j = 0; j < mapped.length; j++) {
        if (i === j) continue;
        const other = mapped[j];
        if (other.startMin < current.endMin && other.endMin > current.startMin) {
          if (!concurrentGroup.includes(other)) {
            concurrentGroup.push(other);
          }
        }
      }

      if (concurrentGroup.length > 1) {
        concurrentGroup.sort((a, b) => a.startMin - b.startMin || a.id.localeCompare(b.id));
        const total = concurrentGroup.length;
        concurrentGroup.forEach((item, idx) => {
          const target = mapped.find((m) => m.id === item.id);
          if (target) {
            target.totalCols = Math.max(target.totalCols, total);
            target.colIndex = Math.max(target.colIndex, idx);
          }
        });
      }
    }

    return mapped;
  };

  return (
    <div className="space-y-4">
      {/* Encabezado del Calendario y Leyenda */}
      <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Horarios de Ocupación
          </h2>
          <p className="text-xs text-slate-500">
            Horario hábil: 08:30 AM - 07:00 PM • Semana del{' '}
            <strong className="text-slate-700">
              {formatDateHeader(lunesReferencia)}
            </strong>
          </p>
        </div>

        {/* Indicadores de Visibilidad */}
        <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-slate-900 inline-block" />
            <span>Detalles Visibles</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-slate-100 border border-slate-300 inline-block" />
            <span>Espacio Ocupado</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSemanaOffset((prev) => prev - 1)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
          >
            ← Anterior
          </button>
          
          {semanaOffset !== 0 && (
            <button
              onClick={() => setSemanaOffset(0)}
              className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer"
            >
              Semana Actual
            </button>
          )}

          <button
            onClick={() => setSemanaOffset((prev) => prev + 1)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
          >
            Siguiente →
          </button>
        </div>
      </div>

      {/* Contenedor principal */}
      <div className="overflow-x-auto">
        <div className="min-w-[650px] border border-slate-200 rounded-xl bg-white overflow-hidden">
          
          {/* Cabecera de días */}
          <div className="grid grid-cols-6 bg-slate-50 border-b border-slate-200 text-center text-xs font-bold text-slate-700 py-2.5">
            <div className="text-slate-400 font-normal self-center">Hora</div>
            {diasSemana.map((dia, idx) => (
              <div key={idx} className="space-y-0.5">
                <div>{nombresDias[idx]}</div>
                <div className="text-[10px] text-slate-400 font-normal">
                  {dia.getDate()}/{dia.getMonth() + 1}
                </div>
              </div>
            ))}
          </div>

          {/* Cuerpo de la Cuadrícula */}
          <div className="grid grid-cols-6 relative">
            
            {/* Columna Lateral de Horas */}
            <div className="border-r border-slate-200 bg-slate-50/50">
              {bloquesHorarios.map((hora) => (
                <div
                  key={hora}
                  className="h-12 border-b border-slate-100 flex items-center justify-center text-[11px] font-mono text-slate-400"
                >
                  {hora}
                </div>
              ))}
            </div>

            {/* Columnas de Días (Lunes a Viernes) */}
            {diasSemana.map((dia, dayIdx) => {
              const rawReservasDelDia = reservations.filter((res) => {
                const resStart = new Date(res.startTime);
                return (
                  resStart.getDate() === dia.getDate() &&
                  resStart.getMonth() === dia.getMonth() &&
                  resStart.getFullYear() === dia.getFullYear()
                );
              });

              const reservasDelDia = processDayReservations(rawReservasDelDia);

              return (
                <div key={dayIdx} className="border-r border-slate-200 relative h-full bg-white">
                  {/* Filas de guía transparentes */}
                  {bloquesHorarios.map((hora) => (
                    <div key={hora} className="h-12 border-b border-slate-100" />
                  ))}

                  {/* Renderizado de Bloques de Reserva con Restricción por Permisos */}
                  {reservasDelDia.map((res) => {
                    const durationMinutes = res.endMin - res.startMin;
                    const isDetailed = canViewDetails(res);
                    const isSala = res.recurso === 'SALA';
                    
                    // Estilos según rol y visibilidad (Detallado vs Bloqueado Gris)
                    const bgClass = isDetailed
                      ? (isSala ? 'bg-slate-900 text-white border-slate-700' : 'bg-emerald-800 text-white border-emerald-600')
                      : 'bg-slate-100 text-slate-500 border-slate-200 select-none';

                    const startHour = res.startMin / 60;
                    const topRatio = Math.max(0, (startHour - HORARIO_INICIO) / DURACION_TOTAL_HORAS);
                    const heightRatio = Math.max(0, (durationMinutes / 60) / DURACION_TOTAL_HORAS);

                    // Etiqueta para el recurso ocupado en vista anonimizada
                    const recursoLabel = res.recurso === 'OFICINA' ? 'Oficina Ocupada' : 'Sala Ocupada';

                    return (
                      <div
                        key={res.id}
                        style={{
                          top: `${topRatio * 100}%`,
                          height: `${heightRatio * 100}%`,
                          left: `${(res.colIndex * 100) / res.totalCols}%`,
                          width: `calc(${100 / res.totalCols}% - 3px)`,
                        }}
                        className={`absolute rounded-md border shadow-2xs overflow-hidden flex flex-col justify-center px-1.5 py-0.5 hover:z-30 transition-all ${bgClass}`}
                        title={isDetailed ? `${res.titulo} (${formatTime(res.startTime)} - ${formatTime(res.endTime)})` : recursoLabel}
                      >
                        {isDetailed ? (
                          /* VISTA DETALLADA */
                          durationMinutes <= 15 ? (
                            <p className="font-semibold text-[7px] text-center truncate leading-tight opacity-95">
                              {res.titulo}
                            </p>
                          ) : durationMinutes === 30 ? (
                            <p className="font-semibold text-[10px] truncate leading-tight">
                              {res.titulo}
                            </p>
                          ) : (
                            <>
                              <p className="font-bold text-xs truncate leading-tight">
                                {res.titulo}
                              </p>
                              <p className="text-[10px] text-slate-200 truncate mt-0.5 opacity-90">
                                {formatTime(res.startTime)} - {formatTime(res.endTime)}
                              </p>
                            </>
                          )
                        ) : (
                          /* VISTA ANONIMIZADA (Bloque Gris con indicador del recurso) */
                          <div className="flex items-center justify-between h-full px-1">
                            <span className="font-semibold text-[10px] italic text-slate-600 truncate">
                              🔒 {recursoLabel}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

          </div>
        </div>
      </div>
    </div>
  );
}