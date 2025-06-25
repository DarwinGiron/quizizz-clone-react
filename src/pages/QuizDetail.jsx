import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { FiEye, FiEdit, FiTarget, FiEyeOff } from 'react-icons/fi';
import { FaGamepad } from 'react-icons/fa';
import StartLiveSessionButton from '../components/StartLiveSessionButton';
import ExportStatsModal from '../components/ExportStatsModal';

const QuizDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [showAnswers, setShowAnswers] = useState(true);
  const [activeTab, setActiveTab] = useState('questions');
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      const docRef = doc(db, 'quizzes', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setQuiz({ id: docSnap.id, ...docSnap.data() });
      }
    };
    fetchQuiz();
  }, [id]);

  const handleExportPDF = () => {
    console.log('Exportar PDF...');
    setShowExportModal(false);
  };

  const handleExportExcel = () => {
    console.log('Exportar Excel...');
    setShowExportModal(false);
  };
if (!quiz) return <p className="text-center mt-10">Cargando...</p>;

const sessionData = {
  title: quiz.title || 'Estadísticas del Quiz',
  date: new Date().toLocaleDateString(),
  users: [
    { name: '1044', precision: 100, score: 10410 },
    { name: '1176', precision: 100, score: 9205 },
    { name: '1774', precision: 100, score: 10620 },
    { name: '1840', precision: 100, score: 8920 },
  ]
};

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Encabezado */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{quiz.title}</h2>
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-4">
              <span className="flex items-center gap-1"><FiTarget /> 0% precisión</span>
              <span className="flex items-center gap-1"><FaGamepad /> 0 jugadas</span>
            </p>
          </div>
          <div className="space-x-2 flex items-center">
            <button
              onClick={() => navigate(`/preview/${id}`)}
              className="flex items-center gap-1 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              <FiEye /> Vista previa
            </button>
            <button
              onClick={() => navigate(`/edit/${id}`)}
              className="flex items-center gap-1 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              <FiEdit /> Continuar editando
            </button>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <StartLiveSessionButton quizId={quiz.id} />
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
          >
            📥 Exportar estadísticas
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-2 border-b flex gap-6 text-purple-600 font-semibold">
        <button
          className={`pb-2 ${activeTab === 'questions' ? 'border-b-2 border-purple-600' : 'text-gray-400'}`}
          onClick={() => setActiveTab('questions')}
        >
          Preguntas ({quiz.questions?.length || 0})
        </button>
        <button
          className={`pb-2 ${activeTab === 'sessions' ? 'border-b-2 border-purple-600' : 'text-gray-400'}`}
          onClick={() => setActiveTab('sessions')}
        >
          Sesiones
        </button>
        <button
          className={`pb-2 ${activeTab === 'comments' ? 'border-b-2 border-purple-600' : 'text-gray-400'}`}
          onClick={() => setActiveTab('comments')}
        >
          Comentario
        </button>
      </div>

      {/* Botón ocultar respuestas */}
      {activeTab === 'questions' && (
        <div className="flex justify-end sticky top-[112px] z-30 bg-[#f9fafb] py-2">
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className="flex items-center gap-2 bg-white border px-3 py-2 rounded-full text-sm text-purple-600 shadow hover:bg-gray-50 transition-all"
          >
            {showAnswers ? <FiEyeOff /> : <FiEye />}
            {showAnswers ? 'Ocultar respuestas' : 'Mostrar respuestas'}
          </button>
        </div>
      )}

      {/* Contenido dinámico */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {quiz.questions?.map((q, i) => (
            <div key={i} className="bg-white shadow rounded p-4">
              <div className="text-sm text-gray-600 mb-1">
                {i + 1}. Opción múltiple • ⏱ 30 segundos • 🏅 1 punto
              </div>
              <p className="font-semibold">{q.question}</p>
              <ul className="mt-2 grid grid-cols-2 gap-2">
                {q.options.map((opt, idx) => {
                  const isCorrect = idx === q.correctAnswer;
                  let style = 'bg-gray-100 border border-gray-300 text-gray-800';
                  if (showAnswers) {
                    style = isCorrect
                      ? 'bg-green-100 border-green-400 text-green-700'
                      : 'bg-red-100 border-red-400 text-red-700';
                  }
                  return (
                    <li key={idx} className={`px-3 py-2 rounded ${style}`}>
                      {opt}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="space-y-4 mt-4">
          {[1, 2].map((s, i) => (
            <div
              key={i}
              className="bg-white p-4 rounded shadow flex justify-between items-center hover:bg-gray-50 transition cursor-pointer"
              onClick={() => navigate(`/sessions/session${s}`)}
            >
              <div>
                <h4 className="font-semibold">Capacitación #{s}</h4>
                <p className="text-sm text-gray-500">🎯 Precisión 92% • 👥 10 participantes</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/sessions/session${s}/report`);
                }}
                className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 text-sm"
              >
                Ver informe
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="bg-white p-4 rounded shadow text-gray-500">Sección de comentarios próximamente...</div>
      )}

      {showExportModal && (
        <ExportStatsModal
          onClose={() => setShowExportModal(false)}
          sessionData={sessionData}
        />
      )}
    </div>
  );
};

export default QuizDetails;
