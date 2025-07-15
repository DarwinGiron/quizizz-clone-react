import React from 'react';
import { FiTrash } from 'react-icons/fi';

const bgColors = ['bg-blue-500', 'bg-cyan-500', 'bg-yellow-400', 'bg-rose-400'];

const QuestionBuilder = ({ question, onUpdate, index, onDelete }) => {
  const handleTextChange = (e) => {
    onUpdate(index, { ...question, text: e.target.value });
  };

  const handleOptionChange = (i, value) => {
    const updated = [...question.options];
    updated[i] = value;
    onUpdate(index, { ...question, options: updated });
  };

  const handleCorrectChange = (i) => {
    onUpdate(index, { ...question, answer: i });
  };

  const handleDeleteOption = (i) => {
    const updated = question.options.filter((_, idx) => idx !== i);
    let correct = question.answer;
    if (i === correct) correct = null;
    else if (i < correct) correct -= 1;
    onUpdate(index, { ...question, options: updated, answer: correct });
  };

  return (
    <div className="bg-purple-900 rounded-xl p-6 text-white space-y-4 shadow-md">
      <textarea
        value={question.text}
        onChange={handleTextChange}
        placeholder="Escriba la pregunta aquí"
        className="w-full bg-purple-800 p-4 rounded text-lg resize-none placeholder-white focus:outline-none"
      />

      <div className="grid grid-cols-2 gap-4">
        {question.options.map((opt, i) => (
          <div
            key={i}
            className={`rounded-lg p-4 relative text-white ${bgColors[i % bgColors.length]}`}
          >
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={() => handleCorrectChange(i)}
                title="Respuesta correcta"
                className={`rounded-full w-5 h-5 border-2 ${
                  question.answer === i ? 'border-white bg-white' : 'border-white'
                }`}
              />
              <button onClick={() => handleDeleteOption(i)} title="Eliminar">
                <FiTrash size={16} />
              </button>
            </div>
            <input
              type="text"
              value={opt}
              onChange={(e) => handleOptionChange(i, e.target.value)}
              placeholder="Escriba la opción de respuesta aquí"
              className="bg-transparent border-none w-full text-white placeholder-white focus:outline-none mt-6"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-4">
        <button
          type="button"
          className="bg-purple-600 px-4 py-2 rounded text-sm"
          onClick={() =>
            onUpdate(index, {
              ...question,
              options: [...question.options, ''],
            })
          }
        >
          + Añadir opción
        </button>
        <button
          type="button"
          className="text-red-300 text-sm"
          onClick={() => onDelete(index)}
        >
          Eliminar pregunta
        </button>
      </div>
    </div>
  );
};

export default QuestionBuilder;
