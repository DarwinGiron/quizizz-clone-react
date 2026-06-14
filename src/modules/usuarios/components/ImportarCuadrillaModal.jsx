// ImportarCuadrillaModal.jsx CORREGIDO para guardar en 'cuadrilla'

import React, { useState } from "react";
import * as XLSX from "xlsx";
import { db } from "../../../firebase/config";
import { collection, addDoc } from "firebase/firestore";
import { UploadCloud } from "lucide-react";

export default function ImportarCuadrillaModal({ supervisorId, onClose, onImportado }) {
  const [archivo, setArchivo] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      alert("Solo se permiten archivos .xlsx o .xls");
      return;
    }
    setArchivo(file);
  };

  const importar = async () => {
    if (!archivo) return alert("Selecciona un archivo Excel válido.");

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const filas = XLSX.utils.sheet_to_json(sheet);

      let importados = 0;
      let errores = [];

      for (let i = 0; i < filas.length; i++) {
        const fila = filas[i];
        const nombre = fila["NOMBRE"]?.toString().trim();
        const codigo = fila["CODIGO NUEVO"]?.toString().trim() || "";
        const area = fila["MAQUINA / AREA"]?.toString().trim();
        const esVacante = nombre?.toLowerCase().includes("vacante");

        if (!nombre || !area) {
          errores.push(`Fila ${i + 2}: datos incompletos`);
          continue;
        }

        try {
          await addDoc(collection(db, "cuadrilla"), {
            nombre,
            codigo,
            area,
            tipo: esVacante ? "casual" : "fijo",
            supervisor_id: supervisorId,
          });
          importados++;
        } catch (error) {
          errores.push(`Fila ${i + 2}: error al guardar`);
        }
      }

      if (errores.length > 0) {
        alert(`${importados} importados.\n\nErrores:\n${errores.join("\n")}`);
      } else {
        alert(`${importados} miembros importados correctamente.`);
      }

      onImportado();
      onClose();
    };

    reader.readAsArrayBuffer(archivo);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setArrastrando(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
        <h2 className="text-xl font-bold text-purple-700 mb-4">Importar Cuadrilla</h2>

        <div
          onDrop={onDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          className={`border-dashed border-2 rounded-lg flex flex-col justify-center items-center text-center transition
            ${arrastrando ? "border-purple-500 bg-purple-50" : "border-gray-300 bg-gray-50"}
            h-44 mb-6`}
        >
          <UploadCloud className="h-10 w-10 text-purple-500 mb-2" />
          <p className="text-gray-600 text-sm">
            Arrastra y suelta aquí tu archivo Excel
          </p>
          {archivo && (
            <p className="mt-2 text-purple-700 font-medium text-sm">{archivo.name}</p>
          )}
        </div>

        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => handleFile(e.target.files[0])}
          className="mb-4 w-full"
        />

        <p className="text-xs text-gray-500 mb-4">
          Se esperan columnas: <strong>NOMBRE</strong>, <strong>CODIGO NUEVO</strong>, <strong>MAQUINA / AREA</strong>.
          Las vacantes pueden tener el código vacío.
        </p>

        <div className="flex justify-end space-x-2">
          <button
            onClick={() => {
              setArchivo(null);
              onClose();
            }}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={importar}
            disabled={!archivo}
            className={`px-4 py-2 rounded text-white ${
              archivo ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Importar
          </button>
        </div>
      </div>
    </div>
  );
}
