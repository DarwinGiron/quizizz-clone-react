import { ref, get, update } from 'firebase/database';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, rtdb } from '../../../firebase/config';

// Termina una sesión en vivo: calcula y guarda las estadísticas en Firestore
// (mismo formato que SessionStatsAdmin) y marca la sesión como 'finished'.
export const endLiveSession = async (sessionId, quizId) => {
  if (!sessionId || !quizId) throw new Error('Faltan datos para terminar la sesión.');

  // 1. Datos en vivo (participantes, respuestas, código)
  const sessSnap = await get(ref(rtdb, `liveSessions/${sessionId}`));
  const sessVal = sessSnap.val() || {};
  const participants = sessVal.participants ? Object.values(sessVal.participants) : [];
  const answers = sessVal.answers || {};

  // 2. Quiz (preguntas y título)
  const quizSnap = await getDoc(doc(db, 'quizzes', quizId));
  const quizData = quizSnap.exists() ? quizSnap.data() : {};
  const quizQuestions = quizData.questions || [];
  const quizTitle = quizData.title || quizData.name || '';

  // 3. Ranking por participante (mismo cálculo que useSessionStats)
  const ranking = participants.map((p) => {
    const key = p.id || p.name;
    const userAnswers = Array.isArray(answers[key]) ? answers[key] : [];
    let correct = 0;
    let incorrect = 0;
    const answerDetails = quizQuestions.map((q, idx) => {
      const ansObj = userAnswers[idx];
      if (!ansObj || ansObj.answer === undefined) return { status: 'unanswered', time: null };
      const isCorrect = ansObj.answer === q.correctAnswer;
      if (isCorrect) correct++;
      else incorrect++;
      return { status: isCorrect ? 'correct' : 'incorrect', time: ansObj.time || null };
    });
    const finished = answerDetails.every((ad) => ad.status !== 'unanswered');
    const answeredCount = answerDetails.filter((ad) => ad.status !== 'unanswered').length;
    const totalTime = answerDetails.reduce((s, ad) => s + (ad.time || 0), 0);
    const totalScore = userAnswers.reduce((s, a) => s + (a?.score || 0), 0);
    const precision = quizQuestions.length > 0 ? (correct / quizQuestions.length) * 100 : 0;
    return {
      id: p.id || p.name,
      name: p.name,
      personnelCode: p.personnelCode || null,
      cargo: p.cargo || p.area || null,
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
  });

  // 4. Análisis por pregunta
  const questionAnalysis = quizQuestions.map((q, index) => {
    let correct = 0;
    let incorrect = 0;
    ranking.forEach((p) => {
      const ad = p.answerDetails[index];
      if (ad?.status === 'correct') correct++;
      else if (ad?.status === 'incorrect') incorrect++;
    });
    const accuracy = correct + incorrect > 0 ? (correct / (correct + incorrect)) * 100 : 0;
    return { question: q.question, correct, incorrect, accuracy };
  });

  // 5. KPIs
  const totalParticipants = ranking.length;
  const finishedCount = ranking.filter((p) => p.finished).length;
  const averageScore = totalParticipants > 0 ? ranking.reduce((a, p) => a + p.score, 0) / totalParticipants : 0;
  const totalPrecision = totalParticipants > 0 ? ranking.reduce((a, p) => a + p.precision, 0) / totalParticipants : 0;

  // 6. Documento de estadísticas (mismo formato que SessionStatsAdmin)
  const sessionStats = {
    sessionId,
    quizId,
    quizTitle: quizTitle || null,
    joinCode: sessVal.joinCode || null,
    startedAt: sessVal.createdAt || Date.now(),
    finishedAt: Date.now(),
    summary: {
      totalParticipants,
      finishedCount,
      averageScore: averageScore.toFixed(2),
      totalPrecision: totalPrecision.toFixed(2),
    },
    ranking: ranking.map((p) => ({
      name: p.name,
      personnelCode: p.personnelCode,
      cargo: p.cargo,
      score: p.score,
      correct: p.correct,
      incorrect: p.incorrect,
      finished: p.finished,
      total: p.total,
      answeredCount: p.answeredCount,
      totalTime: p.totalTime.toFixed(2),
      progressPercentage: p.total > 0 ? ((p.answeredCount / p.total) * 100).toFixed(1) : 0,
    })),
    questionAnalysis: questionAnalysis.map((q) => ({
      question: q.question,
      correct: q.correct,
      incorrect: q.incorrect,
      accuracy: q.accuracy.toFixed(2),
      totalAnswers: q.correct + q.incorrect,
    })),
    questions: quizQuestions.map((q, i) => ({
      number: i + 1,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
    })),
    detailedAnswers: ranking.map((p) => ({
      name: p.name,
      personnelCode: p.personnelCode,
      cargo: p.cargo,
      answers: quizQuestions.map((q, idx) => {
        const ans = Array.isArray(p.answers) ? p.answers[idx] : null;
        const selectedIndex = ans && typeof ans.answer === 'number' ? ans.answer : null;
        const selectedText = selectedIndex !== null && Array.isArray(q.options) ? (q.options[selectedIndex] ?? null) : null;
        return { selectedIndex, selectedText, status: p.answerDetails?.[idx]?.status || 'unanswered' };
      }),
    })),
    participants: participants.map((p) => ({
      name: p.name,
      type: p.type || 'casual',
      personnelCode: p.personnelCode || null,
      cargo: p.cargo || p.area || null,
    })),
  };

  await setDoc(doc(db, 'sessionStats', sessionId), sessionStats);
  await update(ref(rtdb, `liveSessions/${sessionId}`), { status: 'finished' });
};
