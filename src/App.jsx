import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';

import { auth } from './firebase/config';
import MainLayout from './layouts/MainLayout';
import confetti from './utils/confetti';
import { SidebarProvider } from './shared';

// Importaciones desde los módulos organizados
import {
  // Autenticación
  Login,
  Register,
  
  // Dashboard
  Dashboard,
  
  // Evaluaciones
  CreateQuiz,
  MyQuizzes,
  QuizDetail,
  PreviewQuiz,
  EditQuiz,
  LiveSession,
  JoinSession,
  SeleccionTipoEvaluacion,
  
  // Estadísticas
  SessionsPage,
  SessionReport,
  SessionStats,
  SessionStatsAdmin,
  EstadisticasTotales,
  
  // Capacitaciones
  EditCapacitacion,
  CapacitacionDetail,
  CapacitacionesDashboard,
  CreateCapacitacion,
  HorariosPorCapacitacion,
  
  // Asignaciones
  Asignaciones,
  AsignacionAvanzada,
  AsignacionIntuitiva,
  
  // Usuarios
  UsuariosAdmin,
  GestionarCuadrilla,
} from './modules';

function PrivateRoute({ children }) {
  const [user, loading] = useAuthState(auth);
  if (loading) return <div className="p-10">Cargando...</div>;
  return user ? children : <Navigate to="/login" />;
}

function App() {
  // Montar el canvas de confetti global
  React.useEffect(() => {
    if (!document.getElementById('confetti-canvas')) {
      const canvas = document.createElement('canvas');
      canvas.id = 'confetti-canvas';
      canvas.style.position = 'fixed';
      canvas.style.top = 0;
      canvas.style.left = 0;
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = 9999;
      document.body.appendChild(canvas);
      confetti.create(canvas, { resize: true, useWorker: true });
    }
  }, []);

  const [user] = useAuthState(auth);

  return (
    <SidebarProvider>
      <Router>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />


          {/* Rutas protegidas con layout */}
          <Route path="/dashboard" element={<PrivateRoute><MainLayout><Dashboard /></MainLayout></PrivateRoute>} />
          <Route path="/create" element={<PrivateRoute><MainLayout><CreateQuiz /></MainLayout></PrivateRoute>} />
          <Route path="/myquizzes" element={<PrivateRoute><MainLayout><MyQuizzes /></MainLayout></PrivateRoute>} />
          <Route path="/quiz/:id" element={<PrivateRoute><MainLayout><QuizDetail /></MainLayout></PrivateRoute>} />
          <Route path="/edit/:id" element={<PrivateRoute><MainLayout><EditQuiz /></MainLayout></PrivateRoute>} />
          <Route path="/preview/:id" element={<PrivateRoute><MainLayout><PreviewQuiz /></MainLayout></PrivateRoute>} />
          <Route path="/live/:quizId/:sessionId" element={<PrivateRoute><LiveSession /></PrivateRoute>} />
          <Route path="/sessions/:sessionId" element={<PrivateRoute><MainLayout><SessionsPage /></MainLayout></PrivateRoute>} />
          <Route path="/sessions/:sessionId/report" element={<PrivateRoute><MainLayout><SessionReport /></MainLayout></PrivateRoute>} />
          <Route path="/sessions/:sessionId/stats" element={<PrivateRoute><MainLayout><SessionStats /></MainLayout></PrivateRoute>} />
          <Route path="/capacitaciones/:capacitacionId/horarios" element={<HorariosPorCapacitacion />} />
          {/* Capacitaciones (también protegidas y con layout) */}
          <Route path="/capacitaciones" element={<PrivateRoute><MainLayout><CapacitacionesDashboard /></MainLayout></PrivateRoute>} />
          <Route path="/capacitaciones/nueva" element={<PrivateRoute><MainLayout><CreateCapacitacion /></MainLayout></PrivateRoute>} />
          <Route path="/capacitaciones/:id/edit"element={<PrivateRoute><MainLayout><EditCapacitacion /></MainLayout></PrivateRoute>}/>
          <Route path="/capacitaciones/:id/detalle"element={<PrivateRoute><MainLayout><CapacitacionDetail /></MainLayout></PrivateRoute>}/>
          <Route path="/capacitaciones/:capacitacionId/horarios" element={<HorariosPorCapacitacion />}/>
          <Route path="/usuarios" element={<PrivateRoute><MainLayout><UsuariosAdmin /></MainLayout></PrivateRoute>}/>
          <Route path="/cuadrilla/:supervisorId"element={<PrivateRoute><MainLayout><GestionarCuadrilla /></MainLayout></PrivateRoute>}/>
          <Route path="/evaluacion/nueva" element={<PrivateRoute><MainLayout><SeleccionTipoEvaluacion /></MainLayout></PrivateRoute>}/>
          <Route path="/asignaciones" element={<Asignaciones />} />
          <Route path="/asignaciones/avanzada/:capacitacionId" element={<AsignacionAvanzada />} />
          <Route path="/asignaciones/intuitiva/:capacitacionId" element={<AsignacionIntuitiva />} />
          <Route path="/join" element={<JoinSession />} />
          <Route path="/join/:sessionId" element={<JoinSession />} />
          {/* Página de estadísticas en vivo para el admin (ahora pública) */}
          <Route path="/admin/session/:quizId/:sessionId/stats" element={<SessionStatsAdmin />} />
          <Route path="/estadisticas-totales/:sessionId" element={<PrivateRoute><EstadisticasTotales /></PrivateRoute>} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </SidebarProvider>
  );
}

export default App;
