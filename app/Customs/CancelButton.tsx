'use client';

import { useState } from 'react';
import { deleteReservationAction } from '@/app/actions/reservations';

export default function CancelButton({ reservationId }: { reservationId: string }) {
  const [isPending, setIsPending] = useState(false);

  async function handleCancel() {
    const confirm = window.confirm('¿Estás seguro de cancelar esta reserva? Las horas serán devueltas a tu saldo.');
    if (!confirm) return;

    setIsPending(true);
    const res = await deleteReservationAction(reservationId);
    setIsPending(false);

    if (!res.success) {
      alert(res.error || 'No se pudo cancelar la reserva');
    }
  }

  return (
    <button
      onClick={handleCancel}
      disabled={isPending}
      className="text-xs text-red-600 hover:text-red-800 font-medium transition disabled:text-gray-400"
    >
      {isPending ? 'Cancelando...' : 'Cancelar'}
    </button>
  );
}