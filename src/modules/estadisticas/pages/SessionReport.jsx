import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  FileText,
  SearchX,
  CheckCircle,
  Users,
  BarChart2,
  Target,
  MessageSquare,
} from 'lucide-react';
import useSessionReport from '../hooks/useSessionReport';
import { exportToExcel, exportToPDF } from '../utils/exportReport';

// ─── Sub-componentes ───────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, color = 'indigo' }) => {
  const colorMap = {
    indigo: 'bg-indigo-100 text-indigo-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
      <div className={`p-2.5 rounded-lg ${colorMap[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

const TabParticipants = ({ sessionData }) => (
  <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200 p-4">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left border-b">
          <th className="py-2 pb-3 font-semibold text-gray-600">Participante</th>
          <th className="py-2 pb-3 text-center font-semibold text-gray-600">Precisión</th>
          <th className="py-2 pb-3 text-center font-semibold text-gray-600">Puntos</th>
          <th className="py-2 pb-3 text-center font-semibold text-gray-600">Puntuación</th>
        </tr>
      </thead>
      <tbody>
        {sessionData.users.map((user, index) => {
          const displayName =
            user.personnelCode && user.personnelCode !== user.name
              ? `${user.personnelCode} - ${user.name}`
              : user.name;

          return (
            <tr key={`${user.id}-${index}`} className="border-b hover:bg-gray-50">
              <td className="py-2.5 flex items-center gap-2 font-medium">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                  {(user.personnelCode || user.name).charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold">{displayName}</span>
                  {user.personnelCode && user.personnelCode !== user.name && (
                    <span className="text-xs text-gray-500">
                      Código: {user.personnelCode}
                    </span>
                  )}
                </div>
              </td>
              <td className="py-2.5 text-center font-semibold text-green-600">
                {user.precision}%
              </td>
              <td className="py-2.5 text-center">
                {user.correctAnswers}/{sessionData.questions}
              </td>
              <td className="py-2.5 text-center font-medium">{user.score}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const TabQuestions = ({ sessionData }) => {
  if (!sessionData.questionStats?.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <BarChart2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No hay datos de preguntas disponibles.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2 pb-3 font-semibold text-gray-600">#</th>
            <th className="py-2 pb-3 font-semibold text-gray-600">Pregunta</th>
            <th className="py-2 pb-3 text-center font-semibold text-gray-600">
              Correctas
            </th>
            <th className="py-2 pb-3 text-center font-semibold text-gray-600">
              Respondidas
            </th>
            <th className="py-2 pb-3 text-center font-semibold text-gray-600">
              % Acierto
            </th>
          </tr>
        </thead>
        <tbody>
          {sessionData.questionStats.map((q) => (
            <tr key={q.index} className="border-b hover:bg-gray-50">
              <td className="py-2.5 text-gray-400 font-medium w-8">{q.index}</td>
              <td className="py-2.5 text-gray-700 max-w-xs truncate">{q.question}</td>
              <td className="py-2.5 text-center text-green-600 font-semibold">
                {q.correct}
              </td>
              <td className="py-2.5 text-center text-gray-500">{q.total}</td>
              <td className="py-2.5 text-center">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    q.accuracy >= 70
                      ? 'bg-green-100 text-green-700'
                      : q.accuracy >= 40
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {q.accuracy}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TabSummary = ({ sessionData }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <StatCard
      label="Precisión media"
      value={`${sessionData.precision}%`}
      icon={Target}
      color="indigo"
    />
    <StatCard
      label="Tasa de terminación"
      value={`${sessionData.completion}%`}
      icon={CheckCircle}
      color="green"
    />
    <StatCard
      label="Participantes"
      value={sessionData.participants}
      icon={Users}
      color="blue"
    />
    <StatCard
      label="Preguntas"
      value={sessionData.questions}
      icon={BarChart2}
      color="orange"
    />
  </div>
);

const Stars = ({ rating = 0 }) => (
  <div className="flex gap-0.5 text-lg leading-none">
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s} className={s <= rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
    ))}
  </div>
);

const TabComments = ({ sessionData }) => {
  const feedback = sessionData.feedback || [];

  if (feedback.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="bg-gray-100 p-4 rounded-full w-fit mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-gray-700 font-semibold text-lg mb-1">Sin comentarios aún</h3>
        <p className="text-gray-400 text-sm max-w-xs mx-auto">
          Los comentarios y retroalimentación de los participantes aparecerán aquí
          cuando estén disponibles.
        </p>
      </div>
    );
  }

  const rated = feedback.filter((f) => f.rating > 0);
  const avgRating = rated.length
    ? (rated.reduce((a, f) => a + f.rating, 0) / rated.length).toFixed(1)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-900">{feedback.length}</span>
          <span className="text-sm text-gray-500">{feedback.length === 1 ? 'comentario' : 'comentarios'}</span>
        </div>
        {avgRating && (
          <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
            <Stars rating={Math.round(avgRating)} />
            <span className="text-sm font-semibold text-gray-700">{avgRating} / 5</span>
          </div>
        )}
      </div>

      {feedback.map((f, i) => {
        const displayName =
          f.personnelCode && f.personnelCode !== f.name
            ? `${f.personnelCode} - ${f.name}`
            : f.name || 'Anónimo';
        return (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                  {(f.name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{displayName}</p>
                  {f.cargo && <p className="text-xs text-gray-500">{f.cargo}</p>}
                </div>
              </div>
              {f.rating > 0 && <Stars rating={f.rating} />}
            </div>
            {f.comment ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{f.comment}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">Sin comentario escrito</p>
            )}
            {f.submittedAt && (
              <p className="text-xs text-gray-400 mt-2">
                {new Date(f.submittedAt).toLocaleString('es-ES', {
                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Página principal ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'participants', label: 'Participantes' },
  { id: 'questions', label: 'Preguntas' },
  { id: 'summary', label: 'Resumen' },
  { id: 'comments', label: 'Comentario' },
];

const SessionReport = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('participants');
  const { sessionData, loading } = useSessionReport(sessionId);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <SearchX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-600 mb-2">
            Sesión no encontrada
          </h2>
          <p className="text-gray-500">
            No se pudieron cargar los datos de esta sesión.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <button
        onClick={() => navigate('/myquizzes')}
        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Mis Quizzes
      </button>

      {/* Cabecera con métricas rápidas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
          Sesión en vivo
        </span>
        <h2 className="text-xl font-bold mt-2">{sessionData.title}</h2>
        <p className="text-sm text-gray-500 mb-4">
          {sessionData.date}
          {sessionData.time && ` · ${sessionData.time} hrs`}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5 text-center">
          {[
            { label: 'Precisión', value: `${sessionData.precision}%` },
            { label: 'Terminación', value: `${sessionData.completion}%` },
            { label: 'Participantes', value: sessionData.participants },
            { label: 'Preguntas', value: sessionData.questions },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">{label}</p>
              <p className="text-lg font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => exportToExcel(sessionData)}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            Descargar resultados
          </button>
          <button
            onClick={() => exportToPDF(sessionData)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-shadow text-sm font-semibold"
          >
            <FileText className="w-4 h-4" />
            Generar PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b mb-4 text-sm font-medium">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`pb-2 transition-colors ${
              tab === id
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'participants' && <TabParticipants sessionData={sessionData} />}
      {tab === 'questions' && <TabQuestions sessionData={sessionData} />}
      {tab === 'summary' && <TabSummary sessionData={sessionData} />}
      {tab === 'comments' && <TabComments sessionData={sessionData} />}
    </div>
  );
};

export default SessionReport;
