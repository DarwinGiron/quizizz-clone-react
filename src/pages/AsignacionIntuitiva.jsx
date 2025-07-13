import React, { useEffect, useState } from 'react';
import {
  collection, getDocs, query, where, doc, updateDoc, arrayUnion, getDoc
} from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { format, parse, startOfWeek, addDays, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import Sidebar from '../components/Sidebar';
import BackButton from '../components/BackButton';

export default function AsignacionIntuitiva() {
  const { capacitacionId } = useParams();
  const [capacitacion, setCapacitacion] = useState(null);
  const [bloques, setBloques] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [supervisores, setSupervisores] = useState([]);
  const [cuadrillas, setCuadrillas] = useState({});
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [esAdmin, setEsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Estados para la vista
  const [vistaActual, setVistaActual] = useState('semana'); // 'dia' | 'semana'
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroMaquina, setFiltroMaquina] = useState('');
  const [filtroDisponibilidad, setFiltroDisponibilidad] = useState('todos');
  const [draggedPerson, setDraggedPerson] = useState(null);
  const [areasDisponibles, setAreasDisponibles] = useState([]);
  const [maquinasDisponibles, setMaquinasDisponibles] = useState([]);

  // Funciones auxiliares para fechas
  const createLocalDate = (dateString) => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const formatLocalDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Usuario autenticado con Firebase Auth
        setUsuarioActual({ 
          uid: user.uid, 
          email: user.email,
          tipo: 'auth', // Marcamos que es usuario autenticado
          rol: user.email === 'admin@admin.com' || user.email === 'darwingirn@gmail.com' ? 'admin' : 'supervisor'
        });
        setEsAdmin(user.email === 'admin@admin.com' || user.email === 'darwingirn@gmail.com');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!usuarioActual) return;

    const fetchData = async () => {
      try {
        // Cargar capacitación
        const capDoc = await getDoc(doc(db, 'capacitaciones', capacitacionId));
        if (capDoc.exists()) {
          setCapacitacion({ id: capDoc.id, ...capDoc.data() });
        }

        // Cargar todos los usuarios de Firestore (supervisores)
        const usuariosSnap = await getDocs(collection(db, 'usuarios'));
        const usuariosData = usuariosSnap.docs.map(doc => ({ 
          id: doc.id, 
          tipo: 'firestore', // Marcamos que es usuario de Firestore
          ...doc.data() 
        }));
        setUsuarios(usuariosData);

        // Filtrar supervisores según el rol del usuario actual
        let supervisoresFiltrados = [];
        
        if (esAdmin) {
          // El admin ve todos los supervisores de Firestore + él mismo si corresponde
          supervisoresFiltrados = usuariosData.filter(u => u.rol === 'supervisor');
          
          // Si el usuario actual es supervisor autenticado, agregarlo también
          if (usuarioActual.rol === 'supervisor') {
            supervisoresFiltrados.push({
              id: usuarioActual.uid,
              nombre: usuarioActual.email, // Usar email como nombre temporal
              tipo: 'auth',
              rol: 'supervisor',
              email: usuarioActual.email
            });
          }
        } else if (usuarioActual.tipo === 'auth' && usuarioActual.rol === 'supervisor') {
          // Si es supervisor autenticado, solo ve su propia cuadrilla
          supervisoresFiltrados = [{
            id: usuarioActual.uid,
            nombre: usuarioActual.email,
            tipo: 'auth', 
            rol: 'supervisor',
            email: usuarioActual.email
          }];
        } else {
          // Si es supervisor de Firestore, buscar su registro
          const supervisorFirestore = usuariosData.find(u => 
            u.usuario === usuarioActual.email || u.id === usuarioActual.uid
          );
          if (supervisorFirestore) {
            supervisoresFiltrados = [supervisorFirestore];
          }
        }

        // Si no hay supervisores reales, añadir datos de ejemplo para testing
        if (supervisoresFiltrados.length === 0) {
          supervisoresFiltrados = [
            {
              id: 'supervisor_ejemplo_1',
              nombre: 'Juan Pérez - Supervisor',
              rol: 'supervisor',
              usuario: 'juan.perez@empresa.com',
              codigo: 'SUP001',
              tipo: 'ejemplo'
            },
            {
              id: 'supervisor_ejemplo_2', 
              nombre: 'Roberto Silva - Supervisor',
              rol: 'supervisor',
              usuario: 'roberto.silva@empresa.com',
              codigo: 'SUP002',
              tipo: 'ejemplo'
            }
          ];
        }

        setSupervisores(supervisoresFiltrados);

        // Cargar bloques de horarios
        const bloquesSnap = await getDocs(query(
          collection(db, 'capacitacion_bloques'),
          where('capacitacion_id', '==', capacitacionId)
        ));
        const bloquesData = bloquesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBloques(bloquesData);

        // Cargar cuadrillas para cada supervisor
        const todasLasCuadrillas = {};
        const todasLasAreas = new Set();
        const todasLasMaquinas = new Set();

        for (const supervisor of supervisoresFiltrados) {
          const cuadrillaData = await cargarCuadrillaCompleta(supervisor.id);
          todasLasCuadrillas[supervisor.id] = cuadrillaData;
          
          // Recopilar áreas y máquinas para los filtros
          cuadrillaData.forEach(persona => {
            if (persona.area) todasLasAreas.add(persona.area);
            if (persona.maquina || persona.equipo || persona.tipo) {
              const maquina = persona.maquina || persona.equipo || persona.tipo;
              todasLasMaquinas.add(maquina);
            }
          });
        }

        setCuadrillas(todasLasCuadrillas);
        setAreasDisponibles(Array.from(todasLasAreas).sort());
        setMaquinasDisponibles(Array.from(todasLasMaquinas).sort());

      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [capacitacionId, usuarioActual, esAdmin]);

  const cargarCuadrillaCompleta = async (supervisorId) => {
    try {
      // Intentar cargar cuadrilla real desde Firestore
      const q = query(collection(db, 'cuadrilla'), where('supervisor_id', '==', supervisorId));
      const snap = await getDocs(q);
      const cuadrillaReal = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Si no hay datos reales, usar datos de ejemplo específicos para cada supervisor
      if (cuadrillaReal.length === 0) {
        const datosEjemplo = getSupervisorEjemploData(supervisorId);
        return datosEjemplo;
      }
      
      return cuadrillaReal;
    } catch (error) {
      console.error('Error al cargar cuadrilla:', error);
      // En caso de error, retornar datos de ejemplo
      return getSupervisorEjemploData(supervisorId);
    }
  };

  const getSupervisorEjemploData = (supervisorId) => {
    // Datos específicos según el supervisor
    const datosBase = {
      'supervisor_ejemplo_1': [
        { nombre: 'Carlos Rodríguez', codigo: 'CR001', area: 'Construcción', maquina: 'Excavadora' },
        { nombre: 'María González', codigo: 'MG002', area: 'Soldadura', equipo: 'Soldadora MIG' },
        { nombre: 'Pedro Martínez', codigo: 'PM003', area: 'Construcción', tipo: 'Grúa Torre' },
        { nombre: 'Ana López', codigo: 'AL004', area: 'Seguridad', maquina: 'Montacargas' }
      ],
      'supervisor_ejemplo_2': [
        { nombre: 'Luis Hernández', codigo: 'LH005', area: 'Mecánica', equipo: 'Torno CNC' },
        { nombre: 'Carmen Silva', codigo: 'CS006', area: 'Calidad', tipo: 'Inspector' },
        { nombre: 'Jorge Ramírez', codigo: 'JR007', area: 'Electricidad', maquina: 'Multímetro' },
        { nombre: 'Rosa Morales', codigo: 'RM008', area: 'Logística', equipo: 'Carretilla' }
      ]
    };

    // Si es un supervisor autenticado (con uid de Firebase), usar datos genéricos
    const personalGenerico = [
      { nombre: 'Trabajador 1', codigo: 'T001', area: 'Construcción', maquina: 'Herramientas' },
      { nombre: 'Trabajador 2', codigo: 'T002', area: 'Seguridad', equipo: 'Equipos EPP' },
      { nombre: 'Trabajador 3', codigo: 'T003', area: 'Mecánica', tipo: 'Mantenimiento' }
    ];

    const personal = datosBase[supervisorId] || personalGenerico;
    
    return personal.map((p, index) => ({
      id: `ejemplo_${supervisorId}_${index + 1}`,
      ...p,
      supervisor_id: supervisorId
    }));
  };

  const cargarCuadrilla = async (supervisorId) => {
    const cuadrillaData = await cargarCuadrillaCompleta(supervisorId);
    setCuadrillas(prev => ({
      ...prev,
      [supervisorId]: cuadrillaData
    }));
    return cuadrillaData;
  };

  // Obtener días de la semana actual
  const getDiasSemana = () => {
    const inicioSemana = startOfWeek(fechaSeleccionada, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(inicioSemana, i));
  };

  // Obtener bloques para un día específico
  const getBloquesDelDia = (fecha) => {
    const fechaStr = formatLocalDate(fecha);
    return bloques
      .filter(b => b.fecha === fechaStr)
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  };

  // Obtener personal disponible (filtrado)
  const getPersonalDisponible = () => {
    let personal = [];
    
    // Recopilar todo el personal de todas las cuadrillas
    Object.values(cuadrillas).forEach(cuadrilla => {
      personal = [...personal, ...cuadrilla];
    });

    // Aplicar filtros
    if (filtroArea) {
      personal = personal.filter(p => 
        p.area?.toLowerCase().includes(filtroArea.toLowerCase())
      );
    }

    if (filtroMaquina) {
      personal = personal.filter(p => {
        const maquina = p.maquina || p.equipo || p.tipo || '';
        return maquina.toLowerCase().includes(filtroMaquina.toLowerCase());
      });
    }

    if (filtroDisponibilidad === 'disponibles') {
      personal = personal.filter(p => !estaAsignado(p.id));
    } else if (filtroDisponibilidad === 'asignados') {
      personal = personal.filter(p => estaAsignado(p.id));
    }

    return personal;
  };

  // Obtener personal por supervisor (con filtros aplicados)
  const getPersonalPorSupervisor = (supervisorId) => {
    const cuadrillaCompleta = cuadrillas[supervisorId] || [];
    
    return cuadrillaCompleta.filter(persona => {
      // Aplicar filtros
      if (filtroArea && !persona.area?.toLowerCase().includes(filtroArea.toLowerCase())) {
        return false;
      }
      
      if (filtroMaquina) {
        const maquina = persona.maquina || persona.equipo || persona.tipo || '';
        if (!maquina.toLowerCase().includes(filtroMaquina.toLowerCase())) {
          return false;
        }
      }
      
      if (filtroDisponibilidad === 'disponibles' && estaAsignado(persona.id)) {
        return false;
      }
      
      if (filtroDisponibilidad === 'asignados' && !estaAsignado(persona.id)) {
        return false;
      }
      
      return true;
    });
  };

  // Verificar si una persona ya está asignada
  const estaAsignado = (personaId) => {
    return bloques.some(bloque => 
      bloque.participantes?.some(p => p.id === personaId)
    );
  };

  // Handlers para Drag & Drop
  const handleDragStart = (e, persona) => {
    setDraggedPerson(persona);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, bloque) => {
    e.preventDefault();
    
    if (!draggedPerson || !bloque) return;

    // Verificar si hay cupo disponible
    const ocupados = bloque.participantes?.length || 0;
    if (ocupados >= bloque.cupo_disponible) {
      alert('Este horario ya está lleno');
      return;
    }

    // Verificar si la persona ya está asignada a este bloque
    if (bloque.participantes?.some(p => p.id === draggedPerson.id)) {
      alert('Esta persona ya está asignada a este horario');
      return;
    }

    try {
      // Actualizar en Firebase
      const bloqueRef = doc(db, 'capacitacion_bloques', bloque.id);
      await updateDoc(bloqueRef, {
        participantes: arrayUnion(draggedPerson),
      });

      // Actualizar estado local
      setBloques(prev => prev.map(b => {
        if (b.id === bloque.id) {
          return {
            ...b,
            participantes: [...(b.participantes || []), draggedPerson],
          };
        }
        return b;
      }));

      // Remover de cuadrilla local
      const supervisor = supervisores.find(s => 
        cuadrillas[s.id]?.some(p => p.id === draggedPerson.id)
      );
      if (supervisor) {
        setCuadrillas(prev => ({
          ...prev,
          [supervisor.id]: prev[supervisor.id].filter(p => p.id !== draggedPerson.id)
        }));
      }

      // Mostrar mensaje de éxito
      console.log(`✅ ${draggedPerson.nombre} asignado al horario ${bloque.hora_inicio} - ${bloque.hora_fin}`);

    } catch (error) {
      console.error('Error al asignar:', error);
      alert('Error al asignar la persona. Por favor, intente nuevamente.');
    }

    setDraggedPerson(null);
  };

  // Obtener color para el estado del bloque
  const getColorBloque = (bloque) => {
    const ocupados = bloque.participantes?.length || 0;
    const porcentaje = (ocupados / bloque.cupo_disponible) * 100;
    
    if (porcentaje === 0) return 'bg-gray-50 border-gray-200';
    if (porcentaje < 50) return 'bg-green-50 border-green-200';
    if (porcentaje < 80) return 'bg-yellow-50 border-yellow-200';
    if (porcentaje < 100) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-6 ml-60 bg-gray-50 min-h-screen">
          <div className="flex flex-col justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-600">Cargando sistema de asignaciones...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-gray-50 p-6 ml-60 min-h-screen">
        <BackButton to="/asignaciones" label="Volver a Asignaciones" className="mb-4" />
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📋 Asignación Intuitiva de Personal
          </h1>
          {capacitacion && (
            <p className="text-gray-600 mb-4">
              <span className="font-semibold text-purple-700">{capacitacion.titulo}</span>
            </p>
          )}
          
          {/* Controles de vista y filtros */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Toggle vista */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setVistaActual('dia')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  vistaActual === 'dia' 
                    ? 'bg-white text-purple-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📅 Vista Día
              </button>
              <button
                onClick={() => setVistaActual('semana')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  vistaActual === 'semana' 
                    ? 'bg-white text-purple-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📆 Vista Semana
              </button>
            </div>

            {/* Filtro por área */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">📍 Área:</label>
              <select
                value={filtroArea}
                onChange={(e) => setFiltroArea(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white"
              >
                <option value="">Todas las áreas</option>
                {areasDisponibles.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            {/* Filtro por máquina/equipo */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">🔧 Equipo:</label>
              <select
                value={filtroMaquina}
                onChange={(e) => setFiltroMaquina(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white"
              >
                <option value="">Todos los equipos</option>
                {maquinasDisponibles.map(maquina => (
                  <option key={maquina} value={maquina}>{maquina}</option>
                ))}
              </select>
            </div>

            {/* Filtro por disponibilidad */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">👥 Mostrar:</label>
              <select
                value={filtroDisponibilidad}
                onChange={(e) => setFiltroDisponibilidad(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white"
              >
                <option value="todos">Todo el personal</option>
                <option value="disponibles">Solo disponibles</option>
                <option value="asignados">Solo asignados</option>
              </select>
            </div>

            {/* Botón para limpiar filtros */}
            {(filtroArea || filtroMaquina || filtroDisponibilidad !== 'todos') && (
              <button
                onClick={() => {
                  setFiltroArea('');
                  setFiltroMaquina('');
                  setFiltroDisponibilidad('todos');
                }}
                className="px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 transition"
              >
                🗑️ Limpiar filtros
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Panel de Personal Disponible */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                👥 Personal
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {getPersonalDisponible().length}
                </span>
              </h2>
              
              {/* Estadísticas rápidas */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Disponibles:</span>
                    <span className="font-semibold text-green-600">
                      {getPersonalDisponible().filter(p => !estaAsignado(p.id)).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Asignados:</span>
                    <span className="font-semibold text-blue-600">
                      {getPersonalDisponible().filter(p => estaAsignado(p.id)).length}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {supervisores.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-lg mb-2">👤</div>
                    <div className="text-sm">No hay supervisores disponibles</div>
                    <div className="text-xs mt-1">
                      Rol actual: {usuarioActual?.rol || 'Sin rol'} | 
                      Tipo: {usuarioActual?.tipo || 'Sin tipo'} |
                      Admin: {esAdmin ? 'Sí' : 'No'}
                    </div>
                  </div>
                ) : (
                  supervisores.map(supervisor => {
                  const personalFiltrado = getPersonalPorSupervisor(supervisor.id);
                  const totalPersonal = cuadrillas[supervisor.id]?.length || 0;
                  
                  return (
                    <div key={supervisor.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">
                            {supervisor.tipo === 'auth' ? '👑' : 
                             supervisor.tipo === 'ejemplo' ? '�' : '👨‍💼'}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-purple-700">
                              {supervisor.nombre}
                              {supervisor.tipo === 'auth' && (
                                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                  Autenticado
                                </span>
                              )}
                              {supervisor.tipo === 'ejemplo' && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                  Datos de prueba
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {personalFiltrado.length} de {totalPersonal} personas
                              {supervisor.codigo && (
                                <span className="ml-2">• {supervisor.codigo}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {personalFiltrado.length === 0 ? (
                          <div className="text-center py-4 text-gray-400 text-xs">
                            {totalPersonal === 0 ? 
                              'No hay personal registrado' : 
                              'No hay personal que coincida con los filtros'
                            }
                          </div>
                        ) : (
                          personalFiltrado.map(persona => {
                            const yaAsignado = estaAsignado(persona.id);
                            return (
                              <div
                                key={persona.id}
                                draggable={!yaAsignado}
                                onDragStart={(e) => !yaAsignado && handleDragStart(e, persona)}
                                className={`p-3 rounded-lg border-2 transition-all cursor-move hover:shadow-md ${
                                  yaAsignado 
                                    ? 'bg-green-100 border-green-400 text-green-900' 
                                    : 'bg-blue-100 border-blue-400 text-blue-900 hover:bg-blue-200'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{persona.nombre}</div>
                                  </div>
                                  <div className="ml-2">
                                    {yaAsignado ? (
                                      <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-medium">
                                        ✅
                                      </span>
                                    ) : (
                                      <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full font-medium">
                                        🖱️
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                  })
                )}
                
                {supervisores.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-3xl mb-2">👤</div>
                    <div className="text-sm">No tienes acceso a supervisores</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel de Horarios */}
          <div className="lg:col-span-3">
            {vistaActual === 'semana' ? (
              // Vista Semanal
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    📆 Semana del {format(getDiasSemana()[0], 'dd MMM', { locale: es })} - {format(getDiasSemana()[6], 'dd MMM yyyy', { locale: es })}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFechaSeleccionada(addDays(fechaSeleccionada, -7))}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                    >
                      ← Anterior
                    </button>
                    <button
                      onClick={() => setFechaSeleccionada(addDays(fechaSeleccionada, 7))}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {getDiasSemana().map(dia => {
                    const bloquesDelDia = getBloquesDelDia(dia);
                    return (
                      <div key={dia.toISOString()} className="border border-gray-200 rounded-lg p-2">
                        <div className="text-center font-medium text-sm text-gray-700 mb-2 border-b pb-1">
                          {format(dia, 'EEE dd', { locale: es })}
                        </div>
                        
                        <div className="space-y-2">
                          {bloquesDelDia.map(bloque => {
                            const ocupados = bloque.participantes?.length || 0;
                            const porcentajeOcupacion = (ocupados / bloque.cupo_disponible) * 100;
                            const estaLleno = ocupados >= bloque.cupo_disponible;
                            
                            return (
                              <div
                                key={bloque.id}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, bloque)}
                                className={`p-2 rounded-lg border-2 transition-all hover:shadow-sm ${
                                  draggedPerson && !estaLleno ? 'border-dashed border-purple-400 bg-purple-50' : ''
                                } ${getColorBloque(bloque)} ${
                                  estaLleno ? 'cursor-not-allowed' : 'cursor-pointer'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="text-xs font-medium text-gray-700">
                                    ⏰ {bloque.hora_inicio} - {bloque.hora_fin}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {ocupados}/{bloque.cupo_disponible}
                                  </div>
                                </div>
                                
                                {/* Barra de progreso */}
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                                  <div 
                                    className={`h-1.5 rounded-full transition-all ${
                                      porcentajeOcupacion === 0 ? 'bg-gray-300' :
                                      porcentajeOcupacion < 50 ? 'bg-green-500' :
                                      porcentajeOcupacion < 80 ? 'bg-yellow-500' :
                                      porcentajeOcupacion < 100 ? 'bg-orange-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${Math.max(porcentajeOcupacion, 5)}%` }}
                                  ></div>
                                </div>
                                
                                {/* Participantes asignados */}
                                {bloque.participantes && bloque.participantes.length > 0 && (
                                  <div className="space-y-1">
                                    {bloque.participantes.slice(0, 3).map(p => (
                                      <div key={p.id} className="text-xs bg-white bg-opacity-80 px-2 py-1 rounded border border-gray-200 flex items-center justify-between">
                                        <span className="font-medium truncate flex-1">{p.nombre}</span>
                                        <span className="text-gray-500 ml-1">{p.area || p.codigo}</span>
                                      </div>
                                    ))}
                                    {bloque.participantes.length > 3 && (
                                      <div className="text-xs text-gray-600 text-center py-1 bg-gray-100 rounded">
                                        +{bloque.participantes.length - 3} más...
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {/* Estado visual */}
                                {estaLleno && (
                                  <div className="text-xs text-center mt-2 text-red-600 font-medium">
                                    🚫 Completo
                                  </div>
                                )}
                                
                                {!estaLleno && draggedPerson && (
                                  <div className="text-xs text-center mt-2 text-purple-600 font-medium">
                                    ⬇️ Suelta aquí
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          
                          {bloquesDelDia.length === 0 && (
                            <div className="text-center py-4 text-gray-400 text-xs">
                              Sin horarios
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Vista de Día
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    📅 {format(fechaSeleccionada, 'EEEE, dd MMMM yyyy', { locale: es })}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFechaSeleccionada(addDays(fechaSeleccionada, -1))}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                    >
                      ← Día anterior
                    </button>
                    <button
                      onClick={() => setFechaSeleccionada(new Date())}
                      className="px-3 py-1 bg-purple-100 hover:bg-purple-200 rounded text-sm text-purple-700"
                    >
                      Hoy
                    </button>
                    <button
                      onClick={() => setFechaSeleccionada(addDays(fechaSeleccionada, 1))}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                    >
                      Día siguiente →
                    </button>
                  </div>
                </div>

                {/* Horarios del día */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {getBloquesDelDia(fechaSeleccionada).map(bloque => {
                    const ocupados = bloque.participantes?.length || 0;
                    const porcentajeOcupacion = (ocupados / bloque.cupo_disponible) * 100;
                    const estaLleno = ocupados >= bloque.cupo_disponible;
                    
                    return (
                      <div
                        key={bloque.id}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, bloque)}
                        className={`p-4 rounded-lg border-2 transition-all hover:shadow-lg ${
                          draggedPerson && !estaLleno ? 'border-dashed border-purple-400 bg-purple-50' : ''
                        } ${getColorBloque(bloque)} ${
                          estaLleno ? 'cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        {/* Header del bloque */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-bold text-gray-800">
                            ⏰ {bloque.hora_inicio} - {bloque.hora_fin}
                          </div>
                          <div className="text-sm font-medium text-gray-600">
                            {ocupados}/{bloque.cupo_disponible}
                          </div>
                        </div>
                        
                        {/* Barra de progreso */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              porcentajeOcupacion === 0 ? 'bg-gray-300' :
                              porcentajeOcupacion < 50 ? 'bg-green-500' :
                              porcentajeOcupacion < 80 ? 'bg-yellow-500' :
                              porcentajeOcupacion < 100 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.max(porcentajeOcupacion, 5)}%` }}
                          ></div>
                        </div>
                        
                        {/* Personal asignado - Cards de colores */}
                        <div className="space-y-2 mb-3">
                          {bloque.participantes && bloque.participantes.length > 0 ? (
                            bloque.participantes.map(p => (
                              <div key={p.id} className="bg-green-100 border-2 border-green-400 text-green-900 px-2 py-1 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-xs">{p.nombre}</span>
                                  <span className="text-xs bg-green-200 text-green-800 px-1.5 py-0.5 rounded-full">
                                    ✅
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 text-gray-400">
                              <div className="text-2xl mb-2">👥</div>
                              <div className="text-sm">Sin personal asignado</div>
                            </div>
                          )}
                        </div>
                        
                        {/* Estado del bloque */}
                        {estaLleno ? (
                          <div className="text-center py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium">
                            🚫 Bloque completo
                          </div>
                        ) : draggedPerson ? (
                          <div className="text-center py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium">
                            ⬇️ Suelta aquí para asignar
                          </div>
                        ) : (
                          <div className="text-center py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                            🖱️ Arrastra personal aquí
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {getBloquesDelDia(fechaSeleccionada).length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-400">
                      <div className="text-4xl mb-4">📅</div>
                      <h3 className="text-lg font-medium mb-2">No hay horarios programados</h3>
                      <p className="text-sm">No se encontraron bloques de capacitación para este día.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Leyenda y estadísticas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Leyenda de uso */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">📖 Guía de uso:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-100 border-2 border-blue-400 rounded flex-shrink-0"></div>
                <span>Personal disponible (azul) - Arrastra para asignar</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 border-2 border-green-400 rounded flex-shrink-0"></div>
                <span>Personal asignado (verde) - Ya tiene horario</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-50 border border-green-200 rounded flex-shrink-0"></div>
                <span>Horario con baja ocupación (menos del 50%)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-yellow-50 border border-yellow-200 rounded flex-shrink-0"></div>
                <span>Horario con ocupación media (50-80%)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-orange-50 border border-orange-200 rounded flex-shrink-0"></div>
                <span>Horario casi lleno (80-99%)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-red-50 border border-red-200 rounded flex-shrink-0"></div>
                <span>Horario completo (100%)</span>
              </div>
            </div>
          </div>

          {/* Estadísticas generales */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">📊 Estadísticas de asignación:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-blue-600 font-semibold text-lg">
                  {bloques.reduce((total, bloque) => total + (bloque.participantes?.length || 0), 0)}
                </div>
                <div className="text-blue-700 text-xs">Total asignaciones</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-green-600 font-semibold text-lg">
                  {bloques.reduce((total, bloque) => total + bloque.cupo_disponible, 0)}
                </div>
                <div className="text-green-700 text-xs">Cupos totales</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-purple-600 font-semibold text-lg">
                  {supervisores.length}
                </div>
                <div className="text-purple-700 text-xs">Supervisores</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-orange-600 font-semibold text-lg">
                  {Object.values(cuadrillas).reduce((total, cuadrilla) => total + cuadrilla.length, 0)}
                </div>
                <div className="text-orange-700 text-xs">Personal total</div>
              </div>
            </div>
            
            {/* Progreso general */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progreso general de asignaciones</span>
                <span>
                  {Math.round((
                    bloques.reduce((total, bloque) => total + (bloque.participantes?.length || 0), 0) /
                    Math.max(bloques.reduce((total, bloque) => total + bloque.cupo_disponible, 0), 1)
                  ) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${Math.round((
                      bloques.reduce((total, bloque) => total + (bloque.participantes?.length || 0), 0) /
                      Math.max(bloques.reduce((total, bloque) => total + bloque.cupo_disponible, 0), 1)
                    ) * 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
