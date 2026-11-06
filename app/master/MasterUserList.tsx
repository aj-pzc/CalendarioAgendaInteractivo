'use client';

import { useState } from 'react';
import CustomSelect from '@/app/Customs/CustomSelect';

interface CompanyItem {
  id: string;
  nombre: string;
}

interface UserItem {
  id: string;
  nombre: string;
  username: string;
  email: string;
  departamento?: string | null;
  role: string;
  isApproved: boolean;
  companyId?: string | null;
}

interface MasterUsersListProps {
  users: UserItem[];
  companies: CompanyItem[];
  currentSessionUserId: string;
  updateAction: (formData: FormData) => Promise<{ success?: boolean; error?: string } | void>;
  deleteAction: (formData: FormData) => Promise<{ success?: boolean; error?: string }>;
}

export default function MasterUsersList({
  users,
  companies,
  currentSessionUserId,
  updateAction,
  deleteAction,
}: MasterUsersListProps) {
  // Estado para controlar el modal de confirmación de edición
  const [modalData, setModalData] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
    formData: FormData | null;
  }>({
    isOpen: false,
    userId: '',
    userName: '',
    formData: null,
  });
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleOpenModal = (e: React.FormEvent<HTMLFormElement>, userName: string, userId: string) => {
    e.preventDefault();
    const formElement = e.currentTarget;
    const formData = new FormData(formElement);

    setModalData({
      isOpen: true,
      userId,
      userName,
      formData,
    });
  };

  const handleConfirmUpdate = async () => {
    if (!modalData.formData) return;

    try {
      await updateAction(modalData.formData);
    } catch (error) {
      console.error('Error al actualizar:', error);
    } finally {
      setModalData({ isOpen: false, userId: '', userName: '', formData: null });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);
    const formData = new FormData();
    formData.set('userId', deletingUser.id);

    try {
      const result = await deleteAction(formData);
      if (result.error) {
        setDeleteError(result.error);
        return;
      }
      setDeletingUser(null);
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      setDeleteError('Ocurrió un error al eliminar el usuario. Inténtalo nuevamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {users.map((u) => {
        const isSelf = u.id === currentSessionUserId;

        return (
          <div
            key={u.id}
            className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            {/* Datos del Usuario */}
            <div className="space-y-0.5 min-w-[220px]">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-900">{u.nombre}</h3>
                {isSelf && (
                  <span className="text-[9px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded font-bold">
                    Tú
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">@{u.username} • {u.email}</p>
              <p className="text-[11px] font-medium text-slate-600">
                Depto: <span className="text-slate-800">{u.departamento || 'General'}</span>
              </p>
            </div>

            {/* Controles Centrales (Empresa, Rol, Estatus y Guardar) */}
            <form 
              onSubmit={(e) => handleOpenModal(e, u.nombre, u.id)} 
              className="flex flex-wrap items-center gap-2.5 w-full md:w-auto"
            >
              <input type="hidden" name="userId" value={u.id} />

              {/* 1. Selector de Empresa */}
              <div className="w-40">
                <CustomSelect
                  name="companyId"
                  value={u.companyId || ''}
                  options={[
                    { value: '', label: 'Sin Empresa' },
                    ...companies.map((c) => ({ value: c.id, label: c.nombre }))
                  ]}
                  placeholder="Sin Empresa"
                />
              </div>          

              {/* 2. Selector de Rol */}
              <div className="w-32">
                <CustomSelect
                  name="role"
                  value={u.role}
                  options={[
                    { value: 'USER', label: 'USER' },
                    { value: 'ADMIN', label: 'ADMIN' },
                    { value: 'MASTER', label: 'MASTER' },
                  ]}
                  buttonClassName={
                    u.role === 'MASTER'
                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                      : u.role === 'ADMIN'
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : 'bg-slate-50/50 text-slate-700 border-slate-200'
                  }
                />
              </div>         

              {/* 3. Selector de Aprobación */}
              <div className="w-32">
                <CustomSelect
                  name="isApproved"
                  value={String(u.isApproved)}
                  options={[
                    { value: 'true', label: 'Aprobado' },
                    { value: 'false', label: 'Pendiente' },
                  ]}
                  buttonClassName={
                    u.isApproved 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }
                />
              </div>             
              
              {/* Botón Guardar Cambios (Altura unificada a 34px) */}
              <div>
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition shadow-2xs cursor-pointer h-[34px] flex items-center justify-center"
                >
                  Guardar
                </button>
              </div>
            </form>

            {/* Botón Eliminar */}
            <div className="self-end md:self-center min-w-[34px] flex justify-center">
              {!isSelf ? (
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setDeletingUser(u);
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition cursor-pointer flex items-center justify-center h-[34px] w-[34px]"
                  title="Eliminar usuario"
                  aria-label={`Eliminar usuario ${u.nombre}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              ) : (
                <div className="w-[34px]" />
              )}
            </div>
          </div>
        );
      })}

      {/* Modal de Confirmación de Cambios */}
      {modalData.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Confirmar Actualización</h3>
              <p className="text-xs text-slate-500">¿Estás seguro de guardar los cambios para el usuario <span className="font-semibold text-slate-800">{modalData.userName}</span>?</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalData({ isOpen: false, userId: '', userName: '', formData: null })}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmUpdate}
                className="w-1/2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-xl transition shadow-xs cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-user-title"
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 space-y-5"
          >
            <div className="border-b border-slate-100 pb-3">
              <h3 id="delete-user-title" className="text-base font-bold text-slate-900">
                Eliminar usuario
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Esta acción es permanente y no se puede deshacer.
              </p>
            </div>

            <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 space-y-0.5">
              <p className="text-xs font-semibold text-rose-900">{deletingUser.nombre}</p>
              <p className="text-[11px] text-rose-700">
                @{deletingUser.username} · {deletingUser.email}
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
                onClick={() => setDeletingUser(null)}
                disabled={isDeleting}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}