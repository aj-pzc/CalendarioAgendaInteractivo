'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { loginAction } from '@/app/actions/auth';
import FormInput from '@/app/Customs/FormInput';
import PasswordInput from '@/app/Customs//PasswordInput';
import CCRLogo from '@/app/Comps/CCRLogo';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
        
        <div className="text-center space-y-1">
          <CCRLogo size={48} className="mx-auto shadow-sm ring-1 ring-amber-300/70" />
          <h1 className="text-xl font-bold text-slate-900">Iniciar Sesión</h1>
          <p className="text-xs text-slate-500">Sistema de Reservas Corporativas</p>
        </div>

        {state?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl text-center font-medium">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <FormInput 
            name="emailOrUser" 
            label="Correo Electrónico o Usuario" 
            placeholder="nombre@empresa.com o tu.usuario" 
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-700"></span>
              <Link 
                href="/forgot-password" 
                className="text-[11px] font-medium text-slate-500 hover:text-slate-900 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <PasswordInput name="password" label="Contraseña" />
          </div>

          <button 
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isPending ? 'Verificando...' : 'Entrar al Sistema'}
          </button>
        </form>

        <div className="text-center border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500">
            ¿No tienes una cuenta?{' '}
            <Link href="/register" className="font-semibold text-slate-900 hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}