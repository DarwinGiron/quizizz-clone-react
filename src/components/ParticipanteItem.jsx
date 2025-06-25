import React from "react";

export default function ParticipanteItem({ participante }) {
  return (
    <div className="p-2 border-b border-gray-200">
      <p className="text-sm font-medium">{participante.nombre} ({participante.codigo})</p>
      <p className="text-xs text-gray-600">Área: {participante.area} – Tipo: {participante.tipo}</p>
    </div>
  );
}
