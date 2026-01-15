import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { collection, getDocs, query, where, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { format, parseISO } from 'date-fns';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Estilos básicos del calendario
import { ChevronDown, ChevronUp, Check, Users, Calendar as CalendarIcon, Clock } from 'lucide-react';

// Estilos custom para el calendario que se inyectan en el head
const CustomCalendarStyles = () => (
    <style>{`
    .react-calendar {
        border: none;
        border-radius: 0.75rem; /* rounded-xl */
        background-color: var(--color-secondary);
        padding: 1rem;
    }
    .react-calendar__navigation button {
        color: var(--color-text-primary);
        font-weight: bold;
    }
    .react-calendar__month-view__weekdays__weekday {
        text-align: center;
        text-decoration: none !important;
        color: var(--color-text-muted);
        font-weight: 600;
        font-size: 0.75rem;
    }
    .react-calendar__tile {
        border-radius: 0.5rem; /* rounded-lg */
        transition: background-color 0.2s;
        height: 50px;
    }
    .react-calendar__tile:enabled:hover, .react-calendar__tile:enabled:focus {
        background-color: var(--color-hover);
    }
    .react-calendar__tile--now {
        background-color: var(--color-hover);
        color: var(--color-text-primary);
    }
    .react-calendar__tile--active {
        background-color: var(--color-accent) !important;
        color: var(--color-accent-text) !important;
    }
    .react-calendar__tile--disabled {
        background-color: transparent;
        color: var(--color-text-muted-light);
        opacity: 0.5;
    }
    `}</style>
);

const AsignacionDetalle = () => {
    const { capacitacionId } = useParams();
    const [capacitacion, setCapacitacion] = useState(null);
    const [supervisores, setSupervisores] = useState([]);
    const [cuadrillas, setCuadrillas] = useState({});
    const [expandedSupervisor, setExpandedSupervisor] = useState(null);
    const [bloques, setBloques] = useState([]);
    const [diaSeleccionado, setDiaSeleccionado] = useState(null);
    const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);
    const [miembroSeleccionado, setMiembroSeleccionado] = useState(null);
    const [usuarioActual, setUsuarioActual] = useState(null);
    const [esAdmin, setEsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    // --- Datos y Autenticación ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUsuarioActual(user);
                // Asumimos un rol de admin para este ejemplo. Ajustar según tu lógica real.
                setEsAdmin(user.email.endsWith('@admin.com')); 
            } else {
                // Manejar usuario no logueado
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!usuarioActual) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch capacitación
                const capSnap = await getDoc(doc(db, 'capacitaciones', capacitacionId));
                if (capSnap.exists()) setCapacitacion({ id: capSnap.id, ...capSnap.data() });

                // Fetch todos los usuarios para la lógica de roles
                const usuariosSnap = await getDocs(collection(db, 'usuarios'));
                const usuarios = usuariosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const supervisoresVisibles = esAdmin
                    ? usuarios.filter(u => u.rol === 'supervisor')
                    : usuarios.filter(u => u.id === usuarioActual.uid);
                setSupervisores(supervisoresVisibles);
                if (!esAdmin && supervisoresVisibles.length > 0) {
                    // Expande al supervisor por defecto si no es admin
                    setExpandedSupervisor(supervisoresVisibles[0].id);
                    cargarCuadrilla(supervisoresVisibles[0].id);
                }

                // Fetch bloques de horarios
                const bloquesSnap = await getDocs(query(collection(db, 'capacitacion_bloques'), where('capacitacion_id', '==', capacitacionId)));
                const bloquesData = bloquesSnap.docs.map(b => ({ ...b.data(), id: b.id }));
                setBloques(bloquesData);

            } catch (error) {
                console.error("Error fetching data: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [capacitacionId, usuarioActual, esAdmin]);
    
    const diasDisponibles = useMemo(() => new Set(bloques.map(b => b.fecha)), [bloques]);

    const fechasSaturadas = useMemo(() => {
        const fechas = {};
        for (const b of bloques) {
            if (!fechas[b.fecha]) fechas[b.fecha] = { totalCupo: 0, totalAsignado: 0 };
            fechas[b.fecha].totalCupo += b.cupo_disponible;
            fechas[b.fecha].totalAsignado += (b.participantes || []).length;
        }
        return new Set(Object.keys(fechas).filter(fecha => fechas[fecha].totalAsignado >= fechas[fecha].totalCupo));
    }, [bloques]);

    const bloquesDelDia = useMemo(() => {
        if (!diaSeleccionado) return [];
        return bloques.filter(b => b.fecha === format(diaSeleccionado, 'yyyy-MM-dd'));
    }, [bloques, diaSeleccionado]);

    // --- Lógica de UI ---
    const cargarCuadrilla = async (supervisorId) => {
        // Evita recargar si ya existen los datos
        if (cuadrillas[supervisorId]) return;
        const q = query(collection(db, 'usuarios'), where('supervisorId', '==', supervisorId));
        const snap = await getDocs(q);
        const miembros = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setCuadrillas(prev => ({ ...prev, [supervisorId]: miembros }));
    };

    const toggleSupervisor = (supervisorId) => {
        const isOpening = expandedSupervisor !== supervisorId;
        setExpandedSupervisor(isOpening ? supervisorId : null);
        if (isOpening) {
            cargarCuadrilla(supervisorId);
        }
    };
    
    // --- Acciones ---
    const handleAsignar = async () => {
        if (!miembroSeleccionado || !horarioSeleccionado) return;
        setLoading(true);

        const bloqueRef = doc(db, 'capacitacion_bloques', horarioSeleccionado.id);

        try {
            await updateDoc(bloqueRef, {
                participantes: arrayUnion(miembroSeleccionado.id) // Guardar solo el ID
            });

            // Actualizar estado local para reflejar el cambio inmediatamente
            setBloques(prevBloques => prevBloques.map(b => 
                b.id === horarioSeleccionado.id
                    ? { ...b, participantes: [...(b.participantes || []), miembroSeleccionado.id] }
                    : b
            ));

            setMiembroSeleccionado(null);
            setHorarioSeleccionado(null);

        } catch (error) {
            console.error("Error al asignar: ", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !capacitacion) {
        return <div className="p-6 text-center text-text-muted">Cargando detalles de asignación...</div>;
    }

    return (
        <div className="p-6">
            <CustomCalendarStyles />
            <h1 className="text-3xl font-bold text-text-primary mb-1">{capacitacion?.titulo}</h1>
            <p className="text-text-muted mb-6">Selecciona al personal, el día y la hora para asignar a la capacitación.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna 1: Personal */}
                <div className="lg:col-span-1 bg-secondary p-4 rounded-xl border border-border-secondary">
                    <h2 className="font-bold text-text-primary mb-3 flex items-center gap-2"><Users size={20}/> Personal Disponible</h2>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                        {supervisores.map(sup => (
                            <div key={sup.id}>
                                <button onClick={() => toggleSupervisor(sup.id)} className="w-full flex justify-between items-center p-2 rounded-lg bg-primary hover:bg-hover transition-colors">
                                    <span className="font-semibold">{sup.nombre}</span>
                                    {expandedSupervisor === sup.id ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                                </button>
                                {expandedSupervisor === sup.id && (
                                    <div className="pt-2 pl-2 space-y-1">
                                        {(cuadrillas[sup.id] || []).map(miembro => {
                                            const yaAsignado = bloques.some(b => b.participantes?.includes(miembro.id));
                                            return (
                                                <button key={miembro.id} 
                                                    disabled={yaAsignado}
                                                    onClick={() => setMiembroSeleccionado(miembro)}
                                                    className={`w-full text-left p-2 rounded-md transition-colors text-sm ${yaAsignado ? 'text-text-muted opacity-50 cursor-not-allowed' : 'hover:bg-hover'} ${miembroSeleccionado?.id === miembro.id ? 'bg-accent text-accent-text' : ''}`}>
                                                    {miembro.nombre}
                                                    {yaAsignado && <span className='text-xs ml-2'>(Ya asignado)</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Columna 2: Calendario y Horarios */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-secondary p-4 rounded-xl border border-border-secondary">
                         <h2 className="font-bold text-text-primary mb-3 flex items-center gap-2"><CalendarIcon size={20}/> Días Disponibles</h2>
                         <Calendar
                            onChange={setDiaSeleccionado}
                            value={diaSeleccionado}
                            tileDisabled={({ date }) => {
                                const formattedDate = format(date, 'yyyy-MM-dd');
                                return !diasDisponibles.has(formattedDate) || fechasSaturadas.has(formattedDate);
                            }}
                        />
                    </div>
                    {diaSeleccionado && (
                        <div className="bg-secondary p-4 rounded-xl border border-border-secondary">
                            <h2 className="font-bold text-text-primary mb-3 flex items-center gap-2"><Clock size={20}/> Horarios para el {format(diaSeleccionado, 'dd/MM/yyyy')}</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {bloquesDelDia.map(b => {
                                    const ocupados = b.participantes?.length || 0;
                                    const lleno = ocupados >= b.cupo_disponible;
                                    return (
                                        <button key={b.id}
                                            disabled={lleno}
                                            onClick={() => setHorarioSeleccionado(b)}
                                            className={`p-3 rounded-lg text-center transition-colors ${lleno ? 'bg-red-500/10 text-red-500 opacity-60 cursor-not-allowed' : 'hover:bg-hover'} ${horarioSeleccionado?.id === b.id ? 'bg-accent text-accent-text' : 'bg-primary'}`}>
                                            <p className="font-bold">{b.hora_inicio} - {b.hora_fin}</p>
                                            <p className="text-xs">{ocupados} / {b.cupo_disponible} Asignados</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer de Asignación */}
            {miembroSeleccionado && horarioSeleccionado && (
                 <div className="mt-6 p-4 bg-secondary rounded-xl border border-border flex items-center justify-between sticky bottom-6 shadow-lg">
                    <div>
                        <p className="text-text-muted text-sm">Asignar a:</p>
                        <p className="font-bold text-text-primary text-lg">{miembroSeleccionado.nombre}</p>
                    </div>
                    <div>
                         <p className="text-text-muted text-sm">En el horario:</p>
                        <p className="font-bold text-text-primary text-lg">{horarioSeleccionado.hora_inicio} - {horarioSeleccionado.hora_fin}</p>
                    </div>
                    <button onClick={handleAsignar} disabled={loading} className="flex items-center gap-2 bg-accent-strong text-accent-text font-bold py-3 px-6 rounded-lg hover:bg-accent transition-colors">
                        {loading ? 'Asignando...' : 'Confirmar Asignación'}
                        <Check size={20}/>
                    </button>
                </div>
            )}
        </div>
    );
};

export default AsignacionDetalle;
