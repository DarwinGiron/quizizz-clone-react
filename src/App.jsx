import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import MainLayout from './layouts/MainLayout';
import { useConfetti } from './shared/hooks/useConfetti';
import {
  SidebarProvider,
  AuthProvider,
  useAuth,
  ToastProvider,
  ConfirmProvider,
  ErrorBoundary,
  NotFound,
} from './shared';

// Cada página se importa con lazy() para que Vite genere un chunk aparte:
// el navegador solo la descarga cuando el usuario navega a esa ruta.

// Autenticación
const Login = lazy(() => import('./modules/auth/pages/Login'));

// Dashboard
const Dashboard = lazy(() => import('./modules/dashboard/pages/Dashboard'));

// Evaluaciones
const CreateQuiz = lazy(() => import('./modules/evaluaciones/pages/CreateQuiz'));
const MyQuizzes = lazy(() => import('./modules/evaluaciones/pages/MyQuizzes'));
const QuizDetail = lazy(() => import('./modules/evaluaciones/pages/QuizDetail'));
const PreviewQuiz = lazy(() => import('./modules/evaluaciones/pages/PreviewQuiz'));
const EditQuiz = lazy(() => import('./modules/evaluaciones/pages/EditQuiz'));
const LiveSession = lazy(() => import('./modules/evaluaciones/pages/LiveSession'));
const JoinSession = lazy(() => import('./modules/evaluaciones/pages/JoinSession'));
const SeleccionTipoEvaluacion = lazy(() => import('./modules/evaluaciones/components/SeleccionTipoEvaluacion'));

// Estadísticas
const SessionsPage = lazy(() => import('./modules/estadisticas/pages/SessionsPage'));
const SessionReport = lazy(() => import('./modules/estadisticas/pages/SessionReport'));
const SessionStats = lazy(() => import('./modules/estadisticas/components/SessionStats'));
const SessionStatsAdmin = lazy(() => import('./modules/estadisticas/pages/SessionStatsAdmin'));
const EstadisticasTotales = lazy(() => import('./modules/estadisticas/pages/EstadisticasTotales'));

// Capacitaciones
const EditCapacitacion = lazy(() => import('./modules/capacitaciones/pages/EditCapacitacion'));
const CapacitacionDetail = lazy(() => import('./modules/capacitaciones/pages/CapacitacionDetail'));
const CapacitacionesDashboard = lazy(() => import('./modules/capacitaciones/pages/CapacitacionesDashboard'));
const CreateCapacitacion = lazy(() => import('./modules/capacitaciones/pages/CreateCapacitacion'));
const HorariosPorCapacitacion = lazy(() => import('./modules/capacitaciones/pages/HorariosPorCapacitacion'));

// Asignaciones
const Asignaciones = lazy(() => import('./modules/asignaciones/pages/Asignaciones'));
const AsignacionIntuitiva = lazy(() => import('./modules/asignaciones/pages/AsignacionIntuitiva'));
const AsignacionSupervisor = lazy(() => import('./modules/asignaciones/pages/AsignacionSupervisor'));
const MisAsignaciones = lazy(() => import('./modules/asignaciones/pages/MisAsignaciones'));

// Usuarios
const UsuariosAdmin = lazy(() => import('./modules/usuarios/pages/UsuariosAdmin'));
const GestionarCuadrilla = lazy(() => import('./modules/usuarios/pages/GestionarCuadrilla'));

// Se muestra brevemente mientras el navegador descarga el chunk de la ruta
function RouteFallback() {
  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
    </div>
  );
}

// Componente para rutas privadas (con control opcional por rol)
function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10">Cargando...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.rol)) {
    return (
      <Navigate
        to={user.rol === 'supervisor' ? '/mis-asignaciones' : '/dashboard'}
      />
    );
  }
  return children;
}

function App() {
  useConfetti();

  return (
    <ErrorBoundary>
    <ToastProvider>
    <ConfirmProvider>
    <SidebarProvider>
      <AuthProvider>
      <Router>
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Ruta pública. El registro es solo por invitación: todas las
              cuentas (admin, supervisor) se crean desde el panel de
              Usuarios, no hay autoregistro público. */}
          <Route path="/login" element={<Login />} />

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
          path="/asignaciones/intuitiva/:capacitacionId"
          element={
            <PrivateRoute>
              <MainLayout>
                <AsignacionIntuitiva />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* Vista exclusiva del supervisor */}
        <Route
          path="/mis-asignaciones"
          element={
            <PrivateRoute roles={['supervisor', 'admin']}>
              <MainLayout>
                <MisAsignaciones />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/mis-asignaciones/:capacitacionId"
          element={
            <PrivateRoute roles={['supervisor', 'admin']}>
              <MainLayout>
                <AsignacionSupervisor />
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

        {/* Cualquier ruta no definida muestra una página 404 amigable */}
        <Route path="*" element={<NotFound />} />
      </Routes>
        </Suspense>
    </Router>
      </AuthProvider>
  </SidebarProvider>
    </ConfirmProvider>
    </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;