import { useEffect, useState, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { rtdb, db } from '../../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

const useSessionStats = (sessionId, quizId) => {
  const [participants, setParticipants] = useState([]);
  const [answers, setAnswers] = useState({});
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizTitle, setQuizTitle] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Escuchar datos en tiempo real
  useEffect(() => {
    if (!sessionId) return;

    const sessionRef = ref(rtdb, `liveSessions/${sessionId}`);
    const unsubscribeSession = onValue(sessionRef, (snapshot) => {
      setSessionData(snapshot.val());
    });

    const participantsRef = ref(rtdb, `liveSessions/${sessionId}/participants`);
    const unsubscribeParticipants = onValue(participantsRef, (snapshot) => {
      setParticipants(snapshot.val() ? Object.values(snapshot.val()) : []);
    });

    const answersRef = ref(rtdb, `liveSessions/${sessionId}/answers`);
    const unsubscribeAnswers = onValue(answersRef, (snapshot) => {
      setAnswers(snapshot.val() || {});
      setLoading(false);
    });

    return () => {
      unsubscribeSession();
      unsubscribeParticipants();
      unsubscribeAnswers();
    };
  }, [sessionId]);

  // Cargar preguntas del quiz
  useEffect(() => {
    if (!quizId) return;
    
    const loadQuiz = async () => {
      try {
        const quizRef = doc(db, 'quizzes', quizId);
        const quizSnap = await getDoc(quizRef);
        if (quizSnap.exists()) {
          const quizData = quizSnap.data();
          setQuizQuestions(quizData.questions || []);
          setQuizTitle(quizData.title || quizData.name || '');
        }
      } catch (err) {
        setError('Error loading quiz');
      }
    };

    loadQuiz();
  }, [quizId]);

  // Calcular ranking
  const ranking = useMemo(() => {
    return participants
      .map((p) => {
        const answerKey = p.id || p.name;
        const userAnswers = Array.isArray(answers[answerKey]) ? answers[answerKey] : [];
        let correct = 0;
        let incorrect = 0;

        const answerDetails = quizQuestions.map((q, idx) => {
          const ansObj = userAnswers[idx];
          if (ansObj?.answer === undefined) return { status: 'unanswered', time: null };

          const isCorrect = ansObj.answer === q.correctAnswer;
          if (isCorrect) correct++;
          else incorrect++;

          return {
            status: isCorrect ? 'correct' : 'incorrect',
            time: ansObj.time || null,
          };
        });

        const finished = answerDetails.every(ad => ad.status !== 'unanswered');
        const answeredCount = answerDetails.filter(ad => ad.status !== 'unanswered').length;
        const totalTime = answerDetails.reduce((sum, ad) => sum + (ad.time || 0), 0);
        const totalScore = userAnswers.reduce((sum, ans) => sum + (ans?.score || 0), 0);
        const precision = quizQuestions.length > 0 ? (correct / quizQuestions.length) * 100 : 0;

        return {
          id: p.id || p.name,
          name: p.name,
          score: totalScore,
          correct,
          incorrect,
          finished,
          total: quizQuestions.length,
          answers: userAnswers,
          answerDetails,
          answeredCount,
          totalTime,
          precision,
        };
      })
      .sort((a, b) => b.score - a.score || a.totalTime - b.totalTime);
  }, [participants, answers, quizQuestions]);

  // Calcular análisis por pregunta
  const questionAnalysis = useMemo(() => {
    return quizQuestions.map((q, index) => {
      let correct = 0;
      let incorrect = 0;

      ranking.forEach(p => {
        const answerDetail = p.answerDetails[index];
        if (answerDetail?.status === 'correct') correct++;
        else if (answerDetail?.status === 'incorrect') incorrect++;
      });

      const accuracy = (correct + incorrect) > 0 ? (correct / (correct + incorrect)) * 100 : 0;

      return {
        question: q.question,
        correct,
        incorrect,
        accuracy,
      };
    }).sort((a, b) => b.accuracy - a.accuracy);
  }, [quizQuestions, ranking]);

  // Calcular KPIs
  const kpis = useMemo(() => {
    const totalParticipants = ranking.length;
    const finishedCount = ranking.filter(p => p.finished).length;
    const averageScore = totalParticipants > 0
      ? ranking.reduce((acc, p) => acc + p.score, 0) / totalParticipants
      : 0;
    const totalPrecision = totalParticipants > 0
      ? ranking.reduce((acc, p) => acc + p.precision, 0) / totalParticipants
      : 0;

    return {
      totalParticipants,
      finishedCount,
      averageScore,
      totalPrecision,
    };
  }, [ranking]);

  return {
    participants,
    ranking,
    questionAnalysis,
    quizQuestions,
    quizTitle,
    sessionData,
    kpis,
    loading,
    error,
  };
};

export default useSessionStats;
