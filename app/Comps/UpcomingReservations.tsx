'use client';

import { useState } from 'react';
import { deleteReservationAction, updateReservationAction } from '@/app/actions/reservations';
import DatePickerCustom from '@/app/Customs/DatePickerCustom';
import TimePickerCustom from '@/app/Customs/TimePickerCustom';

interface ReservationUser {
  id: string;
  nombre: string;
  departamento?: string | null;
  company?: {
    nombre: string;
  } | null;
}

interface ReservationItem {
  id: string;
  titulo: string;
  recurso?: string | null;
  startTime: Date | string;
  endTime: Date | string;
  horasSolicitadas?: number;
  estado?: string;
  userId: string;
  companyId: string;
  user?: ReservationUser | null;
  company?: {
    nombre: string;
  } | null;
}

interface UpcomingReservationsProps {
  reservations: ReservationItem[];
  currentUserId: string;
  currentUserCompanyId: string | null;
  currentUserRole: string; // "USER", "ADMIN", "MASTER"
}

const formatTime = (dateIso: string | Date) => {
  const d = new Date(dateIso);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const hourStr = String(hours).padStart(2, '0');
  return `${hourStr}:${minutes} ${period}`;
};

const formatDate = (dateIso: string | Date) => {
  const d = new Date(dateIso);
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return `${dias[d.getDay()]}, ${d.getDate()} ${meses[d.getMonth()]}`;
};

export default function UpcomingReservations({
  reservations,
  currentUserId,
  currentUserCompanyId,
  currentUserRole,
}: UpcomingReservationsProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [editingRes, setEditingRes] = useState<ReservationItem | null>(null);
  const [cancelingRes, setCancelingRes] = useState<ReservationItem | null>(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editRecurso, setEditRecurso] = useState<'SALA' | 'OFICINA'>('SALA');
  const [editFecha, setEditFecha] = useState<Date | null>(new Date());
  const [editStartTime, setEditStartTime] = useState<Date | null>(new Date());
  const [editEndTime, setEditEndTime] = useState<Date | null>(new Date());

  const isMaster = currentUserRole === 'MASTER';

  const canManage = (res: ReservationItem) => {
    if (isMaster) return true;
    if (currentUserRole === 'ADMIN' && res.companyId === currentUserCompanyId) return true;
    if (res.userId === currentUserId) return true;
    return false;
  };

  const handleDelete = async () => {
    if (!cancelingRes) return;

    const reservationId = cancelingRes.id;
    setLoadingId(reservationId);
    setFeedback(null);

    const res = await deleteReservationAction(reservationId);
    setLoadingId(null);
    setCancelingRes(null);

    if (res.success) {
      setFeedback({ type: 'success', message: 'Reserva cancelada exitosamente.' });
    } else {
      setFeedback({ type: 'error', message: res.error || 'Ocurrió un error.' });
    }
  };

  const handleOpenEditModal = (res: ReservationItem) => {
    setEditingRes(res);
    setEditTitulo(res.titulo);
    setEditRecurso((res.recurso as 'SALA' | 'OFICINA') || 'SALA');
    
    const startObj = new Date(res.startTime);
    const endObj = new Date(res.endTime);

    setEditFecha(startObj);
    setEditStartTime(startObj);
    setEditEndTime(endObj);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRes || !editFecha || !editStartTime || !editEndTime) return;

    setLoadingId(editingRes.id);
    setFeedback(null);

    const fullStart = new Date(editFecha);
    fullStart.setHours(editStartTime.getHours(), editStartTime.getMinutes(), 0, 0);

    const fullEnd = new Date(editFecha);
    fullEnd.setHours(editEndTime.getHours(), editEndTime.getMinutes(), 0, 0);

    const res = await updateReservationAction({
      id: editingRes.id,
      titulo: editTitulo,
      recurso: editRecurso,
      startTime: fullStart.toISOString(),
      endTime: fullEnd.toISOString(),
    });

    setLoadingId(null);
    setEditingRes(null);

    if (res.success) {
      setFeedback({ type: 'success', message: 'Reserva actualizada correctamente.' });
    } else {
      setFeedback({ type: 'error', message: res.error || 'No se pudo actualizar.' });
    }
  };

  const sortedReservations = [...reservations].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <div className="flex h-full min-h-0 flex-col space-y-4">
      <div className="border-b border-amber-100 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Próximas Reservas</h2>
          <p className="text-xs text-slate-500">
            {isMaster || currentUserRole === 'ADMIN'
              ? 'Listado de reservas activas.'
              : 'Tus próximas reservas programadas.'}
          </p>
        </div>
        <span className="text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg">
          {sortedReservations.length} {sortedReservations.length === 1 ? 'Reserva' : 'Reservas'}
        </span>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-amber-50 text-amber-900 border border-amber-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="font-bold opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {sortedReservations.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs">
          No hay próximas reservas registradas.
        </div>
      ) : (
        <div className="ccr-scroll-list min-h-0 max-h-[24rem] flex-1 space-y-3 overflow-y-auto pr-2">
          {sortedReservations.map((res) => {
            const isMyOwn = res.userId === currentUserId;
            const isSala = (res.recurso || 'SALA') === 'SALA';
            const allowManage = canManage(res);

            return (
              <div
                key={res.id}
                className="min-h-24 p-4 rounded-2xl border border-stone-200 bg-white hover:border-amber-300 transition shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        isSala
                          ? 'bg-slate-900 text-white border border-amber-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {res.recurso || 'SALA'}
                    </span>

                    <h3 className="text-xs font-bold text-slate-900">{res.titulo}</h3>

                    {isMyOwn && (
                      <span className="text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md">
                        Tuya
                      </span>
                    )}
                  </div>

                  {res.user && (currentUserRole === 'ADMIN' || isMaster) && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium pt-0.5">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{res.user.nombre}</span>
                      {res.user.departamento && (
                        <span className="text-slate-400">({res.user.departamento})</span>
                      )}
                      {(res.company?.nombre || res.user.company?.nombre)&& (
                        <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-semibold ml-1">
                          {res.company?.nombre || res.user.company?.nombre}
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-slate-500">
                    {formatDate(res.startTime)} • {formatTime(res.startTime)} - {formatTime(res.endTime)}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                    {res.estado || 'CONFIRMADA'}
                  </span>

                  {allowManage && (
                    <div className="flex items-center gap-1">
                      {/* Botón Modificar */}
                      <button
                        onClick={() => handleOpenEditModal(res)}
                        className="p-1.5 text-slate-400 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                        title="Modificar Reserva"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Botón Eliminar */}
                      <button
                        onClick={() => setCancelingRes(res)}
                        disabled={loadingId === res.id}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer disabled:opacity-50"
                        title="Cancelar Reserva"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cancelingRes && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-reservation-title"
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 space-y-5"
          >
            <div className="border-b border-slate-100 pb-3">
              <h3 id="cancel-reservation-title" className="text-base font-bold text-slate-900">
                Cancelar reserva
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                ¿Confirmas que deseas cancelar esta reserva?
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1">
              <p className="text-xs font-semibold text-slate-900">{cancelingRes.titulo}</p>
              <p className="text-[11px] text-slate-600">
                {cancelingRes.recurso || 'SALA'} · {formatDate(cancelingRes.startTime)} ·{' '}
                {formatTime(cancelingRes.startTime)} - {formatTime(cancelingRes.endTime)}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCancelingRes(null)}
                disabled={loadingId === cancelingRes.id}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loadingId === cancelingRes.id}
                className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {loadingId === cancelingRes.id ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Modificación*/}
      {editingRes && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Modificar Reserva</h3>
              <p className="text-xs text-slate-500">Actualiza los detalles o el horario del espacio.</p>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivo / Título</label>
                <input
                  type="text"
                  required
                  value={editTitulo}
                  onChange={(e) => setEditTitulo(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 bg-white font-medium text-slate-900 ${
                    editRecurso === 'SALA'
                      ? 'focus:ring-slate-900/10 focus:border-amber-400'
                      : 'focus:ring-amber-700/10 focus:border-amber-700'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Espacio</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditRecurso('SALA')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                      editRecurso === 'SALA'
                        ? 'bg-slate-900 text-white border-amber-400'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Sala de Juntas
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditRecurso('OFICINA')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                      editRecurso === 'OFICINA'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-white text-slate-600 border-amber-300 hover:bg-amber-50'
                    }`}
                  >
                    Oficina
                  </button>
                </div>
              </div>

              <DatePickerCustom
                label="Fecha de Reserva"
                value={editFecha}
                openUp={true}
                onChange={(date) => setEditFecha(date)}
                minDate={isMaster ? undefined : new Date()}
                recurso={editRecurso}
              />

              <div className="grid grid-cols-2 gap-3">
                <TimePickerCustom
                  label="Hora de Inicio"
                  value={editStartTime}
                  onChange={(date) => setEditStartTime(date)}
                  recurso={editRecurso}
                  fechaSeleccionada={editFecha}
                  allowPastTimes={isMaster}
                />
                <TimePickerCustom
                  label="Hora de Fin"
                  value={editEndTime}
                  onChange={(date) => setEditEndTime(date)}
                  recurso={editRecurso}
                  fechaSeleccionada={editFecha}
                  allowPastTimes={isMaster}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRes(null)}
                  disabled={loadingId === editingRes.id}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingId === editingRes.id}
                  className="w-1/2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {loadingId === editingRes.id ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}