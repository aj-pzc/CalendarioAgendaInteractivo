'use client';

import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-slate-900 text-white font-bold rounded-xl mx-auto flex items-center justify-center text-xl shadow-sm">
            S
          </div>
          <h1 className="text-xl font-bold text-slate-900">Recuperar Contraseña</h1>
          <p className="text-xs text-slate-500">
            Para restablecer tu contraseña, comunícate con el administrador de tu organización.
          </p>
        </div>

        <div className="text-center border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500">
            ¿Recordaste tu contraseña?{' '}
            <Link href="/login" className="font-semibold text-slate-900 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}