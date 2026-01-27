import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ChevronLeft } from 'lucide-react';

const PreviewQuiz = () => {
  const { id: quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const fetchQuiz = useCallback(async () => {
    setLoading(true);
    try {
      const quizDocRef = doc(db, 'quizzes', quizId);
      const quizDoc = await getDoc(quizDocRef);
      if (quizDoc.exists()) {
        setQuiz({ id: quizDoc.id, ...quizDoc.data() });
      } else {
        setError('No se pudo encontrar la evaluación para la vista previa.');
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

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setUserAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Finalizar el quiz y mostrar resultados
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    quiz.questions.forEach((q, index) => {
      if (userAnswers[index] === q.correctAnswer) {
        correctAnswers++;
      }
    });
    return (correctAnswers / quiz.questions.length) * 100;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Cargando vista previa...</p></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen"><p className="text-red-500">{error}</p></div>;
  }

  if (!quiz) {
    return null;
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  if (showResults) {
    const score = calculateScore();
    return (
      <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center text-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-3xl font-bold mb-4">Resultados de la Vista Previa</h1>
          <h2 className="text-xl font-semibold mb-2">{quiz.title}</h2>
          <p className="text-5xl font-bold my-4">{score.toFixed(1)}%</p>
          <p className="text-lg">({Object.values(userAnswers).filter((a, i) => a === quiz.questions[i].correctAnswer).length} de {quiz.questions.length} respuestas correctas)</p>
          <button 
            onClick={() => navigate(`/quiz/${quizId}`)}
            className="mt-6 bg-purple-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Volver a los detalles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md p-4 flex items-center justify-between">
        <button onClick={() => navigate(`/quiz/${quizId}`)} className="flex items-center text-gray-600 font-semibold">
          <ChevronLeft className="w-5 h-5 mr-1" />
          Salir de la vista previa
        </button>
        <h1 className="font-bold text-xl">{quiz.title}</h1>
        <div />
      </header>

      {/* Contenido de la Pregunta */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-3xl w-full">
          {/* Información de la pregunta */}
          <div className="flex justify-between items-center mb-6">
            <span className="font-semibold">Pregunta {currentQuestionIndex + 1} de {quiz.questions.length}</span>
            {/* Puedes añadir un temporizador aquí si lo deseas */}
          </div>

          {/* Pregunta */}
          <h2 className="text-2xl font-bold mb-8 text-center">{currentQuestion.question}</h2>

          {/* Opciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.options.map((option, index) => (
              <button 
                key={index}
                onClick={() => handleAnswerSelect(currentQuestionIndex, index)}
                className={`p-4 rounded-lg border-2 text-left font-semibold text-lg transition-transform transform hover:scale-105 ${
                  userAnswers[currentQuestionIndex] === index 
                    ? 'bg-purple-500 text-white border-purple-700' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          
          {/* Botón de Siguiente */}
          <div className="text-right mt-8">
            <button 
              onClick={handleNextQuestion}
              disabled={userAnswers[currentQuestionIndex] === undefined}
              className="bg-purple-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {currentQuestionIndex < quiz.questions.length - 1 ? 'Siguiente' : 'Finalizar'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PreviewQuiz;
