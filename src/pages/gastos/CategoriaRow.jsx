import { useState } from 'react';
import styles from './CategoriasModal.module.css';
import { Trash2 } from "lucide-react";

export default function CategoriaRow({ categoria, onSave, onDelete }) {
  const [nombre, setNombre] = useState(categoria.nombre);
  const [color, setColor] = useState(categoria.color || '#6366f1');
  const [tipo, setTipo] = useState(categoria.tipo || 'egreso');
  const [guardando, setGuardando] = useState(false);

  const dirty = nombre !== categoria.nombre || color !== (categoria.color || '#6366f1') || tipo !== (categoria.tipo || 'egreso');

  async function guardar() {
    setGuardando(true);
    await onSave(categoria.id, { nombre, color, tipo });
    setGuardando(false);
  }

  return (
    <div className={styles.row}>
      <input
        type="color"
        className={styles.colorInput}
        value={color}
        onChange={(e) => setColor(e.target.value)}
        title="Color de la categoría"
      />
      <input
        type="text"
        className={styles.nombreInput}
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />
      <select className={styles.tipoSelect} value={tipo} onChange={(e) => setTipo(e.target.value)}>
        <option value="egreso">Gasto</option>
        <option value="ingreso">Ingreso</option>
      </select>
      {categoria.es_global ? (
        <span className={styles.globalBadge} title="Categoría por defecto, disponible en todas las obras">Global</span>
      ) : (
        <button 
          type="button" 
          className={styles.deleteBtn} 
          onClick={() => onDelete(categoria)} 
          aria-label="Eliminar categoría"
        >
          <Trash2 size={14} />
        </button>
      )}
      {dirty && (
        <button type="button" className={styles.saveBtn} onClick={guardar} disabled={guardando}>
          {guardando ? '…' : 'Guardar'}
        </button>
      )}
    </div>
  );
}
