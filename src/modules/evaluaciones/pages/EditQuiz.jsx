import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaTrash,
  FaPlus,
  FaEye,
  FaEdit,
} from 'react-icons/fa';
import { BackButton } from '../../../shared';

const colors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];

const QuizEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(null);

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
    const docRef = doc(db, 'quizzes', id);
    await updateDoc(docRef, quiz);
    navigate('/myquizzes');
  };

  if (!quiz) return <div className="p-10">Cargando...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <BackButton to="/myquizzes" label="Volver a Mis Quizzes" className="mb-4" />
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Editando: {quiz.title}</h2>

      {quiz.questions.map((q, qIdx) => (
        <div key={qIdx} className="bg-white text-gray-900 border rounded p-4 mb-4 shadow">
          <div
            className="cursor-pointer flex justify-between items-center"
            onClick={() => toggleQuestion(qIdx)}
          >
            <h3 className="text-lg font-semibold">
              Pregunta {qIdx + 1}: {q.question}
            </h3>
            <div className="flex gap-3 text-lg">
              <FaEdit className="text-blue-600" />
              <FaTrash
                className="text-red-500 cursor-pointer hover:text-red-700"
                onClick={() => {
                  const updated = [...quiz.questions];
                  updated.splice(qIdx, 1);
                  setQuiz({ ...quiz, questions: updated });
                  setActiveQuestionIndex(null);
                }}
                title="Eliminar pregunta"
              />
            </div>

          </div>

          {activeQuestionIndex === qIdx && (
            <div className="mt-4 space-y-3">
              <input
                className="w-full p-2 rounded border text-gray-900"
                value={q.question}
                onChange={(e) => updateQuestionText(e.target.value, qIdx)}
              />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {q.options.map((opt, oIdx) => (
                  <div
                    key={oIdx}
                    className={`p-3 rounded text-white flex items-center justify-between ${colors[oIdx % colors.length]}`}
                  >
                    <input
                      className="bg-transparent outline-none w-full"
                      value={opt}
                      onChange={(e) => updateOption(e.target.value, qIdx, oIdx)}
                    />
                    <button onClick={() => setCorrectAnswer(qIdx, oIdx)}>
                      {q.correctAnswer === oIdx ? (
                        <FaCheckCircle className="text-green-300 ml-5 text-lg" />
                      ) : (
                        <FaTimesCircle className="text-red-300 ml-5 text-lg" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              <button
                className="text-sm bg-purple-600 px-4 py-2 rounded hover:bg-purple-700 text-white"
                onClick={() => {
                  const updated = [...quiz.questions];
                  updated[qIdx].options.push('');
                  setQuiz({ ...quiz, questions: updated });
                }}
              >
                <FaPlus className="inline mr-1" /> Añadir Opción
              </button>

              <div className="flex gap-4 mt-4">
                <label className="flex flex-col text-sm">
                  ⏱ Segundos por pregunta
                  <input
                    type="number"
                    className="border px-3 py-1 rounded"
                    value={q.seconds || 30}
                    onChange={(e) => updateField(qIdx, 'seconds', e.target.value)}
                    min={5}
                  />
                </label>
                <label className="flex flex-col text-sm">
                  Puntos por pregunta
                  <input
                    type="number"
                    className="border px-3 py-1 rounded"
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

      <div className="flex justify-between mt-6">
        <button
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded"
          onClick={() => {
            const updated = [...quiz.questions];
            updated.push({
              question: '',
              options: ['', '', '', ''],
              correctAnswer: 0,
              seconds: 30,
              points: 1,
            });
            setQuiz({ ...quiz, questions: updated });
          }}
        >
          Añadir Nueva Pregunta
        </button>
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
          onClick={handleSave}
        >
          Guardar Cambios
        </button>
      </div>
    </div>
  );
};

export default QuizEdit;
