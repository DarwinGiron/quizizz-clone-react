import React from 'react';

const QuestionsTab = ({ questionAnalysis }) => (
  <div>
    <div className="p-6">
      <h2 className="text-2xl font-bold text-purple-200 mb-4">Análisis por Pregunta</h2>
      <p className="text-purple-100">Solo números - Preguntas ordenadas por precisión.</p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-black/30">
          <tr className="text-purple-300">
            <th className="py-3 px-6 font-semibold text-center">#</th>
            <th className="py-3 px-6 font-semibold">Pregunta</th>
            <th className="py-3 px-6 font-semibold text-center">Precisión</th>
            <th className="py-3 px-6 font-semibold text-center">Correctas</th>
            <th className="py-3 px-6 font-semibold text-center">Incorrectas</th>
          </tr>
        </thead>
        <tbody>
          {questionAnalysis.map((q, i) => (
            <tr key={i} className="border-t border-purple-900/50 hover:bg-gray-700/50">
              <td className="py-4 px-6 text-center font-bold">{i + 1}</td>
              <td className="py-4 px-6 text-sm">{q.question}</td>
              <td className="py-4 px-6 text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="font-bold text-blue-300 text-lg">{q.accuracy.toFixed(1)}%</span>
                  <div className="w-24 bg-gray-700 rounded-full h-2.5">
                    <div className="bg-blue-500 h-2.5 rounded-full" style={{width: `${q.accuracy}%`}}></div>
                  </div>
                </div>
              </td>
              <td className="py-4 px-6 text-center text-green-400 font-bold text-lg">{q.correct}</td>
              <td className="py-4 px-6 text-center text-red-400 font-bold text-lg">{q.incorrect}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default QuestionsTab;
