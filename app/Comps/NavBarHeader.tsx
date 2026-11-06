'use client';

import Link from 'next/link';
import { logoutAction } from '@/app/actions/auth';

interface NavbarHeaderProps {
  companyName: string;
  userName: string;
  department?: string | null;
  horasRestantes: number;
  userRole?: string; // "USER", "ADMIN", "MASTER"
}

export default function NavbarHeader({
  companyName,
  userName,
  department,
  horasRestantes,
  userRole,
}: NavbarHeaderProps) {
  const isMaster = userRole === 'MASTER';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Logo Corporativo y Título */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            {companyName ? companyName.charAt(0) : 'S'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Reservas - {companyName}
              </h1>
              {userRole && (
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                  isMaster 
                    ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                    : userRole === 'ADMIN'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {userRole}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Salas de Juntas & Espacios Corporativos
            </p>
          </div>
        </div>

        {/* Estado de Cuenta + Botón Master + Botón Salir */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Botón de Acceso Directo al Portal Master (Únicamente visible para rol MASTER) */}
          {isMaster && (
            <Link
              href="/master"
              className="flex items-center gap-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl transition shadow-xs"
              title="Ir al Portal de Administración Global"
            >
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden md:inline">Panel Master</span>
            </Link>
          )}

          {/* Información del Usuario y Bolsa de Horas */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-slate-900">{userName}</p>
              <p className="text-[10px] text-slate-500">{department || '---'}</p>
            </div>
            <div className="h-7 w-px bg-slate-200 hidden md:block" />
            <div className="text-right">
              <p className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Bolsa restante</p>
              <p className="text-xs sm:text-sm font-black text-slate-900">{horasRestantes} hrs</p>
            </div>
          </div>

          {/* Botón Cerrar Sesión */}
          <form action={logoutAction}>
            <button 
              type="submit"
              title="Cerrar Sesión"
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 transition cursor-pointer flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </form>
        </div>

      </div>
    </header>
  );
}