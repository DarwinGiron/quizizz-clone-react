import React, { useEffect, useState } from 'react';
import {
  collection, getDocs, query, where, doc, updateDoc, arrayUnion, getDoc
} from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../../firebase/config';
import { format, parse } from 'date-fns';
import Calendar from 'react-calendar';
import { BackButton } from '../../../shared';
import 'react-calendar/dist/Calendar.css';

// Función auxiliar para crear fechas locales sin problemas de zona horaria
const createLocalDate = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month - 1 porque los meses en JS van de 0-11
};

// Función auxiliar para formatear fecha manteniendo zona horaria local
const formatLocalDate = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AsignacionAvanzada() {
  const { capacitacionId } = useParams();
  const [capacitacion, setCapacitacion] = useState(null);
  const [supervisores, setSupervisores] = useState([]);
  const [cuadrillas, setCuadrillas] = useState({});
  const [expandedSupervisor, setExpandedSupervisor] = useState(null);
  const [bloques, setBloques] = useState([]);
  const [diasUnicos, setDiasUnicos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [fechasSaturadas, setFechasSaturadas] = useState([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [esAdmin, setEsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUsuarioActual(user);
        setEsAdmin(user.email === 'admin@admin.com' || user.email === 'darwingirn@gmail.com');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!usuarioActual) return;

    const fetchData = async () => {
      const capSnap = await getDoc(doc(db, 'capacitaciones', capacitacionId));
      if (capSnap.exists()) {
        setCapacitacion({ id: capSnap.id, ...capSnap.data() });
      }

      const usuariosSnap = await getDocs(collection(db, 'usuarios'));
      const usuarios = usuariosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const supervisoresFiltrados = esAdmin
        ? usuarios.filter(u => u.rol === 'supervisor' || u.rol === undefined)
        : usuarios.filter(u => u.id === usuarioActual.uid);

      setSupervisores(supervisoresFiltrados);

      const bloquesSnap = await getDocs(query(
        collection(db, 'capacitacion_bloques'),
        where('capacitacion_id', '==', capacitacionId)
      ));
      const bloquesData = bloquesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const dias = [...new Set(bloquesData.map(b => b.fecha))];

      setBloques(bloquesData);
      setDiasUnicos(dias);
    };

    fetchData();
  }, [capacitacionId, usuarioActual, esAdmin]);

  // Calculate fully booked dates
  useEffect(() => {
    if (diasUnicos.length === 0 || bloques.length === 0) {
      setFechasSaturadas([]);
      return;
    }

    const saturadas = diasUnicos.filter(dia => {
      const bloquesDelDia = bloques.filter(bloque => bloque.fecha === dia);
      if (bloquesDelDia.length === 0) return false; // No blocks for this day, not saturada

      return bloquesDelDia.every(bloque =>
        (bloque.participantes?.length || 0) >= bloque.cupo_disponible
      );
    });
    setFechasSaturadas(saturadas);
  }, [bloques, diasUnicos]);

  const cargarCuadrilla = async (supervisorId) => {
    const q = query(collection(db, 'cuadrilla'), where('supervisor_id', '==', supervisorId));
    const snap = await getDocs(q);
    setCuadrillas(prev => ({
      ...prev,
      [supervisorId]: snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }));
  };

  const toggleCuadrilla = (supervisorId) => {
    if (expandedSupervisor === supervisorId) {
      setExpandedSupervisor(null);
    } else {
      setExpandedSupervisor(supervisorId);
      if (!cuadrillas[supervisorId]) cargarCuadrilla(supervisorId);
    }
  };

  const bloquesFiltrados = bloques.filter(b => b.fecha === diaSeleccionado);

  const asignarParticipante = async () => {
    if (!seleccionado || !horarioSeleccionado) return;
    const bloqueRef = doc(db, 'capacitacion_bloques', horarioSeleccionado.id);

    await updateDoc(bloqueRef, {
      participantes: arrayUnion(seleccionado),
    });

    setCuadrillas(prev => {
      const actual = prev[expandedSupervisor] || [];
      return {
        ...prev,
        [expandedSupervisor]: actual.filter(p => p.id !== seleccionado.id)
      };
    });

    setBloques(prev => prev.map(b => {
      if (b.id === horarioSeleccionado.id) {
        return {
          ...b,
          participantes: [...(b.participantes || []), seleccionado],
        };
      }
      return b;
    }));

    setSeleccionado(null);
    setHorarioSeleccionado(null);
  };

  return (
    <div className="flex">
      <div className="flex-1 bg-white p-6 min-h-screen">
        <BackButton to="/asignaciones" label="Volver a Asignaciones" className="mb-4" />
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Asignación avanzada de participantes</h1>
        {capacitacion && (
          <p className="text-sm text-gray-600 mb-4">
            Capacitación: <span className="font-semibold text-purple-700">{capacitacion.titulo}</span>
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Personal disponible */}
          <div className="space-y-2 text-xs">
            {supervisores.map(sup => (
              <div key={sup.id} className="border rounded-md p-2 bg-white shadow-sm">
                <div
                  onClick={() => toggleCuadrilla(sup.id)}
                  className="cursor-pointer text-purple-700 font-bold flex justify-between items-center"
                >
                  Supervisor: {sup.nombre}
                  <span>{expandedSupervisor === sup.id ? '▲' : '▼'}</span>
                </div>

                {expandedSupervisor === sup.id && (
                  <div className="mt-1 space-y-1">
                    {(cuadrillas[sup.id] || []).length === 0 ? (
                      <p className="text-gray-400 text-[10px]">No hay personal registrado.</p>
                    ) : (
                      cuadrillas[sup.id].map(p => (
                        <div
                          key={p.id}
                          onClick={() => setSeleccionado(p)}
                          className={`bg-gray-50 border border-gray-300 text-gray-800 p-1 rounded cursor-pointer hover:bg-purple-50 ${
                            seleccionado?.id === p.id ? 'border-purple-400 bg-purple-100' : ''
                          }`}
                        >
                          <p className="font-semibold text-xs truncate">{p.nombre}</p>
                          <p className="text-[10px] text-gray-500">
                            {p.codigo || 'Sin código'} — {p.area || 'Sin área'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Días habilitados */}
          <div>
            <h2 className="text-sm font-semibold mb-1 text-gray-700">📅 Días habilitados</h2>
            <Calendar
              onChange={(date) => setDiaSeleccionado(formatLocalDate(date))}
              value={createLocalDate(diaSeleccionado)}
              tileDisabled={({ date, view }) =>
                view === 'month' &&
                (!diasUnicos.includes(formatLocalDate(date)) ||
                 fechasSaturadas.includes(formatLocalDate(date)))
              }
            />
          </div>

          {/* Horarios habilitados */}
          <div>
            <h2 className="text-sm font-semibold mb-1 text-gray-700">⏱️ Horarios</h2>
            <div className="space-y-1 text-xs">
              {bloquesFiltrados.map(b => {
                const ocupados = b.participantes?.length || 0;
                const lleno = ocupados >= b.cupo_disponible;
                return (
                  <div
                    key={b.id}
                    onClick={() => !lleno && setHorarioSeleccionado(b)}
                    className={`border p-1 rounded cursor-pointer ${
                      lleno
                        ? 'bg-red-100 border-red-400 text-red-700'
                        : 'hover:bg-green-50'
                    } ${horarioSeleccionado?.id === b.id ? 'bg-green-100 border-green-500' : ''}`}
                  >
                    {b.hora_inicio} - {b.hora_fin}
                    <br />
                    <span className="text-[10px]">
                      {ocupados} / {b.cupo_disponible} inscritos
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Botón asignar */}
        <div className="mt-6 text-center">
          <button
            onClick={asignarParticipante}
            disabled={!seleccionado || !horarioSeleccionado}
            className={`px-6 py-2 rounded text-white font-bold transition text-sm ${
              !seleccionado || !horarioSeleccionado
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            Asignar participante
          </button>
        </div>
      </div>
    </div>
  );
}
