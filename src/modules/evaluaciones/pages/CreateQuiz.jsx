
import React from 'react';
import { useLocation } from 'react-router-dom';
import { QuizForm } from '../components';
import { BackButton } from '../../../shared';

const CreateQuiz = () => {
  const location = useLocation();
  const { capacitacionVinculada, tipoEvaluacion } = location.state || {};

  return (
    <div className="p-6">
      <BackButton to="/myquizzes" label="Volver a Mis Quizzes" className="mb-6" />
      <QuizForm 
        capacitacionVinculada={capacitacionVinculada}
        tipoEvaluacion={tipoEvaluacion}
      />
    </div>
  );
};

export default CreateQuiz;
