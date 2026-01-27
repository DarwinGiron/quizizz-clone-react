import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Edit, Share2, MoreHorizontal, Play, ChevronDown, List, GitBranch, MessageSquare, Eye, BarChart, Clock, CheckCircle, Star } from 'lucide-react';

// --- Mock Data (conservado para la UI inicial) ---
const mockSessions = [
  { id: 1, name: 'evaluación gestión de compras (12º dic - 12º dic)', precision: '90%', participants: 1, avgScore: 'S', organizer: 'Sig' },
  { id: 2, name: 'evaluación gestión de compras (10º dic - 10º dic)', precision: '85%', participants: 25, avgScore: 'A', organizer: 'Sig' },
];
const mockComments = {
  avgRating: 5, totalRatings: 1, sessions: 3, fiveStarRatings: '100%'
};

const QuizDetail = () => {
  const { id: quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [activeTab, setActiveTab] = useState('questions');
  const [showAnswers, setShowAnswers] = useState(true);

  const fetchQuiz = useCallback(async () => {
    setLoading(true);
    try {
      const quizDocRef = doc(db, 'quizzes', quizId);
      const quizDoc = await getDoc(quizDocRef);
      if (quizDoc.exists()) {
        setQuiz({ id: quizDoc.id, ...quizDoc.data() });
      } else {
        setError('No se encontró la evaluación.');
      }
    } catch (err) {
      setError('Error al cargar la evaluación.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  const handleStartLiveSession = async () => {
    setIsStartingSession(true);
    try {
      const joinCode = Math.floor(100000 + Math.random() * 900000).toString();
      const sessionsCollectionRef = collection(db, 'liveSessions');
      const newSessionDoc = await addDoc(sessionsCollectionRef, {
        quizId: quiz.id,
        quizTitle: quiz.title,
        joinCode: joinCode,
        status: 'waiting',
        createdAt: serverTimestamp(),
        participants: [],
        hostId: null, // Aquí podrías poner el ID del usuario actual
      });

      // REDIRECCIÓN CORREGIDA: Navegar a la sala de espera del anfitrión
      navigate(`/waiting-room/${newSessionDoc.id}`);

    } catch (error) {
      console.error("Error al iniciar la sesión en vivo:", error);
      setError("No se pudo iniciar la sesión. Inténtalo de nuevo.");
      setIsStartingSession(false);
    }
  };
  
  const handlePreview = () => {
      navigate(`/preview-quiz/${quizId}`);
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Cargando detalles de la evaluación...</p></div>;
  }

  if (error) {
    return <div className="p-8 w-full"><p className="text-red-500 text-center">{error}</p></div>;
  }

  if (!quiz) {
    return null;
  }

  const Stat = ({ value, label }) => (
    <div className="flex items-center text-sm text-gray-500">
      <BarChart className="w-4 h-4 mr-1 text-gray-400" />
      <span>{value}</span>
      <span className="ml-1">{label}</span>
    </div>
  );

  const renderQuestions = () => (
    <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
            <button onClick={() => setShowAnswers(!showAnswers)} className="text-sm font-semibold flex items-center"><List className="w-4 h-4 mr-2" />{showAnswers ? 'Ocultar respuestas' : 'Mostrar respuestas'}</button>
        </div>
        {quiz.questions.map((q, index) => (
            <div key={index} className="border rounded-lg p-4 mb-4">
                <div className="flex justify-between items-start mb-4">
                    <p className="text-md font-semibold">{index + 1}. {q.question}</p>
                    <div className="flex items-center space-x-4 text-sm">
                        <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {q.segundos} segundos</span>
                        <span className="font-bold">{q.puntos} punto(s)</span>
                    </div>
                </div>
                {showAnswers && (
                    <div className="grid grid-cols-2 gap-3">
                        {q.options.map((option, i) => (
                            <div key={i} className={`p-3 rounded-lg flex items-center border-2 ${i === q.correctAnswer ? 'bg-green-100 border-green-300' : 'bg-gray-50'}`}>
                                {i === q.correctAnswer && <CheckCircle className="w-5 h-5 mr-2 text-green-600" />}
                                <p className={`${i === q.correctAnswer ? 'font-semibold' : ''}`}>{option}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ))}
    </div>
  );

  const renderSessions = () => ( <div className="mt-6"><p>Pestaña de Sesiones en construcción.</p></div> );
  const renderComments = () => ( <div className="mt-6"><p>Pestaña de Comentarios en construcción.</p></div> );

  return (
    <div className="p-8 w-full bg-white">
      <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex-shrink-0 mr-5"></div>
                <div>
                  <p className="text-sm text-gray-500 uppercase">Examen</p>
                  <h1 className="text-3xl font-bold flex items-center">{quiz.title} <Edit className="w-6 h-6 ml-3 text-gray-400 cursor-pointer" /></h1>
                  <div className="flex items-center space-x-4 mt-2">
                     <Stat value="78%" label="precisión" />
                     <Stat value="3" label="jugadas" />
                  </div>
                </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
                <button onClick={handlePreview} className="font-semibold py-2 px-4 rounded-lg border flex items-center"><Eye className="w-4 h-4 mr-2" />Vista previa</button>
                <button onClick={() => navigate(`/edit-quiz/${quizId}`)} className="font-semibold py-2 px-4 rounded-lg border flex items-center bg-gray-100"><Edit className="w-4 h-4 mr-2" />Editar</button>
                <button className="p-2 rounded-lg border"><MoreHorizontal className="w-5 h-5" /></button>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <button onClick={handleStartLiveSession} disabled={isStartingSession} className="bg-purple-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center text-lg hover:bg-purple-700 transition-colors disabled:bg-purple-400">
                {isStartingSession ? 'Iniciando...' : <><Play className="w-5 h-5 mr-2" /> Iniciar sesión en vivo</>}
            </button>
            <button className="bg-purple-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center text-lg hover:bg-purple-700 transition-colors">
                <GitBranch className="w-5 h-5 mr-2"/>
                Informe detallado del examen
            </button>
          </div>
          
          {/* Tabs */}
          <div className="mt-8 border-b">
            <nav className="flex space-x-8">
              <button onClick={() => setActiveTab('questions')} className={`py-4 px-1 font-semibold flex items-center ${activeTab === 'questions' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}>
                <List className="w-5 h-5 mr-2" /> Preguntas ({quiz.questions.length})
              </button>
              <button onClick={() => setActiveTab('sessions')} className={`py-4 px-1 font-semibold flex items-center ${activeTab === 'sessions' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}>
                <Play className="w-5 h-5 mr-2" /> Sesiones ({mockSessions.length})
              </button>
               <button onClick={() => setActiveTab('comments')} className={`py-4 px-1 font-semibold flex items-center ${activeTab === 'comments' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}>
                <MessageSquare className="w-5 h-5 mr-2" /> Comentario ({mockComments.totalRatings}) <span className="ml-2 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">NUEVO</span>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="max-w-4xl">
            {activeTab === 'questions' && renderQuestions()}
            {activeTab === 'sessions' && renderSessions()}
            {activeTab === 'comments' && renderComments()}
          </div>
      </div>
    </div>
  );
};

export default QuizDetail;
