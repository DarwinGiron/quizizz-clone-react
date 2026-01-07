import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, getDoc, doc, updateDoc } from 'firebase/firestore';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Trash2, Plus, Clock, Award } from 'lucide-react';

// Componente reutilizable para el formulario de Quiz (Crear y Editar)
const QuizForm = ({ isEditing = false }) => {
  const navigate = useNavigate();
  const { id: quizId } = useParams();
  const location = useLocation();

  // --- VALORES POR DEFECTO ---
  const defaultQuestion = {
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    puntos: 1,      // Valor por defecto para puntos
    segundos: 30,   // Valor por defecto para segundos
  };

  // --- ESTADO DEL COMPONENTE ---
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([defaultQuestion]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Efecto para cargar los datos del quiz si estamos en modo edición
  useEffect(() => {
    if (isEditing && quizId) {
      const fetchQuiz = async () => {
        setLoading(true);
        try {
          const quizDoc = await getDoc(doc(db, 'quizzes', quizId));
          if (quizDoc.exists()) {
            const quizData = quizDoc.data();
            setTitle(quizData.title);
            // Asegura que las preguntas cargadas tengan los nuevos campos
            const loadedQuestions = quizData.questions.map(q => ({ ...defaultQuestion, ...q }));
            setQuestions(loadedQuestions);
          } else {
            setError('No se encontró la evaluación.');
          }
        } catch (err) {
          setError('Error al cargar la evaluación.');
        } finally {
          setLoading(false);
        }
      };
      fetchQuiz();
    } else if (location.state?.titulo) {
        setTitle(location.state.titulo);
    }
  }, [isEditing, quizId]);

  // --- MANEJADORES DE ESTADO ---

  const handleQuestionDataChange = (value, qIdx, field) => {
    const newQuestions = [...questions];
    // Para puntos y segundos, convierte el valor a número
    newQuestions[qIdx][field] = (field === 'puntos' || field === 'segundos') ? Number(value) : value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (value, qIdx, oIdx) => {
    const newQuestions = [...questions];
    newQuestions[qIdx].options[oIdx] = value;
    setQuestions(newQuestions);
  };

  const setCorrectAnswer = (qIdx, oIdx) => {
    const newQuestions = [...questions];
    newQuestions[qIdx].correctAnswer = oIdx;
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([...questions, defaultQuestion]);
  };

  const removeQuestion = (qIdx) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, index) => index !== qIdx));
    }
  };

  // --- LÓGICA DE GUARDADO ---

  const handleSave = async () => {
    // Validaciones
    if (!title.trim()) {
      alert('Por favor, escribe un título para la evaluación.');
      return;
    }
    for (const q of questions) {
        if (!q.question.trim()) {
            alert('Todas las preguntas deben tener un texto.');
            return;
        }
        if (q.options.some(opt => !opt.trim())) {
            alert('Todas las opciones de respuesta deben tener texto.');
            return;
        }
        if (isNaN(q.puntos) || q.puntos <= 0 || isNaN(q.segundos) || q.segundos <= 0) {
            alert('Los puntos y segundos deben ser números mayores a cero.');
            return;
        }
    }

    setLoading(true);
    setError('');

    const quizData = {
      title: title.trim(),
      questions,
      linkedCapId: location.state?.linkedCapId || null, 
    };

    try {
      if (isEditing) {
        const quizRef = doc(db, 'quizzes', quizId);
        await updateDoc(quizRef, quizData);
        alert('✅ Evaluación actualizada correctamente');
      } else {
        await addDoc(collection(db, 'quizzes'), { ...quizData, createdAt: new Date() });
        alert('✅ Evaluación guardada correctamente');
      }
      navigate('/my-quizzes');
    } catch (err) {
      setError(isEditing ? 'Error al actualizar la evaluación' : 'Error al guardar la evaluación');
      alert(`❌ ${error || 'Ocurrió un error inesperado'}`)
    } finally {
      setLoading(false);
    }
  };
  
  if(error) return <p className="text-red-500 text-center p-8">{error}</p>

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 text-text-primary">
      <h1 className="text-3xl font-bold mb-6">
        {isEditing ? 'Editar Evaluación' : 'Nueva Evaluación'}
      </h1>

      <div className="mb-8">
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título de la evaluación" className="w-full p-3 bg-white border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-accent focus:border-transparent"/>
      </div>

      {questions.map((q, qIdx) => (
        <div key={qIdx} className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-6">
          <div className="flex justify-between items-center mb-4">
            <p className="font-bold text-lg">Pregunta {qIdx + 1}</p>
            {questions.length > 1 && (
              <button onClick={() => removeQuestion(qIdx)} className="text-red-500 hover:text-red-700 flex items-center gap-1.5 text-sm font-semibold"><Trash2 size={16} />Eliminar</button>
            )}
          </div>

          <input type="text" value={q.question} onChange={(e) => handleQuestionDataChange(e.target.value, qIdx, 'question')} placeholder="Escribe la pregunta" className="w-full p-3 bg-white border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-accent focus:border-transparent"/>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {q.options.map((opt, oIdx) => {
              const isCorrect = q.correctAnswer === oIdx;
              return (
                <div key={oIdx} className="flex items-center gap-3">
                  <button type="button" onClick={() => setCorrectAnswer(qIdx, oIdx)}>
                    {isCorrect ? <CheckCircle size={24} className="text-green-500" /> : <XCircle size={24} className="text-red-500" />}
                  </button>
                  <input type="text" value={opt} onChange={(e) => handleOptionChange(e.target.value, qIdx, oIdx)} placeholder={`Opción ${oIdx + 1}`} className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent ${isCorrect ? 'border-green-500 bg-green-50/50' : 'border-gray-300'}`}/>
                </div>
              );
            })}
          </div>
          
          {/* --- CAMPOS DE PUNTOS Y SEGUNDOS --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div className="relative">
                <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20}/>
                <input type="number" value={q.puntos} onChange={(e) => handleQuestionDataChange(e.target.value, qIdx, 'puntos')} className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-accent focus:outline-none"/>
            </div>
             <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20}/>
                <input type="number" value={q.segundos} onChange={(e) => handleQuestionDataChange(e.target.value, qIdx, 'segundos')} className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-accent focus:outline-none"/>
            </div>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-4 mt-6">
        <button onClick={addQuestion} className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 font-bold py-3 px-5 rounded-lg hover:bg-gray-300 transition-colors"><Plus size={20} />Agregar Pregunta</button>
        <button onClick={handleSave} disabled={loading} className="flex-grow sm:flex-grow-0 bg-accent text-accent-text font-bold py-3 px-8 rounded-lg hover:bg-accent-strong transition-colors disabled:opacity-50">{loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar')}</button>
      </div>
    </div>
  );
};

export default QuizForm;
