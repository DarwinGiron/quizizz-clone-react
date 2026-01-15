import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { CheckCircle, XCircle, Users, Clock, Download, Play, Eye, Edit, BarChart2, Plus } from 'lucide-react';
import UserSelection from '../components/UserSelection'; // Importando el nuevo componente

const QuizDetail = () => {
  const { id: quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [assignments, setAssignments] = useState([]); // Estado para las asignaciones
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('questions');

  // State para el formulario de nueva asignación
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [assignmentName, setAssignmentName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchQuizData = useCallback(async () => {
    if (!quizId) return;
    setLoading(true);
    try {
      const [quizDoc, sessionsSnapshot, assignmentsSnapshot] = await Promise.all([
        getDoc(doc(db, 'quizzes', quizId)),
        getDocs(query(collection(db, 'sessions'), where('quizId', '==', quizId))),
        getDocs(query(collection(db, 'assignments'), where('quizId', '==', quizId)))
      ]);

      if (quizDoc.exists()) setQuiz({ id: quizDoc.id, ...quizDoc.data() });
      else throw new Error('La evaluación no fue encontrada.');
      
      setSessions(sessionsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setAssignments(assignmentsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch (err) { setError(err.message); } 
    finally { setLoading(false); }
  }, [quizId]);

  useEffect(() => {
    fetchQuizData();
  }, [fetchQuizData]);


  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentName || !deadline || selectedUsers.length === 0) {
      alert('Por favor, completa todos los campos y selecciona al menos un usuario.');
      return;
    }
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'assignments'), {
        quizId,
        quizTitle: quiz.title,
        assignmentName,
        deadline: new Date(deadline),
        assignedUsers: selectedUsers.map(userId => ({ userId, status: 'pending', completedAt: null, score: 0 })),
        createdAt: serverTimestamp(),
      });
      // Reset form y refetch data
      setShowAssignmentForm(false);
      setAssignmentName('');
      setDeadline('');
      setSelectedUsers([]);
      await fetchQuizData(); // Recargar los datos para mostrar la nueva asignación
    } catch (error) {
      console.error("Error al crear la asignación:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // ... (el resto de funciones y memos como handleStartLiveSession, aggregatedReport, etc. no cambian)
  const handleStartLiveSession = async () => { /* ... */ };
  const aggregatedReport = useMemo(() => { /* ... */ }, [quiz, sessions]);
  const handleDownloadAggregatedCSV = () => { /* ... */ };

  const TabButton = ({ tabName, label, count }) => ( <button onClick={() => setActiveTab(tabName)} className={`px-4 py-2 font-semibold rounded-t-lg transition-colors duration-200 ${ activeTab === tabName ? 'border-b-2 border-accent text-accent' : 'text-text-muted hover:text-text-primary' }`}> {label} {count !== undefined ? `(${count})` : ''} </button> );

  if (loading) return <div className="text-center p-10 text-text-muted">Cargando...</div>;
  if (error) return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  if (!quiz) return null;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 text-text-primary">
      {/* --- CABECERA (sin cambios) --- */}
      
      {/* --- PESTAÑAS --- */}
      <div className="border-b border-border-secondary mb-6">
        <TabButton tabName="questions" label="Preguntas" count={quiz.questions?.length || 0} />
        <TabButton tabName="sessions" label="Sesiones" count={sessions.length} />
        <TabButton tabName="assignments" label="Asignaciones" count={assignments.length} />
        <TabButton tabName="reports" label="Informes" />
      </div>

      {/* --- CONTENIDO DE PESTAÑAS --- */}
      <div>
        {/* ... Pestañas de Preguntas, Sesiones, Informes ... */}

        {activeTab === 'assignments' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Gestor de Asignaciones</h2>
              <button onClick={() => setShowAssignmentForm(!showAssignmentForm)} className="flex items-center gap-2 bg-accent text-accent-text font-bold py-2 px-4 rounded-lg hover:bg-accent-strong transition-colors">
                <Plus size={18}/>
                {showAssignmentForm ? 'Cancelar' : 'Nueva Asignación'}
              </button>
            </div>

            {showAssignmentForm && (
              <form onSubmit={handleCreateAssignment} className="bg-secondary p-6 rounded-xl border border-border-secondary mb-8">
                <h3 className="text-xl font-bold mb-4">Crear Nueva Asignación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input required type="text" placeholder="Nombre de la capacitación (ej. Inducción Q3)" value={assignmentName} onChange={e => setAssignmentName(e.target.value)} className="bg-primary p-2 rounded-md border border-border"/>
                    <input required type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="bg-primary p-2 rounded-md border border-border"/>
                </div>
                <h4 className="font-semibold mb-2">Asignar a Usuarios</h4>
                <UserSelection selectedUsers={selectedUsers} onSelectionChange={setSelectedUsers} />
                <button type="submit" disabled={isSaving} className="mt-6 w-full bg-accent-strong text-accent-text font-bold py-3 rounded-lg hover:bg-accent transition-colors disabled:opacity-50">
                  {isSaving ? 'Guardando...' : 'Guardar Asignación'}
                </button>
              </form>
            )}

            <div className="space-y-4">
              {assignments.length > 0 ? assignments.map(assign => {
                const completedCount = assign.assignedUsers.filter(u => u.status === 'completed').length;
                return (
                  <div key={assign.id} className="bg-secondary p-4 rounded-lg border border-border flex justify-between items-center">
                    <div>
                      <p className="font-bold">{assign.assignmentName}</p>
                      <p className="text-sm text-text-muted">Fecha Límite: {new Date(assign.deadline.seconds * 1000).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold">{completedCount} de {assign.assignedUsers.length}</p>
                        <p className="text-sm text-text-muted">Completados</p>
                    </div>
                  </div>
                )
              }) : (
                 <div className="text-center py-10 px-6 bg-secondary rounded-lg border-dashed border-border">
                   <h3 className="text-lg font-semibold">No hay asignaciones creadas</h3>
                   <p className="text-text-muted mt-1">Crea una nueva asignación para empezar a dar seguimiento a las capacitaciones.</p>
                 </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default QuizDetail; 
