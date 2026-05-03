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
            <th className="py-3 px-6 font-semibold text-center">Correctas</th>
            <th className="py-3 px-6 font-semibold text-center">Incorrectas</th>
            <th className="py-3 px-6 font-semibold text-center">Puntaje</th>
            <th className="py-3 px-6 font-semibold">Progreso</th>
          </tr>
        </thead>
        <tbody>
          {ranking.length === 0 && (
            <tr><td colSpan="6" className="text-center py-12 text-gray-400">Esperando participantes...</td></tr>
          )}
          {ranking.map((p, i) => {
            const progress = p.total > 0 ? (p.answeredCount / p.total) * 100 : 0;
            return (
              <tr key={p.name} className="border-t border-purple-900/50 hover:bg-gray-700/50">
                <td className="py-4 px-6 font-bold text-center text-xl">{i + 1}</td>
                <td className="py-4 px-6 font-bold text-lg text-purple-200">{p.name}</td>
                <td className="py-4 px-6 text-center text-green-400 font-bold text-lg">{p.score}</td>
                <td className="py-4 px-6 text-center text-red-400 font-bold text-lg">{p.incorrect}</td>
                <td className="py-4 px-6 text-center text-yellow-300 font-bold text-xl">{p.score}</td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-4">
                    <div className="w-full bg-gray-700 rounded-full h-4 border-2 border-purple-400/50">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${p.finished ? 'bg-green-500' : 'bg-purple-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="w-20 text-right font-semibold">{progress.toFixed(0)}%</span>
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
