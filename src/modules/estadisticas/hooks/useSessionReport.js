import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { ref as dbRef, get as dbGet } from 'firebase/database';
import { db, rtdb } from '../../../firebase/config';

// Lee los comentarios/calificaciones de una sesión desde Realtime Database
export const fetchSessionFeedback = async (sessionId) => {
  try {
    const snap = await dbGet(dbRef(rtdb, `liveSessions/${sessionId}/feedback`));
    const val = snap.val();
    return val ? Object.values(val).sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0)) : [];
  } catch {
    return [];
  }
};

// ── Procesa el documento REAL guardado por SessionStatsAdmin ──
// Forma: { summary, ranking[], questionAnalysis[], questions[], participants[], finishedAt }
const processSavedData = (data) => {
  const participants = data.participants || [];
  const ranking = data.ranking || [];
  const questionAnalysis = data.questionAnalysis || [];
  const questions = data.questions || [];
  const summary = data.summary || {};

  // Mapa de código de personal por nombre (ranking no lo guarda)
  const codeByName = {};
  participants.forEach((p) => {
    codeByName[p.name] = p.personnelCode || null;
  });

  const totalQuestions = questions.length;

  // Mapa de cargo por nombre
  const cargoByName = {};
  participants.forEach((p) => {
    cargoByName[p.name] = p.cargo || p.area || null;
  });

  const users = ranking
    .map((r) => {
      const answered = Number(r.answeredCount) || 0;
      const incorrect = Number(r.incorrect) || 0;
      const correct =
        r.correct !== undefined
          ? Number(r.correct)
          : Math.max(answered - incorrect, 0);
      const total = Number(r.total) || totalQuestions || 0;
      const precision = total > 0 ? Math.round((correct / total) * 100) : 0;

      return {
        id: r.name,
        name: r.name,
        personnelCode: codeByName[r.name] || r.personnelCode || null,
        cargo: cargoByName[r.name] || r.cargo || null,
        precision,
        score: Number(r.score) || 0,
        correctAnswers: correct,
        incorrectAnswers: incorrect,
        totalAnswers: answered,
        totalQuestions: total,
      };
    })
    .sort((a, b) => b.score - a.score);

  const questionStats = questionAnalysis.map((q, idx) => {
    const correct = Number(q.correct) || 0;
    const incorrect = Number(q.incorrect) || 0;
    const total = Number(q.totalAnswers ?? correct + incorrect) || 0;
    return {
      index: idx + 1,
      question: q.question || `Pregunta ${idx + 1}`,
      correct,
      total,
      accuracy: Math.round(Number(q.accuracy) || 0),
    };
  });

  const totalParticipants =
    Number(summary.totalParticipants) || participants.length;
  const precision = Math.round(Number(summary.totalPrecision) || 0);
  const finishedCount =
    Number(summary.finishedCount) || ranking.filter((r) => r.finished).length;
  const completion =
    totalParticipants > 0
      ? Math.round((finishedCount / totalParticipants) * 100)
      : 0;

  const startMs = data.startedAt || data.finishedAt;
  const endMs = data.finishedAt || data.startedAt;
  const date = startMs
    ? new Date(startMs).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Fecha desconocida';
  const fmtTime = (ms) =>
    ms
      ? new Date(ms).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';
  const time = fmtTime(startMs);
  const endTime = fmtTime(endMs);

  return {
    title: data.quizTitle || 'Quiz sin título',
    date,
    time,
    endTime,
    precision,
    completion,
    participants: totalParticipants,
    questions: totalQuestions,
    users,
    questionStats,
    // Datos crudos en orden original para la hoja "Preguntas" del Excel
    questionsList: questions,
    detailedAnswers: data.detailedAnswers || [],
    rawData: data,
    quizId: data.quizId || null,
  };
};

// ── Fallback: formato legacy basado en responses[] ──
const processLegacyData = (data) => {
  const participants = data.participants || [];
  const responses = data.responses || [];
  const questions = data.questions || [];

  const ranking = participants.map((participant) => {
    const participantResponses = responses.filter(
      (r) => r.participant === participant.name
    );
    const correctAnswers = participantResponses.filter((r) => r.isCorrect).length;
    const totalAnswers = participantResponses.length;
    const precision = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;

    return {
      id: participant.name,
      name: participant.name,
      personnelCode: participant.personnelCode,
      precision: Math.round(precision),
      score: correctAnswers * 1000,
      correctAnswers,
      totalAnswers,
    };
  });

  const totalParticipants = participants.length;
  const averagePrecision =
    totalParticipants > 0
      ? Math.round(
          ranking.reduce((acc, p) => acc + p.precision, 0) / totalParticipants
        )
      : 0;

  const completionRate =
    totalParticipants > 0 && questions.length > 0
      ? Math.round(
          (ranking.filter((p) => p.totalAnswers === questions.length).length /
            totalParticipants) *
            100
        )
      : 0;

  const questionStats = questions.map((q, idx) => {
    const questionResponses = responses.filter(
      (r) => r.questionIndex === idx || r.questionId === q.id
    );
    const correct = questionResponses.filter((r) => r.isCorrect).length;
    const total = questionResponses.length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    return {
      index: idx + 1,
      question: q.question || q.text || `Pregunta ${idx + 1}`,
      correct,
      total,
      accuracy,
    };
  });

  return {
    title: data.quizTitle || 'Quiz sin título',
    date: data.createdAt
      ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : 'Fecha desconocida',
    precision: averagePrecision,
    completion: completionRate,
    participants: totalParticipants,
    questions: questions.length,
    users: ranking.sort((a, b) => b.score - a.score),
    questionStats,
    rawData: data,
    quizId: data.quizId || null,
  };
};

// Elige el procesador según la forma del documento guardado
export const processSessionData = (data) =>
  Array.isArray(data.ranking) ? processSavedData(data) : processLegacyData(data);

const useSessionReport = (sessionId) => {
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    const load = async () => {
      setLoading(true);
      try {
        let raw = null;

        const sessionsRef = collection(db, 'sessionStats');
        const q = query(sessionsRef, where('sessionId', '==', sessionId));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          raw = snapshot.docs[0].data();
        } else {
          // Fallback: búsqueda directa por document ID
          const docSnap = await getDoc(doc(db, 'sessionStats', sessionId));
          if (docSnap.exists()) raw = docSnap.data();
        }

        if (!raw) {
          setSessionData(null);
          return;
        }

        const processed = processSessionData(raw);

        // Si el documento no guardó el título, lo recuperamos del quiz
        if (
          (!processed.title || processed.title === 'Quiz sin título') &&
          processed.quizId
        ) {
          try {
            const quizSnap = await getDoc(doc(db, 'quizzes', processed.quizId));
            if (quizSnap.exists()) {
              const quizData = quizSnap.data();
              processed.title =
                quizData.title || quizData.name || processed.title;
            }
          } catch {
            // ignorar: mantenemos el título por defecto
          }
        }

        // Comentarios y calificaciones de los participantes (Realtime Database)
        processed.feedback = await fetchSessionFeedback(sessionId);

        setSessionData(processed);
      } catch {
        setSessionData(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [sessionId]);

  return { sessionData, loading };
};

export default useSessionReport;
