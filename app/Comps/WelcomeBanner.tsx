export default function WelcomeBanner({ userName, horasRestantes }: { userName: string; horasRestantes: number }) {
  return (
    <section className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold">¡Hola, {userName}!</h2>
        <p className="text-slate-300 text-sm mt-1">
          Te quedan <strong className="text-white">{horasRestantes} horas</strong> en la bolsa para coordinar reuniones.
        </p>
      </div>
    </section>
  );
}