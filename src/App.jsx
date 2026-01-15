import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
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

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} /> 
            <Route path="/users" element={<UsuariosAdmin />} /> 
            
            {/* --- RUTAS DE CAPACITACIONES MEJORADAS --- */}
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
            <Route path="/live/:quizId/:sessionId" element={<LiveSession />} />
            <Route path="/session-report/:sessionId" element={<SessionReport />} />
            <Route path="/active-sessions" element={<SessionsPage />} /> 
            
            {/* --- RUTA DE AJUSTES CORREGIDA --- */}
            <Route path="/settings" element={<Ajustes />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
