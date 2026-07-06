import React, { useEffect, useState, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../../../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Link } from 'react-router-dom';
import {
  format,
  parseISO,
  isAfter,
  isBefore,
  differenceInDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  isWithinInterval,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  BookOpen,
  PlayCircle,
  Users,
  Gauge,
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronRight,
  LogOut,
  GraduationCap,
  ClipboardList,
  UserCog,
  PlusCircle,
} from 'lucide-react';

const getEstadoCapacitacion = (fechaInicio, fechaFin, ref = new Date()) => {
  if (!fechaInicio || !fechaFin) return 'proxima';
  try {
    const inicio = parseISO(fechaInicio);
    const fin = parseISO(fechaFin);
    if (isBefore(ref, inicio)) return 'proxima';
    if (isAfter(ref, fin)) return 'finalizada';
    return 'activa';
  } catch {
    return 'proxima';
  }
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [bloques, setBloques] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() =>
    format(new Date(), 'yyyy-MM')
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) =>
      setUser(currentUser)
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const capacitacionesSnapshot = await getDocs(
          collection(db, 'capacitaciones')
        );
        let caps = capacitacionesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Solo en desarrollo: si no hay capacitaciones reales, usar datos de
        // ejemplo para poder trabajar la UI. En producción se muestra el
        // estado vacío real ("No hay capacitaciones registradas...").
        if (caps.length === 0 && import.meta.env.DEV) {
          caps = [
            { id: 'ejemplo1', titulo: 'Seguridad Industrial y Prevención de Riesgos', categoria: 'Seguridad', fechaInicio: '2025-01-15', fechaFin: '2025-01-30', instructor: 'Ing. María García' },
            { id: 'ejemplo2', titulo: 'Manejo de Equipos Pesados', categoria: 'Técnica', fechaInicio: '2025-01-20', fechaFin: '2025-02-05', instructor: 'Tec. Carlos López' },
            { id: 'ejemplo3', titulo: 'Liderazgo y Gestión de Equipos', categoria: 'Liderazgo', fechaInicio: '2025-01-10', fechaFin: '2025-01-12', instructor: 'Lic. Ana Ruiz' },
            { id: 'ejemplo4', titulo: 'Primeros Auxilios en el Trabajo', categoria: 'Seguridad', fechaInicio: '2025-02-01', fechaFin: '2025-02-10', instructor: 'Dr. Pedro Morales' },
          ];
        }

        const bloquesSnapshot = await getDocs(
          collection(db, 'capacitacion_bloques')
        );
        let blqs = bloquesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (blqs.length === 0 && import.meta.env.DEV) {
          blqs = [
            { id: 'bloque1', capacitacion_id: 'ejemplo1', fecha: '2025-01-15', cupo_disponible: 25, participantes: ['Juan Pérez', 'María González', 'Carlos López'] },
            { id: 'bloque2', capacitacion_id: 'ejemplo2', fecha: '2025-01-20', cupo_disponible: 15, participantes: ['Ana Martín', 'Pedro Rodríguez'] },
          ];
        }

        setCapacitaciones(caps);
        setBloques(blqs);
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Lista de los últimos 12 meses para el filtro
  const mesesDisponibles = useMemo(() => {
    const hoy = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const fecha = subMonths(hoy, i);
      return {
        value: format(fecha, 'yyyy-MM'),
        label: format(fecha, 'MMMM yyyy', { locale: es }),
      };
    });
  }, []);

  // Estadísticas del mes seleccionado (y comparación con el mes anterior)
  const statsMes = useMemo(() => {
    const refMonth = parseISO(`${selectedMonth}-01`);
    const inicioMes = startOfMonth(refMonth);
    const finMes = endOfMonth(refMonth);
    const inicioMesPrev = startOfMonth(subMonths(refMonth, 1));
    const finMesPrev = endOfMonth(subMonths(refMonth, 1));

    const enRango = (cap, ini, fin) => {
      if (!cap.fechaInicio) return false;
      try {
        return isWithinInterval(parseISO(cap.fechaInicio), {
          start: ini,
          end: fin,
        });
      } catch {
        return false;
      }
    };

    const capsMes = capacitaciones.filter((c) => enRango(c, inicioMes, finMes));
    const capsMesPrev = capacitaciones.filter((c) =>
      enRango(c, inicioMesPrev, finMesPrev)
    );

    const idsMes = new Set(capsMes.map((c) => c.id));
    const bloquesMes = bloques.filter((b) => idsMes.has(b.capacitacion_id));

    const participantesMes = bloquesMes.reduce(
      (t, b) => t + (b.participantes?.length || 0),
      0
    );
    const cuposMes = bloquesMes.reduce(
      (t, b) => t + (b.cupo_disponible || 0),
      0
    );
    const ocupacionMes =
      cuposMes > 0 ? Math.round((participantesMes / cuposMes) * 100) : 0;

    const activasMes = capsMes.filter(
      (c) => getEstadoCapacitacion(c.fechaInicio, c.fechaFin) === 'activa'
    ).length;
    const finalizadasMes = capsMes.filter(
      (c) => getEstadoCapacitacion(c.fechaInicio, c.fechaFin) === 'finalizada'
    ).length;

    const variacion = (() => {
      if (capsMesPrev.length === 0) return capsMes.length > 0 ? 100 : 0;
      return Math.round(
        ((capsMes.length - capsMesPrev.length) / capsMesPrev.length) * 100
      );
    })();

    return {
      capacitaciones: capsMes.length,
      participantes: participantesMes,
      activas: activasMes,
      finalizadas: finalizadasMes,
      ocupacion: ocupacionMes,
      variacion,
      mesAnterior: capsMesPrev.length,
      listado: capsMes,
    };
  }, [capacitaciones, bloques, selectedMonth]);

  // Próximas capacitaciones (globales, no por mes)
  const proximasCapacitaciones = useMemo(
    () =>
      capacitaciones
        .filter(
          (c) =>
            c.fechaInicio &&
            getEstadoCapacitacion(c.fechaInicio, c.fechaFin) === 'proxima'
        )
        .sort((a, b) => parseISO(a.fechaInicio) - parseISO(b.fechaInicio))
        .slice(0, 5),
    [capacitaciones]
  );

  const handleSignOut = () => signOut(auth);

  const getSaludo = () => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const esMesActual = selectedMonth === format(new Date(), 'yyyy-MM');
  const labelMes =
    mesesDisponibles.find((m) => m.value === selectedMonth)?.label ||
    selectedMonth;

  if (loading) {
    return (
      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        <div className="flex flex-col justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const tarjetas = [
    {
      label: 'Capacitaciones',
      valor: statsMes.capacitaciones,
      sub: esMesActual ? 'Este mes' : labelMes,
      Icon: BookOpen,
      color: 'indigo',
    },
    {
      label: 'Participantes',
      valor: statsMes.participantes,
      sub: 'Inscritos en el mes',
      Icon: Users,
      color: 'blue',
    },
    {
      label: 'Activas',
      valor: statsMes.activas,
      sub: `${statsMes.finalizadas} finalizadas`,
      Icon: PlayCircle,
      color: 'green',
    },
    {
      label: 'Ocupación',
      valor: `${statsMes.ocupacion}%`,
      sub: 'Promedio del mes',
      Icon: Gauge,
      color: 'orange',
    },
  ];

  const colorClasses = {
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
  };

  const accesos = [
    { to: '/capacitaciones/nueva', titulo: 'Nueva Capacitación', desc: 'Crear una nueva capacitación', Icon: PlusCircle, from: 'from-indigo-500', to2: 'to-indigo-600' },
    { to: '/capacitaciones', titulo: 'Ver Capacitaciones', desc: 'Gestionar todas las capacitaciones', Icon: BookOpen, from: 'from-blue-500', to2: 'to-blue-600' },
    { to: '/asignaciones', titulo: 'Asignaciones', desc: 'Gestionar participantes', Icon: ClipboardList, from: 'from-green-500', to2: 'to-green-600' },
    { to: '/usuarios', titulo: 'Usuarios', desc: 'Administrar usuarios', Icon: UserCog, from: 'from-orange-500', to2: 'to-orange-600' },
  ];

  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
              {getSaludo()}
              {user?.displayName ? `, ${user.displayName}` : ''}
            </h1>
            <p className="text-gray-600">
              Resumen de la actividad del sistema de capacitaciones
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-500">Hoy es</p>
              <p className="font-semibold text-gray-900 text-sm">
                {format(new Date(), 'EEEE, dd MMM yyyy', { locale: es })}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Barra de filtro mensual */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Estadísticas mensuales
              </p>
              <p className="text-xs text-gray-500 capitalize">{labelMes}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 hidden sm:block">
              Mes:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:border-indigo-500 focus:outline-none capitalize cursor-pointer bg-white"
            >
              {mesesDisponibles.map((m) => (
                <option key={m.value} value={m.value} className="capitalize">
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tarjetas de estadísticas del mes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {tarjetas.map(({ label, valor, sub, Icon, color }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {valor}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{sub}</p>
                </div>
                <div className={`${colorClasses[color].bg} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${colorClasses[color].text}`} />
                </div>
              </div>
              {label === 'Capacitaciones' && statsMes.mesAnterior >= 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs">
                  {statsMes.variacion >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={
                      statsMes.variacion >= 0
                        ? 'text-green-600 font-semibold'
                        : 'text-red-600 font-semibold'
                    }
                  >
                    {statsMes.variacion >= 0 ? '+' : ''}
                    {statsMes.variacion}%
                  </span>
                  <span className="text-gray-500">vs. mes anterior</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-gray-900 mb-5">
            Accesos Rápidos
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {accesos.map(({ to, titulo, desc, Icon, from, to2 }) => (
              <Link
                key={to}
                to={to}
                className={`bg-gradient-to-br ${from} ${to2} text-white p-6 rounded-xl transition-all transform hover:scale-[1.03] shadow-lg`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{titulo}</h3>
                    <p className="text-white/80 text-sm">{desc}</p>
                  </div>
                  <Icon className="w-8 h-8 opacity-90" />
                </div>
              </Link>
            ))}
          </div>

          {/* Capacitaciones del mes seleccionado */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Capacitaciones de <span className="capitalize">{labelMes}</span>
              </h3>
              <span className="text-sm font-medium bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">
                {statsMes.listado.length}
              </span>
            </div>

            {statsMes.listado.length > 0 ? (
              <div className="space-y-3">
                {statsMes.listado.map((cap) => {
                  const estado = getEstadoCapacitacion(
                    cap.fechaInicio,
                    cap.fechaFin
                  );
                  const estadoStyles = {
                    activa: 'bg-green-100 text-green-700',
                    proxima: 'bg-blue-100 text-blue-700',
                    finalizada: 'bg-gray-100 text-gray-600',
                  };
                  return (
                    <Link
                      key={cap.id}
                      to={`/capacitaciones/${cap.id}/detalle`}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                          <GraduationCap className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 group-hover:text-indigo-700">
                            {cap.titulo}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {cap.instructor} • {cap.categoria}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${estadoStyles[estado]}`}
                      >
                        {estado}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">
                  No hay capacitaciones registradas en {labelMes}.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Próximas capacitaciones */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Próximas Capacitaciones
            </h3>

            {proximasCapacitaciones.length > 0 ? (
              <div className="space-y-3">
                {proximasCapacitaciones.map((cap) => (
                  <Link
                    key={cap.id}
                    to={`/capacitaciones/${cap.id}/detalle`}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                  >
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm truncate group-hover:text-indigo-700">
                        {cap.titulo}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {differenceInDays(
                          parseISO(cap.fechaInicio),
                          new Date()
                        )}{' '}
                        días • {format(parseISO(cap.fechaInicio), 'dd MMM', { locale: es })}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">
                  No hay capacitaciones próximas programadas.
                </p>
              </div>
            )}
          </div>

          {/* Resumen del mes */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Resumen de <span className="capitalize">{labelMes}</span>
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-indigo-100 text-sm">Capacitaciones</span>
                <span className="font-bold text-lg">
                  {statsMes.capacitaciones}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-indigo-100 text-sm">Participantes</span>
                <span className="font-bold text-lg">
                  {statsMes.participantes}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-indigo-100 text-sm">Finalizadas</span>
                <span className="font-bold text-lg">
                  {statsMes.finalizadas}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/20">
                <span className="text-indigo-100 text-sm">Ocupación</span>
                <span className="font-bold text-lg">{statsMes.ocupacion}%</span>
              </div>
            </div>
          </div>

          {/* Estado del sistema */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Estado del Sistema
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Base de datos', estado: 'Conectado', color: 'green' },
                { label: 'Autenticación', estado: 'Activo', color: 'green' },
                { label: 'Sincronización', estado: 'En proceso', color: 'yellow' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-gray-600">{s.label}</span>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        s.color === 'green' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        s.color === 'green'
                          ? 'text-green-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {s.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
