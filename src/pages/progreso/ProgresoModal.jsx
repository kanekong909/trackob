import { useRef, useState } from 'react';
import Modal from '../../components/ui/Modal';
import Field from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { api } from '../../api/client';
import styles from './Progreso.module.css';

function hoy() {
  return new Date().toISOString().split('T')[0];
}

export default function ProgresoModal({ open, onClose, obraId, etapasExistentes, onCreated }) {
  const fileRef = useRef(null);
  const [fecha, setFecha] = useState(hoy());
  const [etapa, setEtapa] = useState('');
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
    setFecha(hoy());
    setEtapa('');
    setFoto(null);
    setFotoPreview(null);
    setError('');
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!foto) {
      setError('La foto es obligatoria');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('obra_id', obraId);
      fd.append('fecha', fecha);
      if (etapa.trim()) fd.append('etapa', etapa.trim());
      fd.append('foto', foto);

      await api.post('/api/progreso', fd, { isForm: true });
      onCreated();
      resetAndClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={resetAndClose} title="Nueva foto de avance">
      <form className={styles.formModal} onSubmit={handleSubmit}>
        {error && <div className={styles.formError}>{error}</div>}

        {fotoPreview ? (
          <div className={styles.fotoPreview}>
            <img src={fotoPreview} alt="Vista previa" />
            <button type="button" className={styles.fotoRemove} onClick={quitarFoto}>Quitar foto</button>
          </div>
        ) : (
          <label className={styles.fotoUpload}>
            📷 Tomar foto o adjuntar
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFotoChange} hidden />
          </label>
        )}

        <div className={styles.row2}>
          <Field label="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          <Field
            label="Etapa"
            placeholder="Ej. Cimentación"
            value={etapa}
            onChange={(e) => setEtapa(e.target.value)}
            list="etapas-existentes"
          />
        </div>
        {etapasExistentes?.length > 0 && (
          <datalist id="etapas-existentes">
            {etapasExistentes.map((e) => <option key={e} value={e} />)}
          </datalist>
        )}

        <Button type="submit" fullWidth loading={loading}>Guardar foto</Button>
      </form>
    </Modal>
  );
}
