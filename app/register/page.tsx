'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { registerAction } from '@/app/actions/auth';
import FormInput from '@/app/Customs/FormInput';
import PasswordInput from '@/app/Customs//PasswordInput';
import CCRLogo from '@/app/Comps/CCRLogo';

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, null);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
        
        <div className="text-center space-y-1">
          <CCRLogo size={48} className="mx-auto shadow-sm ring-1 ring-amber-300/70" />
          <h1 className="text-xl font-bold text-slate-900">Crear Cuenta</h1>
          <p className="text-xs text-slate-500">Únete al sistema de reservas corporativo</p>
        </div>

        {/* Mensaje de Error Visual */}
        {state?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl text-center font-medium">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <FormInput 
            name="nombre" 
            label="Nombre Completo" 
            placeholder="Juan Pérez" 
          />

          <FormInput 
            name="username" 
            label="Nombre de Usuario (Username)" 
            placeholder="juan.perez" 
          />

          <FormInput 
            name="email" 
            label="Correo Electrónico" 
            type="email" 
            placeholder="juan@empresa.com" 
          />

          <PasswordInput name="password" label="Contraseña" />

          {/* Campo opcional de referencia de Empresa para que el admin la identifique al aprobar */}
          <FormInput 
            name="empresa" 
            label="Empresa u Organización (Opcional)" 
            required={false}
            placeholder="Nombre de tu empresa o área..." 
          />

          <button 
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isPending ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <div className="text-center border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="font-semibold text-slate-900 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}