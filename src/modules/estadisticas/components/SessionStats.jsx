// Updated QuizDetails.jsx con modal de exportación PDF/Excel
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { FiEye, FiEdit, FiTarget, FiEyeOff } from 'react-icons/fi';
import { FaGamepad } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const QuizDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [showAnswers, setShowAnswers] = useState(true);
  const [activeTab, setActiveTab] = useState('questions');
  const [showExportModal, setShowExportModal] = useState(false);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const fetchQuiz = async () => {
      const docRef = doc(db, 'quizzes', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setQuiz({ id: docSnap.id, ...docSnap.data() });
      }
    };

    const fetchSessions = async () => {
      const sessionRef = collection(db, 'sessions');
      const snapshot = await getDocs(sessionRef);
      const filtered = snapshot.docs.filter(doc => doc.data().quizId === id)
        .map(doc => ({ id: doc.id, ...doc.data() }));
      setSessions(filtered);
    };

    fetchQuiz();
    fetchSessions();
  }, [id]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Estadísticas de Sesiones', 14, 10);
    const tableData = sessions.map((s, i) => [
      i + 1,
      s.title || `Sesión ${i + 1}`,
      s.date || 'Sin fecha',
      `${s.precision || 0}%`,
      `${s.participants || 0}`
    ]);
    doc.autoTable({
      head: [['#', 'Título', 'Fecha', 'Precisión', 'Participantes']],
      body: tableData,
    });
    doc.save('estadisticas_sesiones.pdf');
    setShowExportModal(false);
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(sessions);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sesiones');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'estadisticas_sesiones.xlsx');
    setShowExportModal(false);
  };

  if (!quiz) return <p className="text-center mt-10">Cargando...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded shadow p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{quiz.title}</h2>
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-4">
              <span className="flex items-center gap-1"><FiTarget /> 0% precisión</span>
              <span className="flex items-center gap-1"><FaGamepad /> 0 jugadas</span>
            </p>
          </div>
          <div className="space-x-2 flex items-center">
            <button onClick={() => navigate(`/preview/${id}`)} className="flex items-center gap-1 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
              <FiEye /> Vista previa
            </button>
            <button onClick={() => navigate(`/edit/${id}`)} className="flex items-center gap-1 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
              <FiEdit /> Continuar editando
            </button>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            onClick={() => navigate(`/live/${quiz.id}`)}
          >
            ▶ Iniciar sesión en vivo
          </button>
          <button
            className="bg-gray-100 text-purple-600 px-4 py-2 rounded border border-purple-600 hover:bg-purple-50"
            onClick={() => setShowExportModal(true)}
          >
            📊 Exportar estadísticas
          </button>
        </div>
      </div>

      {/* Modal de exportación */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-[90%] max-w-md">
            <h3 className="text-lg font-bold mb-4">Exportar estadísticas de sesiones</h3>
            <div className="flex flex-col gap-4">
              <button onClick={exportPDF} className="bg-purple-600 text-white py-2 rounded hover:bg-purple-700">Descargar PDF</button>
              <button onClick={exportExcel} className="bg-green-600 text-white py-2 rounded hover:bg-green-700">Descargar Excel</button>
              <button onClick={() => setShowExportModal(false)} className="text-sm text-gray-500 hover:underline">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Aquí continuarías con el resto del contenido como las tabs, preguntas, sesiones, etc. */}
    </div>
  );
};

export default QuizDetails;
