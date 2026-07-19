import { useRef, useState } from 'react';
import Modal from '../../components/ui/Modal';
import Field from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { api } from '../../api/client';
import styles from './Novedades.module.css';

export default function NovedadModal({ open, onClose, obraId, onCreated }) {
  const fileRef = useRef(null);
  const [descripcion, setDescripcion] = useState('');
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleFotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFoto(file);
    setFotoPreview(URL.createObjectURL(file));
  }

  function quitarFoto() {
    setFoto(null);
    setFotoPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  function resetAndClose() {
    setDescripcion('');
    setFoto(null);
    setFotoPreview(null);
    setError('');
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!descripcion.trim()) {
      setError('Describe lo que pasó');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('obra_id', obraId);
      fd.append('descripcion', descripcion.trim());
      if (foto) fd.append('foto', foto);

      const saved = await api.post('/api/novedades', fd, { isForm: true });
      onCreated(saved);
      resetAndClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={resetAndClose} title="Reportar novedad">
      <form className={styles.formModal} onSubmit={handleSubmit}>
        {error && <div className={styles.formError}>{error}</div>}

        <Field
          as="textarea"
          label="¿Qué pasó?"
          placeholder="Ej. Se dañó el andamio del segundo piso, no se puede seguir trabajando ahí"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          required
          autoFocus
        />

        <div className={styles.fieldGroup}>
          <span className={styles.groupLabel}>Foto (opcional)</span>
          {fotoPreview ? (
            <div className={styles.fotoPreview}>
              <img src={fotoPreview} alt="Foto del incidente" />
              <button type="button" className={styles.fotoRemove} onClick={quitarFoto}>Quitar foto</button>
            </div>
          ) : (
            <label className={styles.fotoUpload}>
              📷 Tomar foto o adjuntar
              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFotoChange} hidden />
            </label>
          )}
        </div>

        <Button type="submit" fullWidth loading={loading}>Reportar</Button>
      </form>
    </Modal>
  );
}
