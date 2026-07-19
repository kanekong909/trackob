import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Field from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { MONEDAS } from '../../utils/format';
import styles from './Obras.module.css';

export default function CrearObraModal({ open, onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState({ nombre: '', descripcion: '', ubicacion: '', presupuesto: '', moneda: 'COP' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleClose() {
    setForm({ nombre: '', descripcion: '', ubicacion: '', presupuesto: '', moneda: 'COP' });
    setError('');
    onClose();
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
      const obra = await api.post('/api/obras', {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        ubicacion: form.ubicacion.trim() || null,
        presupuesto: form.presupuesto ? parseFloat(form.presupuesto) : 0,
        moneda: form.moneda
      });
      onCreated(obra);
      toast.success('Obra creada');
      handleClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Nueva obra">
      <form className={styles.formModal} onSubmit={handleSubmit}>
        {error && <div className={styles.formError}>{error}</div>}
        <Field
          label="Nombre"
          placeholder="Ej. Edificio Los Robles"
          value={form.nombre}
          onChange={update('nombre')}
          required
          autoFocus
        />
        <Field
          label="Ubicación"
          placeholder="Ej. Barranquilla, Atlántico"
          value={form.ubicacion}
          onChange={update('ubicacion')}
        />
        <div className={styles.row2}>
          <Field
            label="Presupuesto"
            type="number"
            min="0"
            step="1000"
            placeholder="0"
            value={form.presupuesto}
            onChange={update('presupuesto')}
          />
          <Field as="select" label="Divisa" value={form.moneda} onChange={update('moneda')}>
            {Object.entries(MONEDAS).map(([code, cfg]) => (
              <option key={code} value={code}>{code} — {cfg.nombre}</option>
            ))}
          </Field>
        </div>
        <p className={styles.monedaHint}>La divisa no se puede cambiar después de crear la obra</p>
        <Field
          as="textarea"
          label="Descripción"
          placeholder="Notas generales sobre la obra (opcional)"
          value={form.descripcion}
          onChange={update('descripcion')}
        />
        <Button type="submit" fullWidth loading={loading}>Crear obra</Button>
      </form>
    </Modal>
  );
}
