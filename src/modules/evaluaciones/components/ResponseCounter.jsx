import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../../../firebase/config';

const ResponseCounter = ({ sessionId, currentQuestionIndex, question }) => {
  const [responseCounts, setResponseCounts] = useState([]);
  const [totalResponses, setTotalResponses] = useState(0);

  useEffect(() => {
    if (!sessionId || currentQuestionIndex < 0 || !question) return;

    const answersRef = ref(rtdb, `liveSessions/${sessionId}/answers`);
    const unsubscribe = onValue(answersRef, (snapshot) => {
      const data = snapshot.val();
      const counts = new Array(question.options?.length || 0).fill(0);
      let total = 0;

      if (data) {
        Object.values(data).forEach(userAnswers => {
          if (Array.isArray(userAnswers)) {
            const answerObj = userAnswers[currentQuestionIndex];
            if (answerObj && answerObj.answer !== undefined) {
              counts[answerObj.answer]++;
              total++;
            }
          }
        });
      }

      setResponseCounts(counts);
      setTotalResponses(total);
    });

    return () => unsubscribe();
  }, [sessionId, currentQuestionIndex, question]);

  return (
    <div className="space-y-3">
      {question?.options?.map((option, index) => {
        const count = responseCounts[index] || 0;
        const percentage = totalResponses > 0 ? (count / totalResponses) * 100 : 0;
        
        return (
          <div key={index} className="flex items-center gap-3">
            <div className="flex-1">
              <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden border-2 border-purple-400/50">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 flex items-center justify-center"
                  style={{ width: `${percentage}%` }}
                >
                  {percentage > 10 && <span className="text-white text-xs font-bold">{percentage.toFixed(0)}%</span>}
                </div>
              </div>
            </div>
            <div className="text-right min-w-12">
              <p className="text-lg font-bold text-white">{count}</p>
            </div>
          </div>
        );
      })}
      <div className="text-center text-sm text-gray-400 pt-2">
        Total de respuestas: {totalResponses}
      </div>
    </div>
  );
};

export default ResponseCounter;
