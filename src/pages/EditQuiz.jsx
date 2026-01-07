import React from 'react';
import QuizForm from '../components/QuizForm';

const EditQuiz = () => {
  return (
    <div className="p-6">
      <QuizForm isEditing={true} />
    </div>
  );
};

export default EditQuiz;
