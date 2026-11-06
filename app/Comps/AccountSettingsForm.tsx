'use client';

import { useActionState } from 'react';
import { updateOwnAccountAction } from '@/app/actions/auth';
import PasswordInput from '@/app/Customs/PasswordInput';

interface AccountSettingsFormProps {
  username: string;
  email: string;
}

export default function AccountSettingsForm({ username, email }: AccountSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updateOwnAccountAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
          {state.success}
        </p>
      )}

      <label className="block text-xs font-semibold text-slate-700">
        Nombre de usuario
        <input
          name="username"
          defaultValue={username}
          required
          autoComplete="username"
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-medium text-slate-900 focus:border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-700/10"
        />
      </label>

      <label className="block text-xs font-semibold text-slate-700">
        Correo electrónico
        <input
          name="email"
          type="email"
          defaultValue={email}
          required
          autoComplete="email"
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-medium text-slate-900 focus:border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-700/10"
        />
      </label>

      <div className="border-t border-slate-100 pt-4">
        <p className="mb-3 text-xs text-slate-500">
          Para cambiar la contraseña, llena los campos nuevos. Déjalos vacíos para conservarla.
        </p>
        <div className="space-y-3">
          <PasswordInput
            name="newPassword"
            label="Nueva contraseña"
            required={false}
            placeholder="Mínimo 8 caracteres"
          />
          <PasswordInput
            name="confirmPassword"
            label="Confirmar nueva contraseña"
            required={false}
            placeholder="Repite la nueva contraseña"
          />
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <p className="mb-3 text-xs text-slate-600">
          Confirma tu identidad con tu contraseña actual para guardar cambios.
        </p>
        <PasswordInput
          name="currentPassword"
          label="Contraseña actual"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
      >
        {isPending ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  );
}
