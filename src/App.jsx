import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';

import { auth } from './firebase/config';
import MainLayout from './layouts/MainLayout';
import { useConfetti } from './shared/hooks/useConfetti';
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

// Componente para rutas privadas
function PrivateRoute({ children }) {
  const [user, loading] = useAuthState(auth);
  if (loading) return <div className="p-10">Cargando...</div>;
  return user ? children : <Navigate to="/login" />;
}

function App() {
  useConfetti();

  const [user] = useAuthState(auth);

  return (
    <SidebarProvider>
      <Router>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

        {/* Rutas protegidas con layout */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/create"
          element={
            <PrivateRoute>
              <MainLayout>
                <CreateQuiz />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/myquizzes"
          element={
            <PrivateRoute>
              <MainLayout>
                <MyQuizzes />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/quiz/:id"
          element={
            <PrivateRoute>
              <MainLayout>
                <QuizDetail />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/edit/:id"
          element={
            <PrivateRoute>
              <MainLayout>
                <EditQuiz />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/preview/:id"
          element={
            <PrivateRoute>
              <MainLayout>
                <PreviewQuiz />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/live/:quizId/:sessionId"
          element={
            <PrivateRoute>
              <LiveSession />
            </PrivateRoute>
          }
        />
        <Route
          path="/sessions/:sessionId"
          element={
            <PrivateRoute>
              <MainLayout>
                <SessionsPage />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/sessions/:sessionId/report"
          element={
            <PrivateRoute>
              <MainLayout>
                <SessionReport />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/sessions/:sessionId/stats"
          element={
            <PrivateRoute>
              <MainLayout>
                <SessionStats />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* Capacitaciones */}
        <Route
          path="/capacitaciones"
          element={
            <PrivateRoute>
              <MainLayout>
                <CapacitacionesDashboard />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/capacitaciones/nueva"
          element={
            <PrivateRoute>
              <MainLayout>
                <CreateCapacitacion />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/capacitaciones/:id/edit"
          element={
            <PrivateRoute>
              <MainLayout>
                <EditCapacitacion />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/capacitaciones/:id/detalle"
          element={
            <PrivateRoute>
              <MainLayout>
                <CapacitacionDetail />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/capacitaciones/:capacitacionId/horarios"
          element={
            <PrivateRoute>
              <MainLayout>
                <HorariosPorCapacitacion />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* Usuarios y cuadrillas */}
        <Route
          path="/usuarios"
          element={
            <PrivateRoute>
              <MainLayout>
                <UsuariosAdmin />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/cuadrilla/:supervisorId"
          element={
            <PrivateRoute>
              <MainLayout>
                <GestionarCuadrilla />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* Evaluaciones y asignaciones */}
        <Route
          path="/evaluacion/nueva"
          element={
            <PrivateRoute>
              <MainLayout>
                <SeleccionTipoEvaluacion />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/asignaciones"
          element={
            <PrivateRoute>
              <MainLayout>
                <Asignaciones />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/asignaciones/avanzada/:capacitacionId"
          element={
            <PrivateRoute>
              <MainLayout>
                <AsignacionAvanzada />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/asignaciones/intuitiva/:capacitacionId"
          element={
            <PrivateRoute>
              <MainLayout>
                <AsignacionIntuitiva />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* Sesiones en vivo */}
        <Route path="/join" element={<JoinSession />} />
        <Route path="/join/:sessionId" element={<JoinSession />} />

        {/* Estadísticas en vivo (pública para admin) */}
        <Route
          path="/admin/session/:quizId/:sessionId/stats"
          element={
            <PrivateRoute>
              <SessionStatsAdmin />
            </PrivateRoute>
          }
        />
        <Route
          path="/estadisticas-totales/:sessionId"
          element={
            <PrivateRoute>
              <MainLayout>
                <EstadisticasTotales />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* Fallback: cualquier ruta no definida redirige a login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  </SidebarProvider>
  );
}

export default App;