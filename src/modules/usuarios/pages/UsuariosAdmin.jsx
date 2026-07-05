import React, { useEffect, useState, useMemo } from "react";
import { db } from "../../../firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Users, Search, UserPlus } from "lucide-react";
import { UsuarioListItem } from '../../usuarios';
import NuevoSupervisorModal from "../components/NuevoSupervisorModal";
import EditarUsuarioModal from "../components/EditarUsuarioModal";

export default function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [cuadrillas, setCuadrillas] = useState({});
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const usuariosSnap = await getDocs(collection(db, "usuarios"));
      const usuariosData = usuariosSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsuarios(usuariosData);

      // Agrupar cuadrillas por supervisor desde la colección 'cuadrilla'
      const cuadrillasPorSupervisor = {};
      for (const supervisor of usuariosData.filter((u) => u.rol === "supervisor")) {
        const q = query(
          collection(db, "cuadrilla"),
          where("supervisor_id", "==", supervisor.id)
        );
        const snap = await getDocs(q);
        cuadrillasPorSupervisor[supervisor.id] = snap.docs.map((d) => d.data());
      }
      setCuadrillas(cuadrillasPorSupervisor);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const roles = useMemo(
    () => [...new Set(usuarios.map((u) => u.rol).filter(Boolean))],
    [usuarios]
  );

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      if (filtroRol !== "todos" && u.rol !== filtroRol) return false;
      if (busqueda) {
        const texto = busqueda.toLowerCase();
        const campos = [u.nombre, u.usuario, u.email, u.userName, u.codigo]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!campos.includes(texto)) return false;
      }
      return true;
    });
  }, [usuarios, busqueda, filtroRol]);

  if (loading) {
    return (
      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        <div className="flex flex-col justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600">
            Administra usuarios, supervisores y sus cuadrillas.
          </p>
        </div>
        <button
          onClick={() => setMostrarModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-lg hover:shadow-lg transition-shadow font-medium"
        >
          <UserPlus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none text-sm"
          />
        </div>
        <select
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 focus:border-indigo-500 focus:outline-none capitalize cursor-pointer bg-white"
        >
          <option value="todos">Todos los roles</option>
          {roles.map((rol) => (
            <option key={rol} value={rol} className="capitalize">
              {rol}
            </option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {usuariosFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {usuarios.length === 0
              ? "No hay usuarios registrados"
              : "No se encontraron usuarios"}
          </h3>
          <p className="text-gray-500 text-sm">
            {usuarios.length === 0
              ? "Crea un nuevo usuario para comenzar."
              : "Prueba ajustando la búsqueda o el filtro de rol."}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {usuariosFiltrados.map((user) => (
              <UsuarioListItem
                key={user.id}
                usuario={user}
                cuadrilla={cuadrillas[user.id] || []}
                onActualizado={cargarDatos}
                onEditar={setEditando}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500 text-center mt-4">
            Mostrando {usuariosFiltrados.length} de {usuarios.length} usuarios
          </p>
        </>
      )}

      {mostrarModal && (
        <NuevoSupervisorModal
          onClose={() => setMostrarModal(false)}
          onUsuarioCreado={cargarDatos}
        />
      )}

      {editando && (
        <EditarUsuarioModal
          usuario={editando}
          onClose={() => setEditando(null)}
          onActualizado={cargarDatos}
        />
      )}
    </div>
  );
}
