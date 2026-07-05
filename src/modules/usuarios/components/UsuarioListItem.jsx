import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { ShieldAlert, ShieldCheck, KeyRound, ChevronRight } from 'lucide-react';
import { db } from '../../../firebase/config';
import { useToast, usuarioToEmail, crearCuentaAuth } from '../../../shared';

// Modal para migrar un supervisor legacy (contraseña en texto plano en
// Firestore) a una cuenta real de Firebase Auth. Ver SEGURIDAD.md.
const ActivarAccesoModal = ({ usuario, onClose, onActivado }) => {
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [guardando, setGuardando] = useState(false);

  const handleActivar = async () => {
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setGuardando(true);
    try {
      const authUid = await crearCuentaAuth(usuarioToEmail(usuario.usuario), password);
      await updateDoc(doc(db, 'usuarios', usuario.id), {
        authUid,
        contraseña: deleteField(),
        contrasena: deleteField(),
        password: deleteField(),
      });
      toast.success(
        `Acceso activado. Comunícale a ${usuario.nombre || usuario.usuario} su nueva contraseña.`
      );
      onActivado();
      onClose();
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Ya existe una cuenta de acceso para este usuario.');
      } else {
        console.error('Error al activar acceso seguro:', error);
        toast.error('No se pudo activar el acceso. Intenta de nuevo.');
      }
      setGuardando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <KeyRound className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Activar acceso seguro</h3>
            <p className="text-xs text-gray-500">{usuario.nombre || usuario.usuario}</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Crea una contraseña nueva para este supervisor. Reemplaza la contraseña
          en texto plano por una cuenta real y protegida.
        </p>
        <input
          type="password"
          placeholder="Nueva contraseña (mín. 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 p-2.5 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={guardando}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            onClick={handleActivar}
            disabled={guardando}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg transition-shadow disabled:opacity-60"
          >
            {guardando && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {guardando ? 'Activando...' : 'Activar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Fila de la lista de usuarios. Al hacer clic:
// - Si es supervisor -> navega a su cuadrilla (con botón de edición ahí).
// - Si no -> abre directamente el modal de edición (no tiene cuadrilla).
const UsuarioListItem = ({ usuario, cuadrilla, onActualizado, onEditar }) => {
  const navigate = useNavigate();
  const [mostrarActivar, setMostrarActivar] = useState(false);

  const nombre = usuario?.nombre || usuario?.usuario || usuario?.email || 'Usuario';
  const rol = usuario?.rol || 'Sin rol';
  const isSupervisor = rol === 'supervisor';
  const tieneAccesoSeguro = Boolean(usuario?.authUid);

  const handleClick = () => {
    if (isSupervisor) {
      navigate(`/cuadrilla/${usuario.id}`);
    } else {
      onEditar(usuario);
    }
  };

  return (
    <>
      <div
        onClick={handleClick}
        className="flex items-center justify-between gap-4 px-5 py-4 bg-white border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
            {nombre.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{nombre}</p>
            <p className="text-sm text-gray-500 truncate">
              {usuario?.usuario || usuario?.email || 'Sin usuario'}
              {usuario?.codigo ? ` · ${usuario.codigo}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:inline-block text-xs font-medium capitalize px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
            {rol}
          </span>

          {isSupervisor && (
            <span className="hidden md:inline text-xs text-gray-400">
              {cuadrilla?.length || 0} en cuadrilla
            </span>
          )}

          {isSupervisor && (
            tieneAccesoSeguro ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Seguro</span>
              </span>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMostrarActivar(true);
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-full transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Activar acceso</span>
              </button>
            )
          )}

          <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
        </div>
      </div>

      {mostrarActivar && (
        <ActivarAccesoModal
          usuario={usuario}
          onClose={() => setMostrarActivar(false)}
          onActivado={() => onActualizado && onActualizado()}
        />
      )}
    </>
  );
};

export default UsuarioListItem;
