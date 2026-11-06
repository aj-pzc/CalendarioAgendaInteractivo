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
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

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
    setUpdateError(null);
  };

  const handleConfirmUpdate = async () => {
    if (!modalData.formData) return;

    setIsUpdating(true);
    setUpdateError(null);
    try {
      const result = await updateAction(modalData.formData);
      if (result?.error) {
        setUpdateError(result.error);
        setModalData({ isOpen: false, userId: '', userName: '', formData: null });
        return;
      }
      setModalData({ isOpen: false, userId: '', userName: '', formData: null });
      setUpdateError(null);
    } catch (error) {
      console.error('Error al actualizar:', error);
      setUpdateError('Ocurrió un error al guardar los cambios.');
    } finally {
      setIsUpdating(false);
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
    <>
      {updateError && (
        <p role="alert" className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {updateError}
        </p>
      )}
      <div className="ccr-scroll-list max-h-[36rem] space-y-3 overflow-y-auto pr-2 md:max-h-[20rem]">
        {users.map((u) => {
          const isSelf = u.id === currentSessionUserId;

          return (
            <form
              key={u.id}
              id={`user-edit-${u.id}`}
              onSubmit={(e) => handleOpenModal(e, u.nombre, u.id)}
              className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs transition hover:border-amber-300 lg:grid-cols-[minmax(10rem,0.6fr)_minmax(0,2.8fr)_minmax(8rem,auto)] lg:items-center"
            >
              <input type="hidden" name="userId" value={u.id} />

              <div className="flex min-w-0 flex-col justify-center space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900">{u.nombre}</h3>
                  {isSelf && (
                    <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-900">
                      Tú
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">@{u.username}</p>
                <p className="break-all text-[11px] text-slate-500">{u.email}</p>
                <p className="text-[11px] font-medium text-slate-600">
                  Depto: <span className="text-slate-800">{u.departamento || 'General'}</span>
                </p>
              </div>

              <div className="grid min-w-0 gap-2.5">
                <div className="grid gap-2 sm:grid-cols-3">
                  <label className="text-[10px] font-semibold text-slate-600">
                    Nombre de usuario
                    <input
                      name="username"
                      defaultValue={u.username}
                      required
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-900 focus:border-amber-600 focus:outline-none"
                    />
                  </label>
                  <label className="text-[10px] font-semibold text-slate-600">
                    Correo electrónico
                    <input
                      name="email"
                      type="email"
                      defaultValue={u.email}
                      required
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-900 focus:border-amber-600 focus:outline-none"
                    />
                  </label>
                  <label className="text-[10px] font-semibold text-slate-600">
                    Nueva contraseña
                    <input
                      name="newPassword"
                      type="password"
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Opcional"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-900 focus:border-amber-600 focus:outline-none"
                    />
                  </label>
                </div>

                <div className="grid gap-2 sm:grid-cols-[minmax(0,1.5fr)_minmax(7rem,0.75fr)_minmax(8rem,0.9fr)]">
                  <div>
                    <span className="mb-1 block text-[10px] font-semibold text-slate-600">Empresa</span>
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

                  <div>
                    <span className="mb-1 block text-[10px] font-semibold text-slate-600">Rol</span>
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
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : u.role === 'ADMIN'
                          ? 'bg-orange-100 text-orange-900 border-orange-300'
                          : 'bg-zinc-50 text-zinc-700 border-zinc-200'
                      }
                    />
                  </div>

                  <div>
                    <span className="mb-1 block text-[10px] font-semibold text-slate-600">Aprobación</span>
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
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 lg:justify-self-end">
                <button
                  type="submit"
                  className="flex h-[34px] items-center justify-center rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-slate-800"
                >
                  Guardar
                </button>
                {!isSelf ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(null);
                      setDeletingUser(u);
                    }}
                    className="flex h-[34px] w-[34px] items-center justify-center rounded-xl border border-stone-200 p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    title="Eliminar usuario"
                    aria-label={`Eliminar usuario ${u.nombre}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                ) : null}
              </div>
            </form>
          );
        })}
      </div>

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
                disabled={isUpdating}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmUpdate}
                disabled={isUpdating}
                className="w-1/2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-xl transition shadow-xs cursor-pointer"
              >
                {isUpdating ? 'Guardando...' : 'Confirmar'}
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
    </>
  );
}