import { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal';
import Field from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatDate, cloudinaryThumb } from '../../utils/format';
import styles from './Progreso.module.css';

export default function FotoDetailModal({ open, onClose, foto, etapasExistentes, onUpdated, onDelete }) {
  const { usuario } = useAuth();
  const [editando, setEditando] = useState(false);
  const [fecha, setFecha] = useState('');
  const [etapa, setEtapa] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!foto) return;
    setFecha(foto.fecha ? foto.fecha.split('T')[0] : '');
    setEtapa(foto.etapa || '');
    setEditando(false);
    setError('');
  }, [foto]);

  if (!foto) return null;

  const puedeEliminar = Number(foto.usuario_id) === Number(usuario?.id);

  async function guardar(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.put(`/api/progreso/${foto.id}`, { fecha, etapa: etapa.trim() || null });
      onUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Foto de avance">
      <div className={styles.detail}>
        <img src={cloudinaryThumb(foto.foto_url, 1000)} alt={foto.etapa || 'Avance de obra'} className={styles.detailFoto} />

        {editando ? (
          <form className={styles.formModal} onSubmit={guardar}>
            {error && <div className={styles.formError}>{error}</div>}
            <div className={styles.row2}>
              <Field label="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
              <Field label="Etapa" value={etapa} onChange={(e) => setEtapa(e.target.value)} list="etapas-existentes" />
            </div>
            {etapasExistentes?.length > 0 && (
              <datalist id="etapas-existentes">
                {etapasExistentes.map((e) => <option key={e} value={e} />)}
              </datalist>
            )}
            <div className={styles.detailActions}>
              <Button type="button" variant="ghost" onClick={() => setEditando(false)}>Cancelar</Button>
              <Button type="submit" loading={loading}>Guardar</Button>
            </div>
          </form>
        ) : (
          <>
            <div className={styles.detailMeta}>
              {foto.etapa && <span className={styles.detailEtapa}>{foto.etapa}</span>}
              <span className={styles.detailFecha}>{formatDate(foto.fecha)}</span>
              <span className={styles.detailAutor}>Subida por {foto.usuario_nombre}</span>
            </div>
            <div className={styles.detailActions}>
              <Button variant="outline" onClick={() => setEditando(true)}>Editar fecha / etapa</Button>
              {puedeEliminar && (
                <Button variant="danger" onClick={() => onDelete(foto)}>Eliminar</Button>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
