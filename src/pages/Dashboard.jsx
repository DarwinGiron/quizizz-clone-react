
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, BookOpen, Star, CheckSquare } from 'lucide-react';

// Datos de ejemplo
const weeklyData = [
  { name: 'Lun', Horas: 4, Asistencia: 24 },
  { name: 'Mar', Horas: 3, Asistencia: 13 },
  { name: 'Mié', Horas: 5, Asistencia: 98 },
  { name: 'Jue', Horas: 2, Asistencia: 39 },
  { name: 'Vie', Horas: 6, Asistencia: 48 },
  { name: 'Sáb', Horas: 3, Asistencia: 38 },
];

const StatCard = ({ icon, title, value, subtext }) => (
  <div className="bg-secondary p-6 rounded-xl border border-border flex flex-col justify-between h-full">
    <div className="flex justify-between items-start mb-4">
      {/* CORREGIDO: Se usa text-text-secondary */}
      <h3 className="text-lg font-semibold text-text-secondary">{title}</h3>
      <div className="text-accent">{icon}</div>
    </div>
    <div>
      {/* CORREGIDO: Se usa text-text-primary */}
      <p className="text-4xl font-bold text-text-primary">{value}</p>
      {/* CORREGIDO: Se usa text-text-muted */}
      <p className="text-sm text-text-muted">{subtext}</p>
    </div>
  </div>
);

const Dashboard = () => {
  return (
    // CORREGIDO: Se usa text-text-primary
    <div className="p-2 text-text-primary">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      {/* --- Fila de Estadísticas --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<Users size={24} />} title="Usuarios Activos" value="1,254" subtext="+12% este mes" />
        <StatCard icon={<BookOpen size={24} />} title="Capacitaciones" value="82" subtext="3 completadas hoy" />
        <StatCard icon={<Star size={24} />} title="Evaluaciones" value="4.8/5" subtext="Promedio general" />
        <StatCard icon={<CheckSquare size={24} />} title="Tareas Completadas" value="94%" subtext="Total de asignaciones" />
      </div>

      {/* --- Gráfico Principal --- */}
      <div className="bg-secondary p-6 rounded-xl border border-border">
        {/* CORREGIDO: Se usa text-text-primary */}
        <h2 className="text-xl font-bold mb-4 text-text-primary">Resumen Semanal de Actividad</h2>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <BarChart data={weeklyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--background-tertiary)', 
                  borderColor: 'var(--border-primary)', 
                  color: 'var(--text-primary)' 
                }}
              />
              <Legend wrapperStyle={{ color: 'var(--text-secondary)' }}/>
              <Bar dataKey="Horas" fill="var(--accent-color)" name="Horas de Capacitación" />
              <Bar dataKey="Asistencia" fill="var(--accent-color-strong)" name="Asistentes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
