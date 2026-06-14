import React, { useState } from 'react';
import { db } from '../../../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Trash2, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const colors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];

const CreateQuiz = ({ capacitacionVinculada, tipoEvaluacion }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const prefilledTitle = location.state?.titulo || (capacitacionVinculada ? `Evaluación - ${capacitacionVinculada.titulo}` : '');
  const linkedCapId = location.state?.linkedCapId || capacitacionVinculada?.id || null;

  const [title, setTitle] = useState(prefilledTitle);
  const [questions, setQuestions] = useState([
    { question: '', options: ['', '', '', ''], correctAnswer: 0 },
  ]);
  const [loading, setLoading] = useState(false);

  const handleOptionChange = (value, qIdx, oIdx) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx] = value;
    setQuestions(updated);
  };

  const handleQuestionChange = (value, qIdx) => {
    const updated = [...questions];
    updated[qIdx].question = value;
    setQuestions(updated);
  };

  const setCorrectAnswer = (qIdx, oIdx) => {
    const updated = [...questions];
    updated[qIdx].correctAnswer = oIdx;
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { question: '', options: ['', '', '', ''], correctAnswer: 0 },
    ]);
  };

  const removeQuestion = (qIdx) => {
    const updated = questions.filter((_, index) => index !== qIdx);
    setQuestions(updated);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Debe ingresar un título');
      return;
    }
    setLoading(true);
    try {
      const newQuiz = {
        title: title.trim(),
        questions,
        createdAt: new Date(),
        linkedCapId: linkedCapId || null,
        tipoEvaluacion: tipoEvaluacion || 'evento',
        capacitacionVinculada: capacitacionVinculada || null,
      };

      await addDoc(collection(db, 'quizzes'), newQuiz);
      alert('Evaluación guardada correctamente');
      navigate('/myquizzes');
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Hubo un error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">
        {linkedCapId ? 'Evaluación vinculada a capacitación' : 'Nueva evaluación'}
      </h1>

      {capacitacionVinculada && (
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-indigo-600">🔗</span>
            <h3 className="font-semibold text-indigo-800">Capacitación Vinculada</h3>
          </div>
          <div className="space-y-1 text-sm text-gray-700">
            <p><strong>Título:</strong> {capacitacionVinculada.titulo}</p>
            <p><strong>Categoría:</strong> {capacitacionVinculada.categoria}</p>
            {capacitacionVinculada.fechaInicio && (
              <p><strong>Fecha:</strong> {format(parseISO(capacitacionVinculada.fechaInicio), 'dd MMM yyyy', { locale: es })}</p>
            )}
            {capacitacionVinculada.instructor && (
              <p><strong>Instructor:</strong> {capacitacionVinculada.instructor}</p>
            )}
          </div>
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <div className="flex items-start gap-2">
              <span className="text-yellow-600">⚠️</span>
              <div>
                <p className="text-sm text-yellow-800 font-medium">Análisis disponible:</p>
                <p className="text-xs text-yellow-700">
                  Esta evaluación te permitirá analizar asistencia fuera de horarios asignados y
                  patrones de participación por bloque de capacitación.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 mb-6 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="Título de la evaluación"
      />

      {questions.map((q, qIdx) => (
        <div key={qIdx} className="mb-6 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <label className="font-semibold text-sm text-gray-700">
              Pregunta {qIdx + 1}
            </label>
            <button
              type="button"
              onClick={() => removeQuestion(qIdx)}
              className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Eliminar
            </button>
          </div>
          <input
            value={q.question}
            onChange={(e) => handleQuestionChange(e.target.value, qIdx)}
            className="w-full border border-gray-300 px-3 py-2 mb-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Escribe la pregunta"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {q.options.map((opt, oIdx) => (
              <div
                key={oIdx}
                className={`p-2 rounded-lg border-2 flex items-center gap-2 transition-colors ${
                  q.correctAnswer === oIdx
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setCorrectAnswer(qIdx, oIdx)}
                  className="shrink-0"
                  title="Marcar como correcta"
                >
                  {q.correctAnswer === oIdx
                    ? <CheckCircle className="w-5 h-5 text-green-500" />
                    : <XCircle className="w-5 h-5 text-gray-300" />
                  }
                </button>
                <input
                  value={opt}
                  onChange={(e) => handleOptionChange(e.target.value, qIdx, oIdx)}
                  className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 text-sm"
                  placeholder={`Opción ${oIdx + 1}`}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-4 mt-6">
        <button
          onClick={addQuestion}
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Agregar pregunta
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className={`flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition-shadow ${
            loading ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        >
          {loading && (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          )}
          {loading ? 'Guardando...' : 'Guardar evaluación'}
        </button>
      </div>
    </div>
  );
};

export default CreateQuiz;
