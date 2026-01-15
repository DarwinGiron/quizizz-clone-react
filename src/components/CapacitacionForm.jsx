import React from 'react';
import { Calendar, Clock, MapPin, Users, BookOpen, Type, Save, Trash2 } from 'lucide-react';

const CapacitacionForm = ({ 
    form, 
    setForm, 
    handleSubmit, 
    handleDelete, 
    loading, 
    mode = 'create'
}) => {

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const isViewMode = mode === 'view';

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-4">
            <div className="bg-secondary p-5 rounded-xl border border-border-secondary space-y-4">
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2"><BookOpen size={20}/> Detalles Generales</h2>
                <fieldset disabled={isViewMode} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium flex items-center gap-2 mb-1"><Type size={16}/> Título</label>
                        <input type="text" name="titulo" placeholder="Ej: Seguridad en Alturas Nivel Avanzado" value={form.titulo} onChange={handleChange} required className="w-full p-2 bg-primary border-border rounded-md disabled:opacity-75 text-sm" />
                    </div>
                    <div>
                        <label className="text-sm font-medium flex items-center gap-2 mb-1">Descripción</label>
                        <textarea name="descripcion" placeholder="Detalles sobre el contenido, objetivos, etc." value={form.descripcion} onChange={handleChange} className="w-full p-2 bg-primary border-border rounded-md disabled:opacity-75 text-sm" rows="3"></textarea>
                    </div>
                </fieldset>
            </div>

            <div className="bg-secondary p-5 rounded-xl border border-border-secondary space-y-4">
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2"><Calendar size={20}/> Programación de Horarios</h2>
                <fieldset disabled={isViewMode} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium flex items-center gap-2 mb-1">Fecha de Inicio</label>
                        <input type="date" name="fecha_inicio" value={form.fecha_inicio} onChange={handleChange} required className="w-full p-2 bg-primary border-border rounded-md disabled:opacity-75 text-sm"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium flex items-center gap-2 mb-1">Fecha de Fin (opcional)</label>
                        <input type="date" name="fecha_fin" value={form.fecha_fin} onChange={handleChange} min={form.fecha_inicio} className="w-full p-2 bg-primary border-border rounded-md disabled:opacity-75 text-sm"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium flex items-center gap-2 mb-1"><Clock size={16}/> Hora de Inicio</label>
                        <input type="time" name="hora_inicio" value={form.hora_inicio} onChange={handleChange} required className="w-full p-2 bg-primary border-border rounded-md disabled:opacity-75 text-sm"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium flex items-center gap-2 mb-1"><Clock size={16}/> Hora de Fin</label>
                        <input type="time" name="hora_fin" value={form.hora_fin} onChange={handleChange} required className="w-full p-2 bg-primary border-border rounded-md disabled:opacity-75 text-sm"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium flex items-center gap-2 mb-1"><MapPin size={16}/> Salón o Ubicación</label>
                        <input type="text" name="salon" placeholder="Ej: Salón A, Sala de Juntas" value={form.salon} onChange={handleChange} required className="w-full p-2 bg-primary border-border rounded-md disabled:opacity-75 text-sm"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium flex items-center gap-2 mb-1"><Users size={16}/> Cupo por Sesión</label>
                        <input type="number" name="cupoPorBloque" value={form.cupoPorBloque} onChange={handleChange} min="1" className="w-full p-2 bg-primary border-border rounded-md disabled:opacity-75 text-sm" />
                    </div>
                </fieldset>
                
                {!isViewMode && (
                    <div className="flex justify-between items-center border-t border-border pt-4 mt-4">
                        {mode === 'edit' && handleDelete && (
                            <button type="button" onClick={handleDelete} disabled={loading} className="flex items-center gap-2 bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm">
                                <Trash2 size={16} />
                                Eliminar
                            </button>
                        )}
                        <button type="submit" disabled={loading} className="flex items-center gap-2 bg-accent-strong text-accent-text font-bold py-2 px-5 rounded-lg hover:bg-accent transition-colors ml-auto text-sm">
                            <Save size={16}/>
                            {loading ? 'Guardando...' : (mode === 'create' ? 'Guardar y Generar' : 'Guardar Cambios')}
                        </button>
                    </div>
                )}
            </div>
        </form>
    );
};

export default CapacitacionForm;
