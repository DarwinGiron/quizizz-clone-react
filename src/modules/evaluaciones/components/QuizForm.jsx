import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaTrash, FaPlus } from 'react-icons/fa';

const colors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];

const CreateQuiz = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Si viene desde una capacitación vinculada, se precarga el título
  const prefilledTitle = location.state?.titulo || '';
  const linkedCapId = location.state?.linkedCapId || null;

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
      };

      await addDoc(collection(db, 'quizzes'), newQuiz);
      alert('✅ Evaluación guardada correctamente');
      navigate('/myquizzes');
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('❌ Hubo un error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        {linkedCapId ? 'Evaluación vinculada a capacitación' : 'Nueva evaluación'}
      </h1>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border rounded px-4 py-2 mb-6"
        placeholder="Título de la evaluación"
      />

      {questions.map((q, qIdx) => (
        <div key={qIdx} className="mb-6 p-4 bg-white border rounded-lg shadow">
          <div className="flex justify-between items-center mb-2">
            <label className="font-semibold text-sm">
              Pregunta {qIdx + 1}
            </label>
            <button
              type="button"
              onClick={() => removeQuestion(qIdx)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              <FaTrash /> Eliminar
            </button>
          </div>
          <input
            value={q.question}
            onChange={(e) => handleQuestionChange(e.target.value, qIdx)}
            className="w-full border px-3 py-2 mb-3 rounded"
            placeholder="Escribe la pregunta"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {q.options.map((opt, oIdx) => (
              <div
                key={oIdx}
                className={`p-2 rounded border flex items-center gap-2 ${
                  q.correctAnswer === oIdx ? 'border-green-500' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => setCorrectAnswer(qIdx, oIdx)}
                  className="text-green-500"
                  title="Marcar como correcta"
                >
                  {q.correctAnswer === oIdx ? <FaCheckCircle /> : <FaTimesCircle />}
                </button>
                <input
                  value={opt}
                  onChange={(e) =>
                    handleOptionChange(e.target.value, qIdx, oIdx)
                  }
                  className="w-full px-2 py-1 border rounded"
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
          className="flex items-center gap-2 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
        >
          <FaPlus /> Agregar pregunta
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className={`bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Guardando...' : 'Guardar evaluación'}
        </button>
      </div>
    </div>
  );
};

export default CreateQuiz;
