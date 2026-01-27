import React, { useEffect, useState, useMemo, useRef } from 'react';
import { collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreVertical, Edit, Copy, Trash2 } from 'lucide-react';

const MyQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [openDropdown, setOpenDropdown] = useState(null);
  const navigate = useNavigate();
  const dropdownsRef = useRef({}); // Usar un objeto para referencias

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [quizzesSnapshot, sessionsSnapshot] = await Promise.all([
          getDocs(collection(db, 'quizzes')),
          getDocs(collection(db, 'sessions'))
        ]);
        
        const fetchedQuizzes = quizzesSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        
        const fetchedSessions = sessionsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

        setQuizzes(fetchedQuizzes);
        setSessions(fetchedSessions);

      } catch (err) {
        console.error('Error al obtener datos', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  // Efecto para cerrar el dropdown si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && dropdownsRef.current[openDropdown] && !dropdownsRef.current[openDropdown].contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);


  const filteredQuizzes = useMemo(() => {
    if (activeFilter === 'all') return quizzes;
    return quizzes.filter(quiz => {
      const quizSessions = sessions.filter(s => s.quizId === quiz.id);
      if (activeFilter === 'todo') return quizSessions.length === 0;
      if (activeFilter === 'active') return quizSessions.some(s => s.status === 'waiting' || s.status === 'in-progress');
      if (activeFilter === 'finished') return quizSessions.length > 0 && quizSessions.every(s => s.status === 'finished');
      return false;
    });
  }, [quizzes, sessions, activeFilter]);

  const handleDropdownAction = (e, action) => {
    e.stopPropagation(); // Prevenir que el clic se propague a la tarjeta
    action();
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este quiz?')) {
      try {
        await deleteDoc(doc(db, 'quizzes', id));
        setQuizzes(quizzes.filter(q => q.id !== id));
        setOpenDropdown(null);
      } catch (error) {
        console.error("Error deleting quiz: ", error);
      }
    }
  };

  const handleDuplicate = async (quizToDuplicate) => {
    const { id, ...quizData } = quizToDuplicate;
    const newQuizData = {
      ...quizData,
      title: `${quizData.title} (Copia)`,
      createdAt: new Date(),
    };
    try {
      const docRef = await addDoc(collection(db, 'quizzes'), newQuizData);
      setQuizzes([{ id: docRef.id, ...newQuizData }, ...quizzes]);
      setOpenDropdown(null);
    } catch (error) {
      console.error("Error duplicating quiz: ", error);
    }
  };

  const FilterButton = ({ filter, label }) => (
    <button 
      onClick={() => setActiveFilter(filter)}
      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${activeFilter === filter ? 'bg-accent text-accent-text' : 'bg-secondary hover:bg-hover'}`}>
        {label}
    </button>
  );
  
  const QuizCard = ({ quiz }) => {
    const quizSessions = sessions.filter(s => s.quizId === quiz.id);
    const sessionCount = quizSessions.length;
    
    let status = 'todo';
    if (quizSessions.length > 0) {
      status = quizSessions.some(s => s.status === 'waiting' || s.status === 'in-progress') ? 'active' : 'finished';
    }
    const statusConfig = {
      todo: { color: 'bg-gray-400' },
      active: { color: 'bg-green-500' },
      finished: { color: 'bg-blue-500' },
    };

    return (
      <div 
        onClick={() => navigate(`/quiz/${quiz.id}`)}
        className="bg-secondary p-4 rounded-xl border border-border-secondary shadow-sm flex items-center justify-between transition-all hover:border-border-strong hover:shadow-md cursor-pointer">
        <div className="flex items-center gap-4 flex-grow">
          <div className={`w-2 h-16 rounded-full ${statusConfig[status].color}`}></div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">{quiz.title}</h3>
            <p className="text-sm text-text-muted">{quiz.questions?.length || 0} Preguntas • {sessionCount} Sesiones</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative" ref={el => dropdownsRef.current[quiz.id] = el}>
            <button onClick={(e) => handleDropdownAction(e, () => setOpenDropdown(openDropdown === quiz.id ? null : quiz.id))} className="p-2 rounded-full hover:bg-hover">
              <MoreVertical size={20} />
            </button>
            {openDropdown === quiz.id && (
              <div className="absolute right-0 mt-2 w-48 bg-primary border border-border-secondary rounded-lg shadow-xl z-10">
                <button onClick={(e) => handleDropdownAction(e, () => navigate(`/edit-quiz/${quiz.id}`))} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-text-primary hover:bg-hover">
                  <Edit size={16} />
                  Editar
                </button>
                <button onClick={(e) => handleDropdownAction(e, () => handleDuplicate(quiz))} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-text-primary hover:bg-hover">
                  <Copy size={16} />
                  Duplicar
                </button>
                <button onClick={(e) => handleDropdownAction(e, () => handleDelete(quiz.id))} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-hover">
                  <Trash2 size={16} />
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="text-text-primary p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mis Quizzes</h1>
        <button onClick={() => navigate('/create-quiz')} className="flex items-center gap-2 bg-accent-strong text-accent-text font-bold py-2 px-5 rounded-lg hover:bg-accent transition-colors shadow-lg shadow-accent/20">
          <Plus size={20}/>
          Crear Nueva Evaluación
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6 p-2 bg-primary rounded-full border border-border-secondary w-fit">
        <FilterButton filter="all" label="Todos" />
        <FilterButton filter="todo" label="Por ejecutar" />
        <FilterButton filter="active" label="Ejecutando" />
        <FilterButton filter="finished" label="Finalizados" />
      </div>

      {loading ? (
        <div className="text-center text-text-muted py-10">Cargando quizzes...</div>
      ) : (
        <div className="space-y-4">
          {filteredQuizzes.length > 0 ? 
            filteredQuizzes.map(quiz => <QuizCard key={quiz.id} quiz={quiz} />) :
            <div className="text-center py-16 px-8 bg-secondary rounded-xl border border-dashed border-border">
               <h3 className="text-xl font-semibold text-text-primary">No hay quizzes con este filtro</h3>
               <p className="text-text-muted mt-2">Prueba a seleccionar otra opción o crea una nueva evaluación.</p>
            </div>
          }
        </div>
      )}
    </div>
  );
};

export default MyQuizzes;
