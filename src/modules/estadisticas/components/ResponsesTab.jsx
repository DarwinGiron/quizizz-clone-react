import React from 'react';

const ResponsesTab = ({ ranking, quizQuestions }) => (
  <div>
    <div className="p-6">
      <h2 className="text-2xl font-bold text-purple-200 mb-4">Respuestas Detalladas por Participante</h2>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-black/30">
          <tr>
            <th className="sticky left-0 bg-black/30 py-3 px-6 font-semibold text-purple-300 z-10">Participante</th>
            {quizQuestions.map((q, i) => (
              <th key={i} className="py-3 px-4 font-semibold text-center align-top" style={{ minWidth: '160px' }}>
                <span className="block text-xs font-normal text-purple-200 mb-1">P{i + 1}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ranking.map((p) => (
            <tr key={p.name} className="border-t border-purple-900/50">
              <td className="sticky left-0 bg-gray-800/80 py-4 px-6 font-bold text-purple-200 z-10">{p.name}</td>
              {quizQuestions.map((q, i) => {
                const answerDetail = p.answerDetails[i];
                let cellClass = 'py-4 px-4 text-center whitespace-nowrap text-sm font-bold ';
                if (answerDetail?.status === 'correct') cellClass += 'bg-green-800/30 text-green-300';
                else if (answerDetail?.status === 'incorrect') cellClass += 'bg-red-800/30 text-red-300';
                else cellClass += 'text-gray-500';
                return (
                  <td key={i} className={cellClass}>
                    {answerDetail?.status === 'correct' ? '✓' : answerDetail?.status === 'incorrect' ? '✗' : '–'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default ResponsesTab;
