import React, { useEffect, useState, useRef } from 'react';
import { collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreVertical, Play, Edit, Copy, Trash2 } from 'lucide-react';

const MyQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(null);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'quizzes'));
        const fetchedQuizzes = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setQuizzes(fetchedQuizzes);
      } catch (err) {
        console.error('Error al obtener quizzes', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este quiz?')) {
      try {
        await deleteDoc(doc(db, 'quizzes', id));
        setQuizzes(quizzes.filter(quiz => quiz.id !== id));
        setOpenDropdown(null);
      } catch (err) {
        console.error('Error eliminando quiz:', err);
      }
    }
  };

  const handleDuplicate = async (quiz) => {
    try {
      const newTitle = `${quiz.title} (Copia)`;
      const quizCopy = { ...quiz, title: newTitle, createdAt: new Date() };
      delete quizCopy.id;
      const docRef = await addDoc(collection(db, 'quizzes'), quizCopy);
      setQuizzes([{ id: docRef.id, ...quizCopy }, ...quizzes]);
      setOpenDropdown(null);
    } catch (err) {
      console.error('Error duplicando quiz:', err);
    }
  };

  // --- COMPONENTE QuizCard MEJORADO ---
  const QuizCard = ({ quiz }) => (
    <div 
      onClick={() => navigate(`/quiz/${quiz.id}`)}
      className="bg-secondary rounded-xl p-5 transition-all duration-300 border border-border flex justify-between items-center hover:border-accent/50 cursor-pointer group"
    >
      <div className="flex-grow">
        <h2 className="text-xl font-bold text-text-primary group-hover:text-accent transition-colors">{quiz.title}</h2>
        <div className="flex items-center gap-4 text-sm text-text-muted mt-2">
          <span>{quiz.questions?.length || 0} preguntas</span>
          <span>·</span>
          <span>Creado: {quiz.createdAt ? new Date(quiz.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
        </div>
      </div>

      {/* El evento onClick en este div detiene la propagación al padre */}
      <div className="flex items-center gap-2 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => navigate(`/live/${quiz.id}`)} className="p-2 rounded-full hover:bg-tertiary transition-colors" title="Iniciar Sesión en Vivo">
          <Play size={20} className='text-text-muted'/>
        </button>
        <button onClick={() => setOpenDropdown(openDropdown === quiz.id ? null : quiz.id)} className="p-2 rounded-full hover:bg-tertiary transition-colors" title="Más opciones">
          <MoreVertical size={20} className='text-text-muted'/>
        </button>
        {openDropdown === quiz.id && (
          <div ref={dropdownRef} className="absolute top-full right-0 mt-2 w-48 bg-secondary border border-border rounded-lg shadow-xl z-10">
            <button onClick={() => navigate(`/edit-quiz/${quiz.id}`)} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-hover hover:text-text-primary"><Edit size={16}/> Editar</button>
            <button onClick={() => handleDuplicate(quiz)} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-hover hover:text-text-primary"><Copy size={16}/> Duplicar</button>
            <button onClick={() => handleDelete(quiz.id)} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10"><Trash2 size={16}/> Eliminar</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="text-text-primary p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Mis Quizzes</h1>
        <button onClick={() => navigate('/create-quiz')} className="flex items-center gap-2 bg-accent-strong text-accent-text font-bold py-2 px-5 rounded-lg hover:bg-accent transition-colors shadow-lg shadow-accent/20">
          <Plus size={20}/>
          Crear Nueva Evaluación
        </button>
      </div>

      {loading ? (
        <div className="text-center text-text-muted">Cargando quizzes...</div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-16 px-8 bg-secondary rounded-xl border border-dashed border-border">
          <h3 className="text-xl font-semibold text-text-primary">Aún no tienes ningún quiz</h3>
          <p className="text-text-muted mt-2">Haz clic en "Crear Nueva Evaluación" para empezar.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quizzes.map(quiz => <QuizCard key={quiz.id} quiz={quiz} />)}
        </div>
      )}
    </div>
  );
};

export default MyQuizzes;
