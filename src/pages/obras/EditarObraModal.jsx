import { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal';
import Field from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import styles from './Obras.module.css';
import { formatMiles, formatQty, parseMiles } from '../../utils/format';

export default function EditarObraModal({ open, onClose, obra, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ nombre: '', descripcion: '', ubicacion: '', presupuesto: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !obra) return;
    setForm({
      nombre: obra.nombre || '',
      descripcion: obra.descripcion || '',
      ubicacion: obra.ubicacion || '',
      presupuesto: obra.presupuesto ?? ''
    });
    setError('');
  }, [open, obra]);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }
    setLoading(true);
    try {
      await api.put(`/api/obras/${obra.id}`, {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        ubicacion: form.ubicacion.trim() || null,
        presupuesto: form.presupuesto ? parseFloat(form.presupuesto) : 0,
        activa: 1
      });
      toast.success('Obra actualizada');
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateMiles(field) {
    return (e) => setForm((f) => ({ ...f, [field]: parseMiles(e.target.value) }))
  }

  if (!obra) return null;

  return (
    <Modal open={open} onClose={onClose} title="Editar obra">
      <form className={styles.formModal} onSubmit={handleSubmit}>
        {error && <div className={styles.formError}>{error}</div>}

        <Field label="Nombre" value={form.nombre} onChange={update('nombre')} required autoFocus />
        <Field label="Ubicación" value={form.ubicacion} onChange={update('ubicacion')} />
        <Field
          label={`Presupuesto (${obra.moneda || 'COP'})`}
          type="text"
          inputMode="numeric"
          value={formatMiles(form.presupuesto)}
          onChange={updateMiles('presupuesto')}
          hint="La divisa de la obra queda fija desde que se creó"
        />
        <Field as="textarea" label="Descripción" value={form.descripcion} onChange={update('descripcion')} />

        <Button type="submit" fullWidth loading={loading}>Guardar cambios</Button>
      </form>
    </Modal>
  );
}
