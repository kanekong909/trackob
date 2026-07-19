import { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal';
import Field from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { api } from '../../api/client';
import styles from './Tareas.module.css';

export default function TareaModal({ open, onClose, obraId, colaboradores, tarea, onSaved }) {
  const editando = Boolean(tarea);

  const [form, setForm] = useState({ titulo: '', descripcion: '', fecha_limite: '', asignado_a: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      titulo: tarea?.titulo || '',
      descripcion: tarea?.descripcion || '',
      fecha_limite: tarea?.fecha_limite ? tarea.fecha_limite.split('T')[0] : '',
      asignado_a: tarea?.asignado_a || ''
    });
    setError('');
  }, [open, tarea]);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.titulo.trim()) {
      setError('El título es requerido');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        obra_id: obraId,
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || null,
        fecha_limite: form.fecha_limite || null,
        asignado_a: form.asignado_a || null
      };
      const saved = editando
        ? await api.put(`/api/tareas/${tarea.id}`, payload)
        : await api.post('/api/tareas', payload);

      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editando ? 'Editar tarea' : 'Nueva tarea'}>
      <form className={styles.formModal} onSubmit={handleSubmit}>
        {error && <div className={styles.formError}>{error}</div>}

        <Field
          label="Título"
          placeholder="Ej. Vaciado de placa 2do piso"
          value={form.titulo}
          onChange={update('titulo')}
          required
          autoFocus
        />

        <Field
          as="textarea"
          label="Descripción"
          placeholder="Detalles de la tarea (opcional)"
          value={form.descripcion}
          onChange={update('descripcion')}
        />

        <div className={styles.row2}>
          <Field
            as="select"
            label="Asignar a"
            value={form.asignado_a}
            onChange={update('asignado_a')}
          >
            <option value="">Sin asignar</option>
            {colaboradores.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </Field>
          <Field
            label="Fecha límite"
            type="date"
            value={form.fecha_limite}
            onChange={update('fecha_limite')}
          />
        </div>

        <Button type="submit" fullWidth loading={loading}>
          {editando ? 'Guardar cambios' : 'Crear tarea'}
        </Button>
      </form>
    </Modal>
  );
}
