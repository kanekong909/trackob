import { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal';
import Field from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { api } from '../../api/client';
import styles from './Bitacora.module.css';

export default function NotaModal({ open, onClose, obraId, nota, fechasExistentes, onSaved }) {
  const [fecha, setFecha] = useState('');
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !nota) return;
    setFecha(nota.fecha ? nota.fecha.split('T')[0] : '');
    setTexto(nota.nota || '');
    setError('');
  }, [open, nota]);

  const fechaOriginal = nota?.fecha ? nota.fecha.split('T')[0] : null;
  const yaExisteOtraNota = fecha !== fechaOriginal && fechasExistentes?.includes(fecha);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!texto.trim()) {
      setError('Escribe algo para guardar la nota');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/bitacora', { obra_id: obraId, fecha, nota: texto.trim() });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!nota) return null;

  return (
    <Modal open={open} onClose={onClose} title="Nota de bitácora">
      <form className={styles.formModal} onSubmit={handleSubmit}>
        {error && <div className={styles.formError}>{error}</div>}

        <Field label="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />

        {yaExisteOtraNota && (
          <div className={styles.warning}>
            Ya existe una nota para ese día — si guardas, se reemplaza por esta.
          </div>
        )}

        <Field
          as="textarea"
          label="¿Qué pasó hoy en la obra?"
          placeholder="Avance del día, personal en sitio, clima, materiales que llegaron, observaciones…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          required
          autoFocus
        />

        <Button type="submit" fullWidth loading={loading}>Guardar nota</Button>
      </form>
    </Modal>
  );
}
