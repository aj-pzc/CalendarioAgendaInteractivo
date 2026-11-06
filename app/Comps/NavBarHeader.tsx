'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { logoutAction } from '@/app/actions/auth';
import CCRLogo from '@/app/Comps/CCRLogo';

interface NavbarHeaderProps {
  companyName: string;
  userName: string;
  department?: string | null;
  horasDisponibles: number;
  horasUsadas: number;
  horasRestantes: number;
  userRole?: string; // "USER", "ADMIN", "MASTER"
}

export default function NavbarHeader({
  companyName,
  userName,
  department,
  horasDisponibles,
  horasUsadas,
  horasRestantes,
  userRole,
}: NavbarHeaderProps) {
  const isMaster = userRole === 'MASTER';
  const pathname = usePathname();
  const compactHeaderLabel = companyName.length <= 14 ? companyName : userName;
  const [hoursOpen, setHoursOpen] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const hoursRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLDivElement>(null);
  const navigationLinks = [
    { href: '/', label: 'Calendario' },
    { href: '/reservar', label: 'Reservar' },
    { href: '/proximas', label: 'Próximas' },
    { href: '/cuenta', label: 'Mi cuenta' },
  ];
  const roleNavigationLinks = userRole === 'ADMIN'
    ? [...navigationLinks, { href: '/usuarios', label: 'Usuarios' }]
    : navigationLinks;
  const mobileNavigationLinks = isMaster
    ? [...roleNavigationLinks, { href: '/master', label: 'Panel Master' }]
    : roleNavigationLinks;

  useEffect(() => {
    if (!hoursOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!hoursRef.current?.contains(event.target as Node)) setHoursOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setHoursOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [hoursOpen]);

  useEffect(() => {
    if (!navigationOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!navigationRef.current?.contains(event.target as Node)) setNavigationOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavigationOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigationOpen]);

  return (
    <header className="bg-white/95 border-b border-amber-200/70 sticky top-0 z-40 shadow-xs backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-3 relative">
        
        {/* Logo Corporativo y Título */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/" aria-label="Ir al calendario" title="Ir al calendario">
            <CCRLogo size={44} className="ring-1 ring-amber-300/70 shadow-sm" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1
                title={companyName}
                className="max-w-[86px] truncate text-xs font-bold leading-tight text-slate-900 lg:max-w-none lg:text-lg"
              >
                <span className="lg:hidden">{compactHeaderLabel}</span>
                <span className="hidden lg:inline">Reservas - {companyName}</span>
              </h1>
              {userRole && (
                <span className={`hidden text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider lg:inline-block ${
                  isMaster 
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : userRole === 'ADMIN'
                    ? 'bg-orange-100 text-orange-900 border border-orange-300'
                    : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                }`}>
                  {userRole}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 hidden lg:block">
              Salas de Juntas & Espacios Corporativos
            </p>
          </div>
        </div>

        {/* Estado de Cuenta + Botón Master + Botón Salir */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative lg:hidden" ref={navigationRef}>
            <button
              type="button"
              onClick={() => setNavigationOpen((open) => !open)}
              aria-expanded={navigationOpen}
              aria-controls="mobile-primary-navigation"
              aria-label="Abrir menú de navegación"
              className="p-2 rounded-xl border border-amber-200 text-amber-900 hover:bg-amber-50"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {navigationOpen && (
              <nav
                id="mobile-primary-navigation"
                aria-label="Navegación principal"
                className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-52 rounded-2xl border border-amber-200 bg-white p-2 shadow-xl"
              >
                {mobileNavigationLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={pathname === link.href ? 'page' : undefined}
                    onClick={() => setNavigationOpen(false)}
                    className={`block rounded-xl px-3 py-2.5 text-sm font-semibold ${
                      pathname === link.href
                        ? 'bg-amber-100 text-amber-950'
                        : 'text-slate-700 hover:bg-stone-100'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* Botón de Acceso Directo al Portal Master (Únicamente visible para rol MASTER) */}
          {isMaster && (
            <Link
              href="/master"
              className="hidden items-center gap-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl transition shadow-xs lg:flex"
              title="Ir al Portal de Administración Global"
            >
              <svg className="w-4 h-4 text-amber-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden md:inline">Panel Master</span>
            </Link>
          )}

          {/* Información del Usuario y Bolsa de Horas */}
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-1.5 py-1.5 sm:gap-3 sm:px-3">
            <Link
              href="/cuenta"
              title="Editar mi cuenta"
              className="text-right hidden rounded-lg px-1.5 py-1 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-amber-500 lg:block"
            >
              <p className="text-xs font-bold text-slate-900">{userName}</p>
              <p className="text-[10px] text-slate-500">{department || '---'}</p>
            </Link>
            <div className="h-7 w-px bg-slate-200 hidden lg:block" />
            <div ref={hoursRef} className="relative">
              <button
                type="button"
                onClick={() => setHoursOpen((open) => !open)}
                aria-expanded={hoursOpen}
                aria-haspopup="dialog"
                className="text-right rounded-lg px-1 py-1 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-amber-500 sm:px-1.5"
              >
                <span className="block text-[10px] uppercase font-semibold text-amber-800 tracking-wider whitespace-nowrap">
                  Bolsa de horas
                </span>
                <span className="block text-xs sm:text-sm font-black text-slate-900">{horasRestantes} hrs</span>
              </button>
              {hoursOpen && (
                <div
                  role="dialog"
                  aria-label="Balance de horas"
                  className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-72 rounded-2xl border border-amber-200 bg-white p-4 text-left shadow-xl"
                >
                  <p className="text-sm font-bold text-slate-900">
                    Has usado {horasUsadas} {horasUsadas === 1 ? 'hora' : 'horas'} del total de {horasDisponibles}.
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Te quedan <span className="font-bold text-amber-800">{horasRestantes} horas</span> en la bolsa de este mes.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Botón Cerrar Sesión */}
          <form action={logoutAction}>
            <button 
              type="submit"
              title="Cerrar Sesión"
              className="p-2 text-slate-500 hover:text-amber-800 hover:bg-amber-50 rounded-xl border border-slate-200 transition cursor-pointer flex items-center justify-center"
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