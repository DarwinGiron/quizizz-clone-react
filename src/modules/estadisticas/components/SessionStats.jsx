// Updated QuizDetails.jsx con modal de exportación PDF/Excel
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { Eye, Pencil, Target, Gamepad2, Play, Download, FileSpreadsheet } from 'lucide-react';
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
              <span className="flex items-center gap-1"><Target className="w-4 h-4" /> 0% precisión</span>
              <span className="flex items-center gap-1"><Gamepad2 className="w-4 h-4" /> 0 jugadas</span>
            </p>
          </div>
          <div className="space-x-2 flex items-center">
            <button onClick={() => navigate(`/preview/${id}`)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              <Eye className="w-4 h-4" /> Vista previa
            </button>
            <button onClick={() => navigate(`/edit/${id}`)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              <Pencil className="w-4 h-4" /> Continuar editando
            </button>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-shadow font-semibold"
            onClick={() => navigate(`/live/${quiz.id}`)}
          >
            <Play className="w-4 h-4" /> Iniciar sesión en vivo
          </button>
          <button
            className="bg-white text-indigo-600 px-4 py-2 rounded-lg border border-indigo-300 hover:bg-indigo-50 transition-colors font-semibold"
            onClick={() => setShowExportModal(true)}
          >
            Exportar estadísticas
          </button>
        </div>
      </div>

      {/* Modal de exportación */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Exportar estadísticas de sesiones</h3>
            <div className="flex flex-col gap-3">
              <button onClick={exportPDF} className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-lg hover:shadow-lg transition-shadow font-semibold">
                <Download className="w-4 h-4" /> Descargar PDF
              </button>
              <button onClick={exportExcel} className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition-colors font-semibold">
                <FileSpreadsheet className="w-4 h-4" /> Descargar Excel
              </button>
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
