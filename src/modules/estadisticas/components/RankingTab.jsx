import React from 'react';

const RankingTab = ({ ranking }) => (
  <div>
    <div className="p-6">
      <h2 className="text-2xl font-bold text-purple-200 mb-4">Tabla de Clasificación</h2>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-black/30">
          <tr className="text-purple-300">
            <th className="py-3 px-6 font-semibold text-center">#</th>
            <th className="py-3 px-6 font-semibold">Nombre</th>
            <th className="py-3 px-6 font-semibold text-center">Puntaje</th>
            <th className="py-3 px-6 font-semibold text-center">Precisión</th>
            <th className="py-3 px-6 font-semibold">Progreso</th>
          </tr>
        </thead>
        <tbody>
          {ranking.length === 0 && (
            <tr><td colSpan="5" className="text-center py-12 text-gray-400">Esperando participantes...</td></tr>
          )}
          {ranking.map((p, i) => {
            const progress = p.total > 0 ? (p.answeredCount / p.total) * 100 : 0;
            const precision = p.total > 0 ? p.precision.toFixed(0) : '0';
            return (
              <tr key={p.id || `${p.name}-${i}`} className="border-t border-purple-900/50 hover:bg-gray-700/50">
                <td className="py-4 px-6 font-bold text-center text-xl">{i + 1}</td>
                <td className="py-4 px-6 font-bold text-lg text-purple-200">{p.name}</td>
                <td className="py-4 px-6 text-center text-yellow-300 font-bold text-xl">{p.score}</td>
                <td className="py-4 px-6 text-center text-blue-300 font-bold text-lg">{precision}%</td>
                <td className="py-4 px-6">
                  <div className="space-y-2">
                    <div className="h-4 rounded-full overflow-hidden bg-gray-800 border border-purple-700/40 flex">
                      {p.answerDetails.map((answer, idx) => {
                        const colorClass = answer?.status === 'correct'
                          ? 'bg-emerald-400'
                          : answer?.status === 'incorrect'
                            ? 'bg-red-500'
                            : 'bg-gray-600';
                        return <div key={idx} className={`${colorClass} flex-1`} style={{ minWidth: 0 }} />;
                      })}
                    </div>
                    <div className="text-right text-xs text-gray-400">{p.answeredCount}/{p.total}</div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

export default RankingTab;
