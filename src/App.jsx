import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout'; // Layout principal que incluye el Sidebar
import Dashboard from './pages/Dashboard';
import UsuariosAdmin from './pages/UsuariosAdmin';
import CapacitacionesDashboard from './pages/CapacitacionesDashboard';
import CreateCapacitacion from './pages/CreateCapacitacion'; 
import EditCapacitacion from './pages/EditCapacitacion';
import CapacitacionDetallePage from './pages/CapacitacionDetallePage';
import MyQuizzes from './pages/MyQuizzes';
import CreateQuiz from './pages/CreateQuiz';
import EditQuiz from './pages/EditQuiz';
import QuizDetail from './pages/QuizDetail';
import LiveSession from './pages/LiveSession';
import SessionReport from './pages/SessionReport';
import Asignaciones from './pages/Asignaciones';
import AsignacionDetalle from './pages/AsignacionDetalle';
import SessionsPage from './pages/SessionsPage';
import Ajustes from './pages/Ajustes';
import Login from './pages/Login';
import Register from './pages/Register';
import PersonnelCodeEntry from './pages/PersonnelCodeEntry';
import JoinLandingPage from './pages/JoinLandingPage';
import WaitingRoom from './pages/WaitingRoom';

// Idealmente, tendrías un componente para rutas protegidas
// import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas que no usan el MainLayout (ej. Login, Register) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/join" element={<PersonnelCodeEntry />} />
        <Route path="/landing/:sessionId" element={<JoinLandingPage />} />
        <Route path="/waiting/:sessionId/:participantId" element={<WaitingRoom />} />
        <Route path="/live-session/:quizId" element={<LiveSession />} />

        {/* Rutas que usan el MainLayout */}
        <Route 
          path="/*" 
          element={
            <MainLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} /> 
                <Route path="/users" element={<UsuariosAdmin />} /> 
                
                <Route path="/capacitaciones" element={<CapacitacionesDashboard />} />
                <Route path="/crear-capacitacion" element={<CreateCapacitacion />} /> 
                <Route path="/capacitacion/:id" element={<CapacitacionDetallePage />} />
                <Route path="/editar-capacitacion/:id" element={<EditCapacitacion />} />
                
                <Route path="/asignaciones" element={<Asignaciones />} /> 
                <Route path="/asignaciones/detalle/:capacitacionId" element={<AsignacionDetalle />} />

                <Route path="/my-quizzes" element={<MyQuizzes />} />
                <Route path="/create-quiz" element={<CreateQuiz />} />
                <Route path="/edit-quiz/:id" element={<EditQuiz />} />
                <Route path="/quiz/:id" element={<QuizDetail />} />
                
                <Route path="/session-report/:sessionId" element={<SessionReport />} />
                <Route path="/active-sessions" element={<SessionsPage />} /> 
                
                <Route path="/settings" element={<Ajustes />} />
                
                {/* Agrega aquí una ruta por defecto o de 404 si lo necesitas */}
                {/* <Route path="*" element={<NotFound />} /> */}
              </Routes>
            </MainLayout>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
