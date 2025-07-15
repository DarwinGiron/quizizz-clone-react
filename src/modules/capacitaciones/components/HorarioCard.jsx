// ✅ HorarioCard.jsx – Tarjeta de horario mejorada
import React, { useState, useEffect } from "react";
import { AsignarParticipantesModal } from "../../asignaciones";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase/config";
import { format } from "date-fns";

export default function HorarioCard({ horario, capacitacionId }) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [cantidadParticipantes, setCantidadParticipantes] = useState(0);

  useEffect(() => {
    const contarParticipantes = async () => {
      const ref = collection(db, `capacitacion_bloques/${horario.id}/participantes`);
      const snapshot = await getDocs(ref);
      setCantidadParticipantes(snapshot.size);
    };
    contarParticipantes();
  }, [horario.id]);

  return (
    <div className="bg-white p-5 rounded-xl border shadow hover:shadow-md transition">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold text-purple-700">
          {format(new Date(horario.fecha), 'dd MMM yyyy')}<br />
          <span className="text-sm font-normal text-gray-700">
            {horario.hora_inicio} - {horario.hora_fin}
          </span>
        </h2>
        <div className="text-right text-sm text-gray-600">
          <p><strong>{cantidadParticipantes}</strong> / {horario.cupo_disponible} inscritos</p>
        </div>
      </div>

      <button
        className="mt-3 w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 text-sm font-semibold"
        onClick={() => setMostrarModal(true)}
      >
        Asignar participantes
      </button>

      {mostrarModal && (
        <AsignarParticipantesModal
          horario={horario}
          capacitacionId={capacitacionId}
          onClose={() => setMostrarModal(false)}
          onAsignado={() => {
            setMostrarModal(false);
            setCantidadParticipantes(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
}
