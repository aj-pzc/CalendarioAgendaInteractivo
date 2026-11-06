'use client';

import { useState } from 'react';
import {
  deleteCompanyAction,
  updateCompanyHoursAction,
  updateCompanyNameAction,
} from '@/app/actions/master';
import CustomSelect from '@/app/Customs/CustomSelect';

interface CompanyItem {
  id: string;
  nombre: string;
  horasDisponibles: number;
  horasUsadas: number;
  _count: { users: number; reservations: number };
}

export default function CompanyManagementList({ companies }: { companies: CompanyItem[] }) {
  const [deletingCompany, setDeletingCompany] = useState<CompanyItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [adjustingCompanyId, setAdjustingCompanyId] = useState<string | null>(null);
  const [hoursFeedback, setHoursFeedback] = useState<{ message: string; error: boolean } | null>(null);
  const [hoursActions, setHoursActions] = useState<Record<string, string>>({});
  const [renamingCompanyId, setRenamingCompanyId] = useState<string | null>(null);
  const [nameFeedback, setNameFeedback] = useState<Record<string, { message: string; error: boolean }>>({});

  const handleUpdateHours = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (adjustingCompanyId) return;

    const formData = new FormData(event.currentTarget);
    const companyId = formData.get('companyId');
    if (typeof companyId !== 'string' || !companyId) {
      setHoursFeedback({ message: 'No se pudo identificar la empresa.', error: true });
      return;
    }

    setAdjustingCompanyId(companyId);
    setHoursFeedback(null);

    try {
      const result = await updateCompanyHoursAction(formData);
      if (result?.error) {
        setHoursFeedback({ message: result.error, error: true });
      } else {
        setHoursFeedback({ message: 'Balance actualizado.', error: false });
      }
    } catch (error) {
      console.error('Error al ajustar horas de la empresa:', error);
      setHoursFeedback({
        message: 'No se pudieron actualizar las horas. Inténtalo nuevamente.',
        error: true,
      });
    } finally {
      setAdjustingCompanyId(null);
    }
  };

  const handleUpdateCompanyName = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (renamingCompanyId) return;

    const formData = new FormData(event.currentTarget);
    const companyId = formData.get('companyId');
    if (typeof companyId !== 'string' || !companyId) return;

    setRenamingCompanyId(companyId);
    setNameFeedback((feedback) => ({ ...feedback, [companyId]: { message: '', error: false } }));
    try {
      const result = await updateCompanyNameAction(formData);
      setNameFeedback((feedback) => ({
        ...feedback,
        [companyId]: result?.error
          ? { message: result.error, error: true }
          : { message: 'Nombre actualizado.', error: false },
      }));
    } catch (error) {
      console.error('Error al renombrar empresa:', error);
      setNameFeedback((feedback) => ({
        ...feedback,
        [companyId]: { message: 'No se pudo actualizar el nombre. Inténtalo nuevamente.', error: true },
      }));
    } finally {
      setRenamingCompanyId(null);
    }
  };

  const handleDeleteCompany = async () => {
    if (!deletingCompany || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);
    const formData = new FormData();
    formData.set('companyId', deletingCompany.id);

    try {
      const result = await deleteCompanyAction(formData);
      if (result?.error) {
        setDeleteError(result.error);
        return;
      }
      setDeletingCompany(null);
    } catch (error) {
      console.error('Error al eliminar empresa:', error);
      setDeleteError('Ocurrió un error al eliminar la empresa. Inténtalo nuevamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {hoursFeedback && (
        <div
          role={hoursFeedback.error ? 'alert' : 'status'}
          className={`rounded-xl border px-3 py-2 text-xs ${
            hoursFeedback.error
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
        >
          {hoursFeedback.message}
        </div>
      )}
      <div className="ccr-scroll-list max-h-[36rem] space-y-3 overflow-y-auto pr-2 md:max-h-[20rem]">
        {companies.map((comp) => (
          <div
            key={comp.id}
            className="min-h-24 p-4 rounded-xl border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-stone-50"
          >
            <div className="min-w-0 flex-1">
              <form onSubmit={handleUpdateCompanyName} className="flex items-center gap-2">
                <input type="hidden" name="companyId" value={comp.id} />
                <input
                  type="text"
                  name="nombre"
                  defaultValue={comp.nombre}
                  required
                  aria-label={`Nombre de empresa ${comp.nombre}`}
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-amber-600 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={renamingCompanyId !== null}
                  className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {renamingCompanyId === comp.id ? '...' : 'Guardar'}
                </button>
              </form>
              {nameFeedback[comp.id]?.message && (
                <p
                  role={nameFeedback[comp.id].error ? 'alert' : 'status'}
                  className={`mt-1 text-[10px] ${nameFeedback[comp.id].error ? 'text-rose-700' : 'text-emerald-700'}`}
                >
                  {nameFeedback[comp.id].message}
                </p>
              )}
              <p className="text-[11px] text-slate-500">
                {comp._count.users} usuarios • {comp._count.reservations} reservas
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between">
              <div className="text-right">
                <span className="text-xs font-black text-slate-900">{comp.horasDisponibles} hrs</span>
                <p className="text-[10px] text-slate-400">Bolsa</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-amber-700">{comp.horasUsadas || 0} hrs</span>
                <p className="text-[10px] text-slate-400">Usadas</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-emerald-700">
                  {Number((comp.horasDisponibles - comp.horasUsadas).toFixed(2))} hrs
                </span>
                <p className="text-[10px] text-slate-400">Restantes</p>
              </div>

              <form
                onSubmit={handleUpdateHours}
                className="flex items-center gap-1"
              >
                <input type="hidden" name="companyId" value={comp.id} />
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  name="cantidad"
                  defaultValue="5"
                  required
                  className="w-14 px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-center font-medium"
                />
                <CustomSelect
                  name="tipoAccion"
                  value={hoursActions[comp.id] || 'SUMAR_DISPONIBLES'}
                  onChange={(value) => setHoursActions((actions) => ({ ...actions, [comp.id]: value }))}
                  options={[
                    { value: 'SUMAR_DISPONIBLES', label: '+ Bolsa' },
                    { value: 'RESTAR_DISPONIBLES', label: '- Bolsa' },
                    { value: 'SUMAR_USADAS', label: '+ Usadas' },
                    { value: 'RESTAR_USADAS', label: '- Usadas' },
                  ]}
                  className="w-28"
                  buttonClassName="border-amber-200 bg-white text-slate-700 hover:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={adjustingCompanyId !== null}
                  className="px-2.5 py-1.5 bg-slate-900 text-white text-[11px] font-semibold rounded-lg hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
                >
                  {adjustingCompanyId === comp.id ? '...' : 'OK'}
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setDeletingCompany(comp);
                }}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition cursor-pointer"
                title="Eliminar Empresa"
                aria-label={`Eliminar empresa ${comp.nombre}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {deletingCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-company-title"
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 space-y-5"
          >
            <div className="border-b border-slate-100 pb-3">
              <h3 id="delete-company-title" className="text-base font-bold text-slate-900">
                Eliminar empresa
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Esta acción eliminará la empresa, sus usuarios y sus reservaciones. No se puede deshacer.
              </p>
            </div>

            <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
              <p className="text-xs font-semibold text-rose-900">{deletingCompany.nombre}</p>
              <p className="text-[11px] text-rose-700">
                {deletingCompany._count.users} usuarios · {deletingCompany._count.reservations} reservas
              </p>
            </div>

            {deleteError && (
              <p role="alert" className="text-xs text-rose-700">
                {deleteError}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeletingCompany(null)}
                disabled={isDeleting}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleDeleteCompany}
                disabled={isDeleting}
                className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
