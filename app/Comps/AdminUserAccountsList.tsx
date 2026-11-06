'use client';

import { useState } from 'react';
import { updateCompanyUserCredentialsAction } from '@/app/actions/master';

interface ManagedUser {
  id: string;
  nombre: string;
  username: string;
  email: string;
}

export default function AdminUserAccountsList({ users }: { users: ManagedUser[] }) {
  const [feedback, setFeedback] = useState<Record<string, { success?: string; error?: string }>>({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>, userId: string) => {
    event.preventDefault();
    if (savingUserId) return;

    const formElement = event.currentTarget;
    setSavingUserId(userId);
    setFeedback((previous) => ({ ...previous, [userId]: {} }));
    try {
      const result = await updateCompanyUserCredentialsAction(new FormData(formElement));
      setFeedback((previous) => ({
        ...previous,
        [userId]: result.error
          ? { error: result.error }
          : { success: 'Cuenta actualizada.' },
      }));
      if (!result.error) formElement.reset();
    } catch (error) {
      console.error('Error al guardar la cuenta del usuario:', error);
      setFeedback((previous) => ({
        ...previous,
        [userId]: { error: 'Ocurrió un error al guardar los cambios.' },
      }));
    } finally {
      setSavingUserId(null);
    }
  };

  if (users.length === 0) {
    return <p className="text-xs text-slate-500">No hay cuentas de usuario estándar en tu empresa.</p>;
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <form
          key={user.id}
          onSubmit={(event) => handleSubmit(event, user.id)}
          className="rounded-2xl border border-stone-200 bg-white p-4"
        >
          <input type="hidden" name="userId" value={user.id} />
          <div className="mb-3">
            <h2 className="text-sm font-bold text-slate-900">{user.nombre}</h2>
            <p className="text-[11px] text-slate-500">Actualiza el usuario, correo o contraseña.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-[11px] font-semibold text-slate-600">
              Usuario
              <input
                name="username"
                defaultValue={user.username}
                required
                className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-900 focus:border-amber-700 focus:outline-none"
              />
            </label>
            <label className="text-[11px] font-semibold text-slate-600">
              Correo electrónico
              <input
                name="email"
                type="email"
                defaultValue={user.email}
                required
                className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-900 focus:border-amber-700 focus:outline-none"
              />
            </label>
            <label className="text-[11px] font-semibold text-slate-600">
              Nueva contraseña (opcional)
              <input
                name="newPassword"
                type="password"
                minLength={8}
                autoComplete="new-password"
                className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-900 focus:border-amber-700 focus:outline-none"
              />
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={savingUserId !== null}
                className="w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {savingUserId === user.id ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
          {feedback[user.id]?.error && (
            <p role="alert" className="mt-3 text-xs text-rose-700">{feedback[user.id].error}</p>
          )}
          {feedback[user.id]?.success && (
            <p role="status" className="mt-3 text-xs text-emerald-700">{feedback[user.id].success}</p>
          )}
        </form>
      ))}
    </div>
  );
}
