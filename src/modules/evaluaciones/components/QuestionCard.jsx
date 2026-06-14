import React from 'react';
import { Trash2 } from 'lucide-react';

const bgColors = ['bg-blue-500', 'bg-cyan-500', 'bg-yellow-400', 'bg-rose-400'];

const QuestionCard = ({ q, index, onUpdate, onDelete, editable = true }) => {
  const handleTextChange = (e) => {
    if (!editable) return;
    onUpdate(index, { ...q, text: e.target.value });
  };

  const handleOptionChange = (i, value) => {
    if (!editable) return;
    const updated = [...q.options];
    updated[i] = value;
    onUpdate(index, { ...q, options: updated });
  };

  const handleCorrectChange = (i) => {
    if (!editable) return;
    onUpdate(index, { ...q, answer: i });
  };

  const handleDeleteOption = (i) => {
    if (!editable) return;
    const updated = q.options.filter((_, idx) => idx !== i);
    let correct = q.answer;
    if (i === correct) correct = null;
    else if (i < correct) correct -= 1;
    onUpdate(index, { ...q, options: updated, answer: correct });
  };

  return (
    <div className="bg-indigo-900 rounded-xl p-6 text-white space-y-6 shadow-lg">
      <textarea
        value={q.text}
        onChange={handleTextChange}
        placeholder="Escriba la pregunta aquí"
        disabled={!editable}
        className={`w-full h-32 bg-indigo-800 p-4 rounded-xl text-lg resize-none placeholder-white focus:outline-none ${
          !editable ? 'cursor-default' : ''
        }`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {q.options.map((opt, i) => (
          <div
            key={i}
            className={`rounded-xl p-4 relative text-white min-h-[100px] flex items-end ${bgColors[i % bgColors.length]}`}
          >
            {editable && (
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={() => handleCorrectChange(i)}
                  title="Respuesta correcta"
                  className={`rounded-full w-5 h-5 border-2 ${
                    q.answer === i ? 'border-white bg-white' : 'border-white'
                  }`}
                />
                <button onClick={() => handleDeleteOption(i)} title="Eliminar">
                  <Trash2 size={16} />
                </button>
              </div>
            )}
            <input
              type="text"
              value={opt}
              disabled={!editable}
              onChange={(e) => handleOptionChange(i, e.target.value)}
              placeholder="Escriba la opción de respuesta aquí"
              className="bg-transparent border-none w-full text-white placeholder-white focus:outline-none"
            />
          </div>
        ))}
      </div>

      {editable && (
        <div className="flex justify-between items-center mt-6">
          <button
            type="button"
            className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded text-sm transition-colors"
            onClick={() =>
              onUpdate(index, {
                ...q,
                options: [...q.options, ''],
              })
            }
          >
            + Añadir opción
          </button>
          <button
            type="button"
            className="text-red-300 hover:text-red-400 text-sm transition-colors"
            onClick={() => onDelete(index)}
          >
            Eliminar pregunta
          </button>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
