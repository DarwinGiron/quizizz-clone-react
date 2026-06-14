import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { CheckCircle, XCircle, Trash2, Plus, Pencil, Save } from 'lucide-react';
import { BackButton } from '../../../shared';

const colors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];

const QuizEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      const docRef = doc(db, 'quizzes', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setQuiz(docSnap.data());
      }
    };
    fetchQuiz();
  }, [id]);

  const toggleQuestion = (index) => {
    setActiveQuestionIndex(activeQuestionIndex === index ? null : index);
  };

  const updateQuestionText = (value, index) => {
    const updated = [...quiz.questions];
    updated[index].question = value;
    setQuiz({ ...quiz, questions: updated });
  };

  const updateOption = (value, qIdx, oIdx) => {
    const updated = [...quiz.questions];
    updated[qIdx].options[oIdx] = value;
    setQuiz({ ...quiz, questions: updated });
  };

  const setCorrectAnswer = (qIdx, oIdx) => {
    const updated = [...quiz.questions];
    updated[qIdx].correctAnswer = oIdx;
    setQuiz({ ...quiz, questions: updated });
  };

  const updateField = (qIdx, field, value) => {
    const updated = [...quiz.questions];
    updated[qIdx][field] = parseInt(value);
    setQuiz({ ...quiz, questions: updated });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'quizzes', id);
      await updateDoc(docRef, quiz);
      navigate('/myquizzes');
    } finally {
      setSaving(false);
    }
  };

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
        <p className="text-gray-500 text-sm">Cargando quiz...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <BackButton to="/myquizzes" label="Volver a Mis Quizzes" className="mb-4" />

      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-100 p-2.5 rounded-lg">
          <Pencil className="w-6 h-6 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Editando: {quiz.title}</h2>
      </div>

      <div className="space-y-4">
        {quiz.questions.map((q, qIdx) => (
          <div key={qIdx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div
              className="cursor-pointer flex justify-between items-center"
              onClick={() => toggleQuestion(qIdx)}
            >
              <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-indigo-500" />
                Pregunta {qIdx + 1}: {q.question}
              </h3>
              <button
                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  const updated = [...quiz.questions];
                  updated.splice(qIdx, 1);
                  setQuiz({ ...quiz, questions: updated });
                  setActiveQuestionIndex(null);
                }}
                title="Eliminar pregunta"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {activeQuestionIndex === qIdx && (
              <div className="mt-4 space-y-3">
                <input
                  className="w-full p-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={q.question}
                  onChange={(e) => updateQuestionText(e.target.value, qIdx)}
                  placeholder="Texto de la pregunta"
                />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={`p-3 rounded-lg text-white flex items-center justify-between ${colors[oIdx % colors.length]}`}
                    >
                      <input
                        className="bg-transparent outline-none w-full placeholder-white/70"
                        value={opt}
                        onChange={(e) => updateOption(e.target.value, qIdx, oIdx)}
                        placeholder={`Opción ${oIdx + 1}`}
                      />
                      <button
                        onClick={() => setCorrectAnswer(qIdx, oIdx)}
                        className="ml-2 shrink-0"
                        title="Marcar como correcta"
                      >
                        {q.correctAnswer === oIdx
                          ? <CheckCircle className="w-5 h-5 text-green-200" />
                          : <XCircle className="w-5 h-5 text-red-200" />
                        }
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  className="flex items-center gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
                  onClick={() => {
                    const updated = [...quiz.questions];
                    updated[qIdx].options.push('');
                    setQuiz({ ...quiz, questions: updated });
                  }}
                >
                  <Plus className="w-4 h-4" /> Añadir opción
                </button>

                <div className="flex gap-4 mt-2">
                  <label className="flex flex-col text-sm text-gray-700">
                    ⏱ Segundos por pregunta
                    <input
                      type="number"
                      className="border border-gray-300 px-3 py-1.5 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={q.seconds || 30}
                      onChange={(e) => updateField(qIdx, 'seconds', e.target.value)}
                      min={5}
                    />
                  </label>
                  <label className="flex flex-col text-sm text-gray-700">
                    Puntos por pregunta
                    <input
                      type="number"
                      className="border border-gray-300 px-3 py-1.5 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={q.points || 1}
                      onChange={(e) => updateField(qIdx, 'points', e.target.value)}
                      min={1}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-6">
        <button
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2.5 rounded-lg font-semibold transition-colors"
          onClick={() => {
            const updated = [...quiz.questions];
            updated.push({ question: '', options: ['', '', '', ''], correctAnswer: 0, seconds: 30, points: 1 });
            setQuiz({ ...quiz, questions: updated });
          }}
        >
          <Plus className="w-4 h-4" /> Añadir pregunta
        </button>
        <button
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg transition-shadow text-white px-6 py-2.5 rounded-lg font-semibold disabled:opacity-60"
          onClick={handleSave}
          disabled={saving}
        >
          {saving
            ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Save className="w-4 h-4" />
          }
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
};

export default QuizEdit;
