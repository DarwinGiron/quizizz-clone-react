import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import Sidebar from "../components/Sidebar";
import HorarioCard from "../components/HorarioCard";

export default function HorariosPorCapacitacion() {
  const { capacitacionId } = useParams();
  const [horarios, setHorarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchHorarios = async () => {
      setCargando(true);
      try {
        const q = query(
          collection(db, "capacitacion_bloques"),
          where("capacitacion_id", "==", capacitacionId)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => {
          if (a.fecha === b.fecha) {
            return a.hora_inicio.localeCompare(b.hora_inicio);
          }
          return a.fecha.localeCompare(b.fecha);
        });
        setHorarios(data);
      } catch (error) {
        console.error("Error cargando bloques:", error);
      } finally {
        setCargando(false);
      }
    };

    fetchHorarios();
  }, [capacitacionId]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 ml-60">
        <h1 className="text-2xl font-bold mb-4">Horarios disponibles</h1>

        {cargando ? (
          <p className="text-gray-500">Cargando horarios...</p>
        ) : horarios.length === 0 ? (
          <p className="text-gray-500">No hay horarios generados aún para esta capacitación.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {horarios.map(horario => (
              <HorarioCard
                key={horario.id}
                horario={horario}
                capacitacionId={capacitacionId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
