import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { DEFAULT_TURNOS_CONFIG } from '../utils/turnos';

const CONFIG_REF = ['config', 'turnos'];

// Carga la configuración de los 3 turnos (nombre + horario) desde
// Firestore (config/turnos). Si el admin nunca la ha guardado, usa los
// valores por defecto sin escribir nada (evita escrituras innecesarias
// en cada carga de página).
const useTurnosConfig = () => {
  const [turnos, setTurnos] = useState(DEFAULT_TURNOS_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      try {
        const snap = await getDoc(doc(db, ...CONFIG_REF));
        if (activo && snap.exists()) {
          setTurnos({ ...DEFAULT_TURNOS_CONFIG, ...snap.data() });
        }
      } catch (error) {
        console.error('Error al cargar configuración de turnos:', error);
      } finally {
        if (activo) setLoading(false);
      }
    };
    cargar();
    return () => {
      activo = false;
    };
  }, []);

  const guardarTurnos = useCallback(async (nuevaConfig) => {
    await setDoc(doc(db, ...CONFIG_REF), nuevaConfig);
    setTurnos(nuevaConfig);
  }, []);

  return { turnos, loading, guardarTurnos };
};

export default useTurnosConfig;
