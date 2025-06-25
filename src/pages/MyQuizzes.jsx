import React, { useEffect, useRef, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Link, useNavigate } from 'react-router-dom';
import { FiMoreVertical, FiEye } from 'react-icons/fi';

const MyQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'quizzes'));
        const fetched = [];
        querySnapshot.forEach((doc) => {
          fetched.push({ id: doc.id, ...doc.data() });
        });
        setQuizzes(fetched);
      } catch (err) {
        console.error('Error al obtener quizzes', err);
      }
    };

    fetchQuizzes();
  }, []);

  // Cierra el dropdown si haces clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest('.dropdown-toggle') &&
        !event.target.closest('.dropdown-menu')
      ) {
        setDropdownOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'quizzes', id));
      setQuizzes(quizzes.filter((quiz) => quiz.id !== id));
    } catch (err) {
      console.error('Error eliminando quiz:', err);
    }
  };

  const handleDuplicate = async (quiz) => {
    try {
      const quizCopy = {
        ...quiz,
        title: quiz.title + ' (copia)',
        createdAt: new Date(),
      };
      delete quizCopy.id;
      const docRef = await addDoc(collection(db, 'quizzes'), quizCopy);
      setQuizzes([...quizzes, { id: docRef.id, ...quizCopy }]);
    } catch (err) {
      console.error('Error duplicando quiz:', err);
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit/${id}`);
  };

  const toggleDropdown = (event, index) => {
    const buttonRect = event.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: buttonRect.bottom + window.scrollY + 4,
      left: buttonRect.left + window.scrollX - 100,
    });
    setDropdownOpen(index);
  };

  return (
    <div className="flex justify-center pt-8 min-h-[60vh] p-8 relative">
      <div className="w-full max-w-6xl">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => navigate('/create')}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-5 rounded-2xl shadow-md transition-all duration-200"
          >
            <span className="text-xl leading-none">➕</span>
            <span className="text-sm sm:text-base">Crear nueva evaluación</span>
          </button>
        </div>


        <h1 className="text-2xl font-bold mb-6 text-center">Mis Quizzes</h1>

        {quizzes.length === 0 ? (
          <p className="text-center">No tienes quizzes aún.</p>
        ) : (
          <div className="flex justify-center">
            <div className="grid grid-cols-1 gap-6 w-full max-w-5xl">
              {quizzes
                .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
                .map((quiz, index) => {
                  const partidasJugadas = Math.floor(Math.random() * 40) + 1;
                  const personalAsistio = partidasJugadas * (Math.floor(Math.random() * 5) + 1);

                  return (
                    <div>
                      <Link
                        key={quiz.id}
                        to={`/quiz/${quiz.id}`}
                        className="block bg-white rounded-lg shadow-md px-6 py-4 transition-transform transform hover:-translate-y-1 hover:shadow-xl w-full"
                      >
                        <div className="flex justify-between items-center">
                          <h2
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(`/quiz/${quiz.id}`);
                            }}
                            className="text-lg font-bold text-black cursor-pointer hover:underline"
                          >
                            {quiz.title}
                          </h2>

                          <div className="flex items-center gap-4 relative">
                            <Link
                              to={`/preview/${quiz.id}`}
                              title="Vista previa"
                              className="text-purple-600 hover:text-purple-800"
                              onClick={e => e.stopPropagation()}
                            >
                              <FiEye size={20} />
                            </Link>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleDropdown(e, index);
                              }}
                              className="text-gray-700 hover:text-black dropdown-toggle"
                            >
                              <FiMoreVertical size={24} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 flex flex-wrap items-center gap-x-4">
                          📋 {quiz.questions?.length || 0} preguntas
                          🎮 {partidasJugadas} partidas jugadas
                          👥 {personalAsistio} personas capacitadas
                        </p>
                      </Link>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* 🔽 Dropdown flotante visible sobre todo */}
      {dropdownOpen !== null && (
        <div
          className="fixed w-40 bg-white border rounded shadow-lg z-50 dropdown-menu"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
        >
          <button
            onClick={() => {
              window.location.href = `/live/${quizzes[dropdownOpen].id}`;
              setDropdownOpen(null);
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-100"
          >
            Sesión en vivo
          </button>
          <button
            onClick={() => {
              handleEdit(quizzes[dropdownOpen].id);
              setDropdownOpen(null);
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-100"
          >
            Editar
          </button>
          <button
            onClick={() => {
              handleDuplicate(quizzes[dropdownOpen]);
              setDropdownOpen(null);
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-100"
          >
            Duplicar
          </button>
          <button
            onClick={() => {
              handleDelete(quizzes[dropdownOpen].id);
              setDropdownOpen(null);
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-red-500"
          >
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
};

export default MyQuizzes;
