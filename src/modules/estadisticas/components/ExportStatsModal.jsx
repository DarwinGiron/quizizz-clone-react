// src/components/ExportStatsModal.jsx
import React from 'react';
import { FaFilePdf, FaFileExcel, FaTimes } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ExportStatsModal = ({ onClose, sessionData }) => {
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(sessionData.title, 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [['Nombre', 'Precisión', 'Puntos']],
      body: sessionData.users.map(user => [
        user.name,
        `${user.precision}%`,
        user.score
      ])
    });

    doc.save(`estadisticas_${sessionData.date}.pdf`);
    onClose();
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(sessionData.users.map(user => ({
      Nombre: user.name,
      Precisión: `${user.precision}%`,
      Puntos: user.score
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Estadísticas');
    XLSX.writeFile(workbook, `estadisticas_${sessionData.date}.xlsx`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h2 className="text-lg font-bold text-gray-800">Exportar estadísticas</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={exportPDF}
            className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            <FaFilePdf /> Descargar PDF
          </button>

          <button
            onClick={exportExcel}
            className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            <FaFileExcel /> Descargar Excel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportStatsModal;
