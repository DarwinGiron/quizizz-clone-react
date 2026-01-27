import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Edit, Share2, MoreHorizontal, Play, ChevronDown, List, GitBranch, MessageSquare, Eye, BarChart, Clock, CheckCircle, Star } from 'lucide-react';

// --- Mock Data ---
const mockSessions = [
  { id: 1, name: 'evaluación gestión de compras (12º dic - 12º dic)', precision: '90%', participants: 1, avgScore: 'S', organizer: 'Sig' },
  { id: 2, name: 'evaluación gestión de compras (10º dic - 10º dic)', precision: '85%', participants: 25, avgScore: 'A', organizer: 'Sig' },
];

const mockComments = {
  avgRating: 5,
  totalRatings: 1,
  sessions: 3,
  fiveStarRatings: '100%',
  ratingTrend: [5.0, 5.1, 5.2, 5.3, 4.8, 4.7]
};


const QuizDetail = () => {
  const { id: quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('questions'); // questions, sessions, comments
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

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Cargando detalles de la evaluación...</p></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen"><p className="text-red-500">{error}</p></div>;
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
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold">Su plan actual permite 30 participantes por sesión</h3>
            <p className="text-sm text-gray-600">Mejora tu plan para albergar a más participantes</p>
          </div>
          <button className="bg-white text-purple-700 font-semibold py-2 px-4 border border-purple-300 rounded-lg hover:bg-purple-50">
            Actualizar
          </button>
        </div>
      </div>
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => setShowAnswers(!showAnswers)} className="text-sm font-semibold flex items-center">
            <List className="w-4 h-4 mr-2" />
           {showAnswers ? 'Ocultar respuestas' : 'Mostrar respuestas'}
        </button>
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
            <div className="grid grid-cols-2 gap-3">
              {q.options.map((option, i) => (
                <div 
                  key={i}
                  className={`p-3 rounded-lg flex items-center border-2 ${
                    showAnswers && i === q.correctAnswer ? 'bg-green-100 border-green-300' : 'bg-gray-50'
                  } ${
                    showAnswers && i !== q.correctAnswer ? 'opacity-50' : ''
                  }`}
                >
                   {showAnswers && i === q.correctAnswer && <CheckCircle className="w-5 h-5 mr-2 text-green-600"/>}
                   <p className={`${i === q.correctAnswer ? 'font-semibold' : ''}`}>{option}</p>
                </div>
              ))}
            </div>
        </div>
      ))}
    </div>
  );

  const renderSessions = () => (
    <div className="mt-6">
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg mb-6">
            <div className="flex justify-between items-center">
            <div>
                <h3 className="font-bold">Su plan actual permite 30 participantes por sesión</h3>
                <p className="text-sm text-gray-600">Mejora tu plan para albergar a más participantes</p>
            </div>
            <button className="bg-white text-purple-700 font-semibold py-2 px-4 border border-purple-300 rounded-lg hover:bg-purple-50">
                Actualizar
            </button>
            </div>
        </div>
        <div className="mb-4">
            <button className="text-sm font-semibold flex items-center border rounded-lg px-3 py-1.5">
                Alojado por: Todos <ChevronDown className="w-4 h-4 ml-2" />
            </button>
        </div>
        <div className="space-y-4">
            <h3 className="text-md font-semibold text-red-600">Completed ({mockSessions.length})</h3>
            {mockSessions.map(session => (
                <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded-full">En vivo</span>
                            <div className="flex items-center mt-2">
                               <h4 className="text-lg font-bold mr-2">{session.name}</h4>
                               <Edit className="w-5 h-5 text-gray-500 cursor-pointer"/>
                            </div>
                            <div className="flex space-x-4 text-sm text-gray-600 mt-2">
                                <span><span className="font-bold">{session.precision}</span> Precisión</span>
                                <span><span className="font-bold">{session.participants}</span> Participantes totales</span>
                                <span>Calificación promedio</span>
                                <span className="flex items-center">Organizado por <span className="font-bold ml-1">{session.organizer}</span></span>
                            </div>
                        </div>
                        <button className="border font-semibold py-2 px-4 rounded-lg">
                           Ver informe completo
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
  
  const renderComments = () => (
    <div className="mt-6">
       <div className="bg-purple-50 p-6 rounded-lg mb-6 relative">
          <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">X</button>
          <div className="flex items-center">
              <div className="mr-6">
                  <h3 className="text-xl font-bold mb-2">Presentación de comentarios de los participantes</h3>
                  <p className="text-gray-600 mb-4">Los participantes pueden enviar una valoración final de su sesión. ¡Puedes usar esta información para actualizar tu contenido, modificar sesiones de entrenamiento y más!</p>
                  <button className="font-semibold bg-white border border-gray-300 py-2 px-4 rounded-lg">Saber más</button>
              </div>
              <div className="text-6xl">
                <Star className='w-20 h-20 text-yellow-400 fill-current'/>
              </div>
          </div>
       </div>

       <div className="flex space-x-3 mb-6">
          <button className="text-sm font-semibold flex items-center border rounded-lg px-3 py-1.5 bg-gray-100">Todo el tiempo <ChevronDown className="w-4 h-4 ml-2" /></button>
          <button className="text-sm font-semibold flex items-center border rounded-lg px-3 py-1.5">Organizado por: Todos <ChevronDown className="w-4 h-4 ml-2" /></button>
          <button className="text-sm font-semibold flex items-center border rounded-lg px-3 py-1.5">Calificaciones: Todos <ChevronDown className="w-4 h-4 ml-2" /></button>
          <button className="text-sm font-semibold flex items-center border rounded-lg px-3 py-1.5">Estado del juego: Todos <ChevronDown className="w-4 h-4 ml-2" /></button>
       </div>
       
       <h3 className="font-bold mb-4">Resumen</h3>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500">Calificación promedio</p>
                <p className="text-6xl font-bold my-2">{mockComments.avgRating}</p>
                <div className="flex justify-around text-center">
                    <div>
                        <p className="font-bold text-lg">{mockComments.totalRatings}</p>
                        <p className="text-sm text-gray-500">Calificaciones totales</p>
                    </div>
                    <div>
                        <p className="font-bold text-lg">{mockComments.sessions}</p>
                        <p className="text-sm text-gray-500">Sesiones</p>
                    </div>
                    <div>
                        <p className="font-bold text-lg">{mockComments.fiveStarRatings}</p>
                        <p className="text-sm text-gray-500">Calificaciones de 5 estrellas</p>
                    </div>
                </div>
            </div>
            <div className="border rounded-lg p-4">
                 <p className="text-sm text-gray-500">Tendencia de calificación promedio</p>
                 {/* Placeholder for chart */}
                 <div className="h-40 w-full bg-gray-100 rounded-md mt-2 flex items-center justify-center">
                    <p className="text-gray-400">Chart Placeholder</p>
                 </div>
                 <div className="flex justify-between items-center mt-2 text-sm">
                    <button>{"<"}</button>
                    <span>Sesión 1</span>
                    <button>{">"}</button>
                 </div>
            </div>
       </div>
    </div>
  );


  return (
    <div className="p-8 max-w-7xl mx-auto bg-white">
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
        <div className="flex items-center space-x-2">
            <button className="font-semibold py-2 px-4 rounded-lg border flex items-center"><Eye className="w-4 h-4 mr-2" />Vista previa</button>
            <button 
                onClick={() => navigate(`/edit-quiz/${quizId}`)}
                className="font-semibold py-2 px-4 rounded-lg border flex items-center bg-gray-100"><Edit className="w-4 h-4 mr-2" />Editar
            </button>
            <button className="font-semibold py-2 px-4 rounded-lg border flex items-center">IA mejorada <ChevronDown className="w-4 h-4 ml-2" /></button>
            <button className="font-semibold py-2 px-4 rounded-lg border flex items-center"><Share2 className="w-4 h-4 mr-2" />Compartir</button>
            <button className="p-2 rounded-lg border"><MoreHorizontal className="w-5 h-5" /></button>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        <button 
            onClick={() => navigate(`/live-session/${quizId}`)}
            className="bg-purple-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center text-lg hover:bg-purple-700 transition-colors">
            <Play className="w-5 h-5 mr-2" />
            Iniciar sesión en vivo
        </button>
        <button className="bg-purple-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center text-lg hover:bg-purple-700 transition-colors">
            <GitBranch className="w-5 h-5 mr-2"/>
            Asignar actividad
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
      {activeTab === 'questions' && renderQuestions()}
      {activeTab === 'sessions' && renderSessions()}
      {activeTab === 'comments' && renderComments()}
    </div>
  );
};

export default QuizDetail;
