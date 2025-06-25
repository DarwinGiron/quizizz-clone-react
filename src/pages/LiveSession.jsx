// LiveSession.jsx actualizado con Realtime Database
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ref, onValue, set } from 'firebase/database';
import { rtdb } from '../firebase/config'; // Asegúrate de exportar tu RTDB en config.js
import { QRCodeCanvas } from 'qrcode.react';


const LiveSession = () => {
  const { id: quizId } = useParams();
  const [sessionId] = useState(() => `${quizId}-${Date.now()}`); // ID fijo para esta sesión
  const [participants, setParticipants] = useState([]);
  const [showQR, setShowQR] = useState(false);

  const joinLink = `${window.location.origin}/join/${sessionId}`;

  useEffect(() => {
    const participantsRef = ref(rtdb, `liveSessions/${sessionId}/participants`);

    const unsubscribe = onValue(participantsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.values(data) : [];
      setParticipants(list);
    });

    return () => unsubscribe();
  }, [sessionId]);

  return (
    <div className="h-screen w-full bg-gradient-to-br from-purple-800 to-black text-white font-sans relative overflow-hidden">
      <div className="max-w-4xl mx-auto pt-12 px-6">
        <div className="border border-purple-600 rounded-lg p-6 flex flex-col sm:flex-row justify-between items-center bg-black bg-opacity-30 backdrop-blur-md shadow-xl">
          {/* Instrucciones + Código */}
          <div className="space-y-3 text-center sm:text-left">
            <p className="uppercase text-xs text-gray-400">1. ÚNETE USANDO CUALQUIER DISPOSITIVO</p>
            <p className="font-semibold text-white text-md">{joinLink}</p>
            <p className="uppercase text-xs text-gray-400">2. INTRODUCE EL CÓDIGO DE UNIÓN</p>
            <p className="text-4xl font-bold tracking-widest">{sessionId.slice(-6).toUpperCase()}</p>
          </div>

          {/* QR */}
          <div className="flex flex-col items-center mt-6 sm:mt-0 gap-3">
            <div onClick={() => setShowQR(true)} className="cursor-pointer">
              <QRCodeCanvas
                value={`https://join.myquiz.com/${sessionId}`}
                size={100}
                bgColor="#FFFFFF"
                fgColor="#000000"
                className="cursor-pointer hover:scale-105 transition"
                onClick={() => setShowQR(true)}
              />
              <p className="text-xs text-center mt-1">Share via QR</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <button className="bg-purple-600 hover:bg-purple-700 text-white w-full max-w-md py-3 rounded-full text-lg font-semibold shadow transition-all">
            EMPEZAR
          </button>
        </div>
      </div>

      {/* Lista de participantes */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50">
        <p className="text-center text-sm text-white animate-pulse">
          👥 Esperando a los participantes...
        </p>
        <div className="flex flex-wrap justify-center mt-2 gap-2">
          {participants.map((p, i) => (
            <div key={i} className="bg-purple-700 px-3 py-1 rounded-full text-xs">{p.name || `Participante ${i + 1}`}</div>
          ))}
        </div>
      </div>

      {/* Modal QR grande */}
      {showQR && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="relative bg-white p-4 rounded-lg shadow-lg">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-2 right-2 text-gray-700 hover:text-black text-lg"
            >
              ✖
            </button>
            <QRCodeCanvas
              value={`https://join.myquiz.com/${sessionId}`}
              size={300}
              bgColor="#FFFFFF"
              fgColor="#000000"
            />

          </div>
        </div>
      )}
    </div>
  );
};

export default LiveSession;