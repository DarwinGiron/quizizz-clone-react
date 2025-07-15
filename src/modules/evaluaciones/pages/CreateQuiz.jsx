
import React from 'react';
import { QuizForm } from '../components';
import { BackButton } from '../../../shared';

const CreateQuiz = () => {
  return (
    <div className="p-6">
      <BackButton to="/myquizzes" label="Volver a Mis Quizzes" className="mb-6" />
      <QuizForm />
    </div>
  );
};

export default CreateQuiz;
