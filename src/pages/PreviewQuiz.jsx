import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const PreviewQuiz = () => {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const docRef = doc(db, 'quizzes', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setQuiz(docSnap.data());
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  if (loading) return <div className="p-10 text-center">Cargando...</div>;
  if (!quiz) return <div className="p-10 text-center text-red-600">Quiz no encontrado</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">{quiz.title}</h1>
      {quiz.questions.map((question, index) => (
        <div key={index} className="mb-6 p-4 border border-gray-300 rounded shadow-sm">
          <h2 className="font-semibold mb-2">Pregunta {index + 1}:</h2>
          <p className="mb-2">{question.text}</p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {question.options.map((option, i) => (
              <li key={i} className={`p-2 rounded border ${i === question.answer ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'}`}>
                {option}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default PreviewQuiz;
